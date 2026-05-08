const mongoose = require('mongoose');
const Room = require('../models/Room');
const { User } = require('../models/User');

// ==========================================
// Helpers  
// ==========================================
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data })
    });
};

const sendError = (res, statusCode, message, errorDetails = null) => {
    const response = { success: false, message };
    if (errorDetails && process.env.NODE_ENV === 'development') {
        response.error = errorDetails;
    }
    return res.status(statusCode).json(response);
};

// ==========================================
// GET /api/rooms
// ==========================================
exports.getAllRooms = async (req, res) => {
    try {
        const userRole = req.userDoc.role;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.buildingId) filter.buildingId = req.query.buildingId;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.floorNumber) filter.floorNumber = parseInt(req.query.floorNumber);

        let query = Room.find(filter).populate('buildingId', 'name gender');

        if (userRole === 'admin' || userRole === 'supervisor') {
            query = query.populate('currentOccupants', 'name email studentId');
        }

        const [rooms, total] = await Promise.all([
            query.sort({ buildingId: 1, roomNumber: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Room.countDocuments(filter)
        ]);

        // After your query and before sendSuccess
        if (userRole === 'student') {
            const shapedRooms = rooms.map(room => ({
                id: room._id,
                roomNumber: room.roomNumber,
                floorNumber: room.floorNumber,
                capacity: room.capacity,
                status: room.status,
                building: room.buildingId
                    ? { id: room.buildingId._id, name: room.buildingId.name, gender: room.buildingId.gender }
                    : null,
                amenities: room.amenities || []
            }));
            return sendSuccess(res, 200, 'Rooms fetched successfully', {
                rooms: shapedRooms,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) }
            });
        }
        return sendSuccess(res, 200, 'Rooms fetched successfully', {
            rooms,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get All Rooms Error:', error);
        return sendError(res, 500, 'Failed to fetch rooms', error.message);
    }
};

// ==========================================
// GET /api/rooms/available
// ==========================================
exports.getAvailableRooms = async (req, res) => {
    try {
        const userRole = req.userDoc.role;
        const filter = { status: 'available' };

        if (req.query.buildingId) filter.buildingId = req.query.buildingId;
        if (req.query.floorNumber) filter.floorNumber = parseInt(req.query.floorNumber);

        const rooms = await Room.find(filter)
            .populate('buildingId', 'name gender')
            .sort({ buildingId: 1, roomNumber: 1 })
            .lean();

        if (userRole === 'student') {
            const shapedRooms = rooms.map(room => ({
                id: room._id,
                roomNumber: room.roomNumber,
                floorNumber: room.floorNumber,
                capacity: room.capacity,
                status: room.status,
                amenities: room.amenities || [],
                building: room.buildingId
                    ? { id: room.buildingId._id, name: room.buildingId.name, gender: room.buildingId.gender }
                    : null,
            }));
            return sendSuccess(res, 200, 'Available rooms fetched', {
                rooms: shapedRooms,
                count: shapedRooms.length
            });
        }

        return sendSuccess(res, 200, 'Available rooms fetched', {
            rooms,
            count: rooms.length
        });
    } catch (error) {
        console.error('Get Available Rooms Error:', error);
        return sendError(res, 500, 'Failed to fetch available rooms', error.message);
    }
};

// ==========================================
// POST /api/rooms (Admin Only)
// ==========================================
exports.createRoom = async (req, res) => {
    try {
        const { roomNumber, capacity, buildingId, floorNumber, amenities } = req.body;

        if (!roomNumber || !capacity || !buildingId) {
            return sendError(res, 400, 'roomNumber, capacity, and buildingId are required');
        }

        if (!mongoose.Types.ObjectId.isValid(buildingId)) {
            return sendError(res, 400, 'Invalid building ID format');
        }

        const existingRoom = await Room.findOne({ roomNumber, buildingId }).select('_id').lean();
        if (existingRoom) {
            return sendError(res, 400, 'A room with this number already exists in the selected building');
        }

        const room = new Room({
            roomNumber,
            capacity,
            buildingId,
            floorNumber: floorNumber || 1,
            amenities: amenities || []
        });

        await room.save();

        return sendSuccess(res, 201, 'Room created successfully', {
            room: {
                id: room._id,
                roomNumber: room.roomNumber,
                capacity: room.capacity
            }
        });

    } catch (error) {
        console.error('Create Room Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to create room', error.message);
    }
};

// ==========================================
// POST /api/rooms/:id/assign (Admin & Supervisor)
// ==========================================
exports.assignStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id: roomId } = req.params;
        const { studentId } = req.body;

        const operatorRole = req.userDoc.role;

        if (!studentId) {
            return sendError(res, 400, 'studentId is required');
        }
        if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(studentId)) {
            return sendError(res, 400, 'Invalid ID format');
        }

        const room = await Room.findById(roomId).populate('buildingId').session(session);
        if (!room) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Room not found');
        }

        if (room.currentOccupants.length >= room.capacity) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Room is full');
        }

        const student = await User.findOne({ _id: studentId, role: 'student' }).session(session);
        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student not found');
        }

        if (student.assignedRoomId) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Student is already assigned to a room');
        }

        // ========================================================
        //  Business Logic   
        // ========================================================
        if (operatorRole === 'supervisor') {
            const buildingGrade = room.buildingId.grade;
            const studentGrade = student.grade || 5;

            if (buildingGrade < studentGrade) {
                await session.abortTransaction();
                session.endSession();
                return sendError(
                    res,
                    403,
                    `Access Denied: Supervisor cannot assign this student. Student's grade (${studentGrade}) does not match the building's minimum requirement (${buildingGrade}).`
                );
            }
        }
        // ========================================================

        if (!room.currentOccupants.includes(studentId)) {
            room.currentOccupants.push(studentId);
            await room.save({ session });
        }

        student.assignedRoomId = room._id;
        student.roomAllocationDate = new Date();
        student.housingStatus = 'active';
        await student.save({ session });

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, 'Student assigned successfully', {
            room: { id: room._id, roomNumber: room.roomNumber },
            student: { id: student._id, name: student.name }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Assign Student Error:', error);
        return sendError(res, 500, 'Failed to assign student', error.message);
    }
};
// ==========================================
// POST /api/rooms/:id/remove (Admin Only)
// ==========================================
exports.removeStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id: roomId } = req.params;
        const { studentId } = req.body;

        if (!studentId) {
            return sendError(res, 400, 'studentId is required');
        }
        if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(studentId)) {
            return sendError(res, 400, 'Invalid ID format');
        }

        const room = await Room.findById(roomId).session(session);
        if (!room) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Room not found');
        }

        room.currentOccupants = room.currentOccupants.filter(id => id.toString() !== studentId);
        await room.save({ session });

        await User.findByIdAndUpdate(
            studentId,
            {
                assignedRoomId: null,
                roomAllocationDate: null,
                housingStatus: 'inactive'
            },
            { session }
        );

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, 'Student removed from room successfully');

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Remove Student Error:', error);
        return sendError(res, 500, 'Failed to remove student', error.message);
    }
};

// ==========================================
// GET /api/rooms/my (Student)
// ==========================================
exports.getMyRoom = async (req, res) => {
    try {
        const room = await Room.findOne({ currentOccupants: req.userDoc._id })
            .populate({
                path: 'buildingId',
                populate: { path: 'supervisorId', select: 'name phoneNumber email' }
            })
            .populate('currentOccupants', 'name email phoneNumber profilePicture studentId')
            .lean();

        if (!room) {
            return sendError(res, 404, 'No room assigned to you yet');
        }

        return sendSuccess(res, 200, 'Your room details fetched', { room });

    } catch (error) {
        console.error('Get My Room Error:', error);
        return sendError(res, 500, 'Failed to fetch your room', error.message);
    }
};

// ==========================================
// GET /api/rooms/building/:buildingId
// ==========================================
exports.getRoomsByBuilding = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const userRole = req.userDoc.role;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        let query = Room.find({ buildingId }).populate('buildingId', 'name gender');

        if (userRole !== 'student') {
            query = query.populate('currentOccupants', 'name email studentId');
        }

        const [rooms, total] = await Promise.all([
            query.sort({ roomNumber: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Room.countDocuments({ buildingId })
        ]);

        if (userRole === 'student') {
            const shapedRooms = rooms.map(room => ({
                id: room._id,
                roomNumber: room.roomNumber,
                floorNumber: room.floorNumber,
                capacity: room.capacity,
                status: room.status,
                amenities: room.amenities || [],
                building: room.buildingId
                    ? { id: room.buildingId._id, name: room.buildingId.name, gender: room.buildingId.gender }
                    : null
            }));

            return sendSuccess(res, 200, 'Rooms fetched successfully', {
                rooms: shapedRooms,
                pagination: {
                    currentPage: page,
                    totalPages: Math.ceil(total / limit),
                    totalRooms: total,
                    hasNext: page * limit < total,
                    hasPrev: page > 1
                }
            });
        }

        return sendSuccess(res, 200, 'Rooms fetched successfully', {
            rooms,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRooms: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get Rooms By Building Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid building ID');
        }
        return sendError(res, 500, 'Failed to fetch rooms', error.message);
    }
};

// ==========================================
// GET /api/rooms/:id
// ==========================================

exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const userRole = req.userDoc.role;

        let query = Room.findById(id)
            .populate({
                path: 'buildingId',
                populate: { path: 'supervisorId', select: 'name phoneNumber email' }
            });

        if (userRole !== 'student') {
            query = query.populate('currentOccupants', 'name email studentId');
        }

        const room = await query.lean();

        if (!room) {
            return sendError(res, 404, 'Room not found');
        }

        if (userRole === 'student') {
            const shapedRoom = {
                id: room._id,
                roomNumber: room.roomNumber,
                floorNumber: room.floorNumber,
                capacity: room.capacity,
                status: room.status,
                amenities: room.amenities || [],
                building: room.buildingId
                    ? {
                        id: room.buildingId._id,
                        name: room.buildingId.name,
                        gender: room.buildingId.gender
                    }
                    : null
            };

            return sendSuccess(res, 200, 'Room details fetched successfully', { room: shapedRoom });
        }

        return sendSuccess(res, 200, 'Room details fetched successfully', { room });
    } catch (error) {
        console.error('Get Room By ID Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid room ID');
        }
        return sendError(res, 500, 'Failed to fetch room', error.message);
    }
};

// ==========================================
// PUT /api/rooms/:id
// ==========================================
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const allowedFields = ['roomNumber', 'floorNumber', 'capacity', 'amenities'];
        const filteredUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return sendError(res, 400, 'No valid fields to update');
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            filteredUpdates,
            { new: true, runValidators: true }
        ).populate('buildingId', 'name gender');

        if (!updatedRoom) {
            return sendError(res, 404, 'Room not found');
        }

        return sendSuccess(res, 200, 'Room updated successfully', { room: updatedRoom });

    } catch (error) {
        console.error('Update Room Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid room ID');
        }
        return sendError(res, 500, 'Failed to update room', error.message);
    }
};

// ==========================================
// PATCH /api/rooms/:id/status
// ==========================================
exports.updateRoomStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!status || !['available', 'occupied', 'maintenance', 'reserved'].includes(status)) {
            return sendError(res, 400, 'Invalid status. Must be: available, occupied, maintenance, or reserved');
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        ).populate('buildingId', 'name gender');

        if (!updatedRoom) {
            return sendError(res, 404, 'Room not found');
        }

        return sendSuccess(res, 200, 'Room status updated successfully', { room: updatedRoom });

    } catch (error) {
        console.error('Update Room Status Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid room ID');
        }
        return sendError(res, 500, 'Failed to update room status', error.message);
    }
};

// ==========================================
// POST /api/rooms/auto-assign/:studentId
// ==========================================
exports.autoAssignRoom = async (req, res) => {
    try {
        const { studentId } = req.params;

        const student = await User.findOne({ _id: studentId, role: 'student' });
        if (!student) {
            return sendError(res, 404, 'Student not found');
        }

        if (student.assignedRoomId) {
            return sendError(res, 400, 'Student already has a room assigned');
        }

        const availableRoom = await Room.findOne({
            status: 'available',
            gender: student.gender || 'mixed',
            currentOccupants: { $size: 0 }
        }).populate('buildingId', 'name gender');

        if (!availableRoom) {
            return sendError(res, 404, 'No available rooms found for auto-assignment');
        }

        await Promise.all([
            Room.findByIdAndUpdate(availableRoom._id, {
                $push: { currentOccupants: student._id },
                status: 'occupied'
            }),
            User.findByIdAndUpdate(student._id, {
                assignedRoomId: availableRoom._id,
                housingStatus: 'assigned'
            })
        ]);

        return sendSuccess(res, 200, 'Room auto-assigned successfully', {
            room: availableRoom,
            student: {
                id: student._id,
                name: student.name,
                email: student.email
            }
        });

    } catch (error) {
        console.error('Auto Assign Room Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid student ID');
        }
        return sendError(res, 500, 'Failed to auto-assign room', error.message);
    }
};