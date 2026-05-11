const mongoose = require('mongoose');
const HousingRequest = require('../models/HousingRequest');
const { User } = require('../models/User');
const Room = require('../models/Room');

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

const ALLOWED_REQUEST_TYPES = ['transfer', 'leave', 'vacate', 'maintenance'];
const ALLOWED_STATUSES = ['pending', 'approved', 'rejected', 'cancelled'];

// ==========================================
// 1. POST /api/housing-requests (Student)
// ==========================================
exports.submitRequest = async (req, res) => {
    try {
        const studentId = req.userDoc._id;
        const { type, toRoomId, reason, startDate, endDate } = req.body;

        if (!req.userDoc.assignedRoomId) {
            return sendError(res, 400, 'You must be assigned to a room to submit a request');
        }

        if (!type || !ALLOWED_REQUEST_TYPES.includes(type)) {
            return sendError(res, 400, `Invalid request type.`);
        }

        const existingRequest = await HousingRequest.findOne({
            studentId,
            type,
            status: 'pending'
        }).lean();

        if (existingRequest) {
            return sendError(res, 400, `You already have a pending ${type} request`);
        }

        const newRequest = new HousingRequest({
            studentId,
            type,
            fromRoomId: req.userDoc.assignedRoomId,
            ...(toRoomId && { toRoomId }),
            reason: reason?.trim(),
            startDate,
            endDate,
            status: 'pending'
        });

        await newRequest.save();
        return sendSuccess(res, 201, 'Request submitted successfully', { id: newRequest._id });

    } catch (error) {
        return sendError(res, 500, 'Failed to submit request', error.message);
    }
};

// ==========================================
// 2. GET /api/housing-requests (Admin/Supervisor Sees All, Student Sees Own)
// ==========================================
exports.getAllRequests = async (req, res) => {
    try {
        const { role, _id } = req.userDoc;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (role === 'student') {
            filter.studentId = _id;
        } else if (req.query.studentId) {
            filter.studentId = req.query.studentId;
        }

        if (req.query.type) filter.type = req.query.type;
        if (req.query.status) filter.status = req.query.status;

        const [requests, total] = await Promise.all([
            HousingRequest.find(filter)
                .populate('studentId', 'name studentId email')
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
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch requests', error.message);
    }
};

// ==========================================
// 3. GET /api/housing-requests/:id (Admin/Supervisor/Owner Only)
// ==========================================
exports.getRequestById = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, _id } = req.userDoc;

        const request = await HousingRequest.findById(id)
            .populate('studentId', 'name email studentId faculty')
            .populate('fromRoomId', 'roomNumber buildingId')
            .populate('toRoomId', 'roomNumber buildingId')
            .lean();

        if (!request) return sendError(res, 404, 'Request not found');

        const isOwner = request.studentId._id.toString() === _id.toString();
        const hasAccess = ['admin', 'supervisor'].includes(role) || isOwner;

        if (!hasAccess) return sendError(res, 403, 'Unauthorized access');

        return sendSuccess(res, 200, 'Request details', { request });
    } catch (error) {
        return sendError(res, 500, 'Error fetching request', error.message);
    }
};

// ==========================================
// 4. PATCH /api/housing-requests/:id (Student Edit Own Pending Request)
// ==========================================
exports.updateMyRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const studentId = req.userDoc._id;
        const { reason, startDate, endDate, toRoomId } = req.body;

        const request = await HousingRequest.findOne({ _id: id, studentId, status: 'pending' });
        if (!request) return sendError(res, 404, 'Pending request not found or unauthorized');

        if (reason) request.reason = reason.trim();
        if (startDate) request.startDate = startDate;
        if (endDate) request.endDate = endDate;
        if (toRoomId && request.type === 'transfer') request.toRoomId = toRoomId;

        await request.save();
        return sendSuccess(res, 200, 'Request updated successfully');
    } catch (error) {
        return sendError(res, 500, 'Update failed', error.message);
    }
};

// ==========================================
// 5. PATCH /api/housing-requests/:id/status (Admin/Supervisor Only)
// ==========================================
exports.updateStatus = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const { status, adminComment, overrideRoomId } = req.body;
        const { role, _id: reviewerId } = req.userDoc;

        if (!['admin', 'supervisor'].includes(role)) {
            return sendError(res, 403, 'Only admins or supervisors can review requests');
        }

        const request = await HousingRequest.findById(id).session(session);
        if (!request || request.status !== 'pending') {
            throw new Error('Request not found or already processed');
        }

        if (status === 'approved') {
            const student = await User.findById(request.studentId).session(session);

            if (request.type === 'transfer') {
                const finalRoomId = overrideRoomId || request.toRoomId;

                const targetRoom = await Room.findById(finalRoomId).session(session);
                if (!targetRoom || targetRoom.status === 'full') throw new Error('Target room is not available');

                await Room.findByIdAndUpdate(request.fromRoomId, { $pull: { currentOccupants: student._id } }, { session });

                targetRoom.currentOccupants.push(student._id);
                if (targetRoom.currentOccupants.length >= targetRoom.capacity) targetRoom.status = 'full';
                await targetRoom.save({ session });

                student.assignedRoomId = targetRoom._id;
            } else if (request.type === 'vacate') {
                await Room.findByIdAndUpdate(request.fromRoomId, { $pull: { currentOccupants: student._id } }, { session });
                student.assignedRoomId = null;
                student.housingStatus = 'inactive';
            }
            await student.save({ session });
        }

        request.status = status;
        request.adminComment = adminComment;
        request.reviewedBy = reviewerId;
        request.reviewedAt = new Date();
        await request.save({ session });

        await session.commitTransaction();
        return sendSuccess(res, 200, `Request ${status} successfully`);
    } catch (error) {
        await session.abortTransaction();
        return sendError(res, 500, error.message);
    } finally {
        session.endSession();
    }
};