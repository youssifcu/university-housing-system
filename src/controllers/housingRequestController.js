const mongoose = require('mongoose');
const HousingRequest = require('../models/HousingRequest');
const { User } = require('../models/User');
const Room = require('../models/Room');

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

// أنواع الطلبات المسموحة
const ALLOWED_REQUEST_TYPES = ['transfer', 'leave', 'vacate', 'maintenance'];
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

// ==========================================
// POST /api/housing-requests (Student)
// ==========================================
exports.submitRequest = async (req, res) => {
    try {
        const studentId = req.userDoc._id;
        const { type, toRoomId, reason, startDate, endDate } = req.body;

        // 1. التحقق من وجود الطالب في غرفة (إلا إذا كان الطلب Maintenance)
        if (!req.userDoc.assignedRoomId) {
            return sendError(res, 400, 'You must be assigned to a room to submit a request');
        }

        // 2. التحقق من صحة نوع الطلب
        if (!type || !ALLOWED_REQUEST_TYPES.includes(type)) {
            return sendError(res, 400, `Invalid request type. Allowed: ${ALLOWED_REQUEST_TYPES.join(', ')}`);
        }

        // 3. التحقق من وجود طلب معلق من نفس النوع
        const existingRequest = await HousingRequest.findOne({
            studentId,
            type,
            status: 'pending'
        }).select('_id').lean();
        
        if (existingRequest) {
            return sendError(res, 400, `You already have a pending ${type} request`);
        }

        // 4. التحقق من التواريخ للطلبات الزمنية
        if ((type === 'vacate' || type === 'leave') && (!startDate || !endDate)) {
            return sendError(res, 400, 'startDate and endDate are required for this request type');
        }

        // التحقق من صحة التواريخ
        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start) || isNaN(end)) {
                return sendError(res, 400, 'Invalid date format');
            }
            if (start >= end) {
                return sendError(res, 400, 'startDate must be before endDate');
            }
        }

        // 5. التحقق من toRoomId إذا كان الطلب نقل
        if (type === 'transfer') {
            if (!toRoomId) {
                return sendError(res, 400, 'toRoomId is required for transfer requests');
            }
            if (!mongoose.Types.ObjectId.isValid(toRoomId)) {
                return sendError(res, 400, 'Invalid room ID format');
            }
            
            // جلب غرفة الهدف مع بناؤها
            const targetRoom = await Room.findById(toRoomId)
                .select('_id status buildingId')
                .populate('buildingId', 'name grade')
                .lean();
            
            if (!targetRoom) {
                return sendError(res, 404, 'Target room not found');
            }
            if (targetRoom.status === 'full') {
                return sendError(res, 400, 'Target room is already full');
            }

            // التحقق من تطابق درجة الطالب مع متطلبات المبنى
            if (targetRoom.buildingId && targetRoom.buildingId.grade) {
                if (req.userDoc.grade > targetRoom.buildingId.grade) {
                    return sendError(res, 403, 
                        `Your grade (${req.userDoc.grade}) is higher than the required grade for ${targetRoom.buildingId.name} (grade ${targetRoom.buildingId.grade}). You cannot request this building.`);
                }
            }
        }

        // 6. إنشاء الطلب
        const newRequest = new HousingRequest({
            studentId,
            type,
            fromRoomId: req.userDoc.assignedRoomId,
            ...(toRoomId && { toRoomId }),
            ...(reason && { reason: reason.trim() }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
            status: 'pending'
        });

        await newRequest.save();

        return sendSuccess(res, 201, 'Request submitted successfully', {
            id: newRequest._id,
            status: newRequest.status
        });

    } catch (error) {
        console.error('Submit Housing Request Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to submit request', error.message);
    }
};

// ==========================================
// GET /api/housing-requests (Admin)
// ==========================================
exports.getAllRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filtering
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.studentId) filter.studentId = req.query.studentId;

        const [requests, total] = await Promise.all([
            HousingRequest.find(filter)
                .populate('studentId', 'name studentId')
                .populate('fromRoomId', 'roomNumber')
                .populate('toRoomId', 'roomNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            HousingRequest.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Requests fetched successfully', {
            requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get All Housing Requests Error:', error);
        return sendError(res, 500, 'Failed to fetch requests', error.message);
    }
};

// ==========================================
// GET /api/housing-requests/:id
// ==========================================
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid request ID format');
        }

        const request = await HousingRequest.findById(id)
            .populate('studentId', 'name email phoneNumber faculty studentId')
            .populate('fromRoomId', 'roomNumber floorNumber buildingId')
            .populate('toRoomId', 'roomNumber floorNumber buildingId')
            .populate('reviewedBy', 'name role')
            .lean();

        if (!request) {
            return sendError(res, 404, 'Request not found');
        }

        // صلاحيات الوصول
        const isAdmin = req.userDoc.role === 'admin';
        const isOwner = request.studentId._id.toString() === req.userDoc._id.toString();

        if (!isAdmin && !isOwner) {
            return sendError(res, 403, 'You are not authorized to view this request');
        }

        return sendSuccess(res, 200, 'Request fetched successfully', { request });

    } catch (error) {
        console.error('Get Housing Request By ID Error:', error);
        return sendError(res, 500, 'Failed to fetch request', error.message);
    }
};

// ==========================================
// PATCH /api/housing-requests/:id/status (Admin)
// ==========================================
exports.updateStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { status, adminComment } = req.body;
        const reviewerId = req.userDoc._id;

        // 1. التحقق من المدخلات
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return sendError(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid request ID format');
        }

        // 2. جلب الطلب
        const request = await HousingRequest.findById(id).session(session);
        if (!request) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Request not found');
        }

        if (request.status !== 'pending') {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, `Request is already ${request.status}`);
        }

        // 3. تنفيذ الإجراءات عند الموافقة
        if (status === 'approved') {
            const student = await User.findById(request.studentId).session(session);
            if (!student) {
                await session.abortTransaction();
                session.endSession();
                return sendError(res, 404, 'Student not found');
            }

            // ---- نقل الطالب ----
            if (request.type === 'transfer' && request.toRoomId) {
                const newRoom = await Room.findById(request.toRoomId).session(session);
                if (!newRoom || newRoom.status === 'full') {
                    await session.abortTransaction();
                    session.endSession();
                    return sendError(res, 400, 'Target room is not available');
                }

                // إزالة من الغرفة القديمة
                if (request.fromRoomId) {
                    await Room.findByIdAndUpdate(
                        request.fromRoomId,
                        { $pull: { currentOccupants: student._id } },
                        { session }
                    );
                }

                // إضافة للغرفة الجديدة
                newRoom.currentOccupants.push(student._id);
                if (newRoom.currentOccupants.length >= newRoom.capacity) {
                    newRoom.status = 'full';
                }
                await newRoom.save({ session });

                student.assignedRoomId = newRoom._id;
            }

            // ---- إجازة مؤقتة ----
            if (request.type === 'leave') {
                student.housingStatus = 'suspended';
            }

            // ---- إخلاء نهائي ----
            if (request.type === 'vacate') {
                if (request.fromRoomId) {
                    await Room.findByIdAndUpdate(
                        request.fromRoomId,
                        { $pull: { currentOccupants: student._id } },
                        { session }
                    );
                }
                student.housingStatus = 'inactive';
                student.assignedRoomId = null;
            }

            await student.save({ session });
        }

        // 4. تحديث الطلب
        request.status = status;
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        if (adminComment) {
            request.comments = adminComment.trim();
        }
        await request.save({ session });

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, `Request ${status} successfully`, {
            requestId: request._id,
            status: request.status
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Update Housing Request Status Error:', error);
        return sendError(res, 500, 'Failed to update request status', error.message);
    }
};

// ==========================================
// GET /api/housing-requests/me (Student)
// ==========================================
exports.getMyRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            HousingRequest.find({ studentId: req.userDoc._id })
                .populate('fromRoomId', 'roomNumber')
                .populate('toRoomId', 'roomNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            HousingRequest.countDocuments({ studentId: req.userDoc._id })
        ]);

        return sendSuccess(res, 200, 'Your requests fetched successfully', {
            requests,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get My Requests Error:', error);
        return sendError(res, 500, 'Failed to fetch your requests', error.message);
    }
};