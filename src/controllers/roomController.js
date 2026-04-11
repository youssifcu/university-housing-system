const mongoose = require('mongoose');
const Room = require('../models/Room');
const { User } = require('../models/User');

// ==========================================
// Helpers للتنسيق الموحد
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
// GET /api/rooms (Admin/Supervisor)
// ==========================================
exports.getAllRooms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.buildingId) filter.buildingId = req.query.buildingId;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.floorNumber) filter.floorNumber = parseInt(req.query.floorNumber);

        const [rooms, total] = await Promise.all([
            Room.find(filter)
                .populate('buildingId', 'name gender')
                .populate('currentOccupants', 'name email studentId')
                .sort({ buildingId: 1, roomNumber: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Room.countDocuments(filter)
        ]);

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
        const filter = { status: 'available' };
        if (req.query.buildingId) filter.buildingId = req.query.buildingId;
        if (req.query.floorNumber) filter.floorNumber = parseInt(req.query.floorNumber);

        const rooms = await Room.find(filter)
            .populate('buildingId', 'name gender')
            .sort({ buildingId: 1, roomNumber: 1 })
            .lean();

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

        // التحقق من الحقول المطلوبة
        if (!roomNumber || !capacity || !buildingId) {
            return sendError(res, 400, 'roomNumber, capacity, and buildingId are required');
        }

        if (!mongoose.Types.ObjectId.isValid(buildingId)) {
            return sendError(res, 400, 'Invalid building ID format');
        }

        // التحقق من عدم وجود غرفة بنفس الرقم في نفس المبنى
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
// POST /api/rooms/:id/assign (Admin Only)
// ==========================================
exports.assignStudent = async (req, res) => {
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

        // إضافة الطالب للغرفة
        if (!room.currentOccupants.includes(studentId)) {
            room.currentOccupants.push(studentId);
            await room.save({ session });
        }

        // تحديث الطالب
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

        // إزالة الطالب من الغرفة
        room.currentOccupants = room.currentOccupants.filter(id => id.toString() !== studentId);
        await room.save({ session });

        // تحديث الطالب
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