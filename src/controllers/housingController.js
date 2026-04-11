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
// GET /api/rooms
// ==========================================
exports.getAllRooms = async (req, res) => {
    try {
        const isAdmin = req.user?.role === 'admin';
        
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // بناء الفلتر حسب الدور
        let filter = {};
        if (!isAdmin) {
            // الطالب يشوف الغرف المتاحة فقط (فيها سرير فاضي)
            filter = {
                status: { $in: ['available', 'full'] }, // ممكن full لو فيها سرير واحد بس
                $expr: { $lt: ['$currentOccupancy', '$capacity'] }
            };
        }

        // فلتر إضافي (اختياري) - مثلاً تصفية حسب المبنى
        if (req.query.buildingId) {
            filter.buildingId = req.query.buildingId;
        }
        if (req.query.gender && isAdmin) {
            // لو عايز تصفي حسب جنس المبنى (يحتاج lookup)
        }

        const [rooms, total] = await Promise.all([
            Room.find(filter)
                .populate('buildingId', 'name gender')
                .sort({ buildingId: 1, roomNumber: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Room.countDocuments(filter)
        ]);

        // تنسيق البيانات للإخراج
        const formattedRooms = rooms.map(room => ({
            id: room._id,
            roomNumber: room.roomNumber,
            floorNumber: room.floorNumber,
            capacity: room.capacity,
            currentOccupancy: room.currentOccupancy || room.currentOccupants?.length || 0,
            status: room.status,
            building: room.buildingId ? {
                id: room.buildingId._id,
                name: room.buildingId.name,
                gender: room.buildingId.gender
            } : null
        }));

        return sendSuccess(res, 200, 'Rooms fetched successfully', {
            rooms: formattedRooms,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get All Rooms Error:', error);
        return sendError(res, 500, 'Failed to fetch rooms', error.message);
    }
};

// ==========================================
// PUT /api/rooms/:id (Admin Only)
// ==========================================
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid room ID format');
        }

        // الحقول المسموح بتعديلها
        const allowedUpdates = ['roomNumber', 'floorNumber', 'capacity', 'status', 'amenities', 'notes'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        // التحقق من صحة بعض القيم
        if (updates.capacity !== undefined) {
            if (typeof updates.capacity !== 'number' || updates.capacity < 1) {
                return sendError(res, 400, 'Capacity must be a positive number');
            }
        }
        if (updates.status && !['available', 'full', 'maintenance'].includes(updates.status)) {
            return sendError(res, 400, 'Invalid status value');
        }

        const updatedRoom = await Room.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('_id roomNumber capacity status');

        if (!updatedRoom) {
            return sendError(res, 404, 'Room not found');
        }

        return sendSuccess(res, 200, 'Room updated successfully', {
            room: updatedRoom
        });

    } catch (error) {
        console.error('Update Room Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to update room', error.message);
    }
};

// ==========================================
// POST /api/rooms/assign (Admin Only)
// ==========================================
exports.assignStudent = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { studentId, roomId } = req.body;

        // التحقق من المدخلات
        if (!studentId || !roomId) {
            return sendError(res, 400, 'studentId and roomId are required');
        }

        if (!mongoose.Types.ObjectId.isValid(studentId) || !mongoose.Types.ObjectId.isValid(roomId)) {
            return sendError(res, 400, 'Invalid ID format');
        }

        // 1. جلب الطالب والغرفة
        const student = await User.findOne({ 
            _id: studentId, 
            role: 'student' 
        }).session(session);

        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student not found');
        }

        const room = await Room.findById(roomId).session(session);
        if (!room) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Room not found');
        }

        // 2. التحقق من حالة الطالب (مايكونش مسكن بالفعل)
        if (student.housingStatus === 'active' && student.assignedRoomId) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Student is already assigned to a room');
        }

        // 3. التحقق من سعة الغرفة
        const currentOccupantsCount = room.currentOccupants?.length || 0;
        if (currentOccupantsCount >= room.capacity) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Room is already at full capacity');
        }

        // 4. التحقق من تطابق جنس المبنى مع الطالب
        const building = await mongoose.model('Building').findById(room.buildingId).session(session);
        if (building && building.gender && building.gender !== student.gender) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, `Room building is for ${building.gender} students only`);
        }

        // 5. تحديث الغرفة: إضافة الطالب
        if (!room.currentOccupants) room.currentOccupants = [];
        room.currentOccupants.push(student._id);
        
        // تحديث حالة الغرفة إذا اكتملت
        if (room.currentOccupants.length === room.capacity) {
            room.status = 'full';
        }

        await room.save({ session });

        // 6. تحديث الطالب
        student.assignedRoomId = room._id;
        student.housingStatus = 'active';
        student.roomAllocationDate = new Date();
        await student.save({ session });

        // 7. Commit
        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, `Student ${student.name} assigned to Room ${room.roomNumber}`, {
            student: {
                id: student._id,
                name: student.name
            },
            room: {
                id: room._id,
                roomNumber: room.roomNumber,
                currentOccupancy: room.currentOccupants.length,
                status: room.status
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Assign Student Error:', error);
        return sendError(res, 500, 'Assignment failed', error.message);
    }
};