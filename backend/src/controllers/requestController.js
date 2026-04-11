const mongoose = require('mongoose');
const StudentRequest = require('../models/StudentRequest');
const { User } = require('../models/User');
const admin = require('../config/firebase');

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

// القيم المسموحة
const ALLOWED_REQUEST_TYPES = ['room_change', 'complaint', 'leave_request', 'meal_exception', 'maintenance'];
const ALLOWED_PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const ALLOWED_STATUSES = ['submitted', 'in_review', 'needs_revision', 'approved', 'rejected', 'closed'];

// تعيين الدور الإداري المسؤول عن كل نوع طلب
const getRequestedAdminRole = (type) => {
    const roleMap = {
        room_change: 'supervisor',
        complaint: 'supervisor',
        leave_request: 'supervisor',
        meal_exception: 'meal_admin',
        maintenance: 'floor_admin'
    };
    return roleMap[type] || 'supervisor';
};

// التحقق من صلاحيات الإدارة
const canManageRequests = (role) => ['admin', 'supervisor', 'floor_admin', 'meal_admin'].includes(role);

// ==========================================
// POST /api/student-requests (Student)
// ==========================================
exports.submitRequest = async (req, res) => {
    try {
        const { requestType, title, description, priority } = req.body;
        const studentId = req.userDoc._id;

        // التحقق من المدخلات
        if (!requestType || !ALLOWED_REQUEST_TYPES.includes(requestType)) {
            return sendError(res, 400, `Invalid request type. Allowed: ${ALLOWED_REQUEST_TYPES.join(', ')}`);
        }
        if (!title?.trim() || !description?.trim()) {
            return sendError(res, 400, 'Title and description are required');
        }
        if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
            return sendError(res, 400, `Invalid priority. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
        }

        const requestedAdminRole = getRequestedAdminRole(requestType);

        const newRequest = new StudentRequest({
            studentId,
            requestType,
            title: title.trim(),
            description: description.trim(),
            requestedAdminRole,
            priority: priority || 'medium',
            status: 'submitted'
        });

        await newRequest.save();

        return sendSuccess(res, 201, 'Request submitted successfully', {
            request: {
                id: newRequest._id,
                type: newRequest.requestType,
                status: newRequest.status
            }
        });

    } catch (error) {
        console.error('Submit Request Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to submit request', error.message);
    }
};

// ==========================================
// GET /api/student-requests/admin (Admin/Supervisor)
// ==========================================
exports.getRequestsForAdmin = async (req, res) => {
    try {
        if (!canManageRequests(req.userDoc.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // الفلترة حسب دور المشرف
        const filter = { requestedAdminRole: req.userDoc.role };
        if (req.query.status) filter.status = req.query.status;
        if (req.query.type) filter.requestType = req.query.type;

        const [requests, total] = await Promise.all([
            StudentRequest.find(filter)
                .populate('studentId', 'name studentId email')
                .populate('assignedToUserId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StudentRequest.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Requests fetched successfully', {
            requests,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get Requests For Admin Error:', error);
        return sendError(res, 500, 'Failed to fetch requests', error.message);
    }
};

// ==========================================
// PATCH /api/student-requests/:requestId/assign
// ==========================================
exports.assignRequestToSelf = async (req, res) => {
    try {
        const { requestId } = req.params;
        const adminId = req.userDoc._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return sendError(res, 400, 'Invalid request ID format');
        }

        // التأكد من أن الطلب تابع لدور المشرف
        const request = await StudentRequest.findOne({
            _id: requestId,
            requestedAdminRole: req.userDoc.role
        });

        if (!request) {
            return sendError(res, 404, 'Request not found or not assigned to your role');
        }

        if (request.status === 'approved' || request.status === 'rejected') {
            return sendError(res, 400, `Request is already ${request.status}`);
        }

        request.assignedToUserId = adminId;
        request.status = 'in_review';
        await request.save();

        return sendSuccess(res, 200, 'Request assigned to you', {
            request: {
                id: request._id,
                status: request.status
            }
        });

    } catch (error) {
        console.error('Assign Request Error:', error);
        return sendError(res, 500, 'Failed to assign request', error.message);
    }
};

// ==========================================
// POST /api/student-requests/:requestId/messages
// ==========================================
exports.addRequestMessage = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { message } = req.body;
        const userId = req.userDoc._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return sendError(res, 400, 'Invalid request ID format');
        }
        if (!message?.trim()) {
            return sendError(res, 400, 'Message cannot be empty');
        }

        const request = await StudentRequest.findById(requestId);
        if (!request) {
            return sendError(res, 404, 'Request not found');
        }

        // صلاحيات: الطالب صاحب الطلب فقط أو المشرف المسؤول
        const isOwner = request.studentId.toString() === userId.toString();
        const isAssigned = request.assignedToUserId?.toString() === userId.toString();
        const isManager = canManageRequests(req.userDoc.role) && 
                          request.requestedAdminRole === req.userDoc.role;

        if (!isOwner && !isAssigned && !isManager) {
            return sendError(res, 403, 'You are not authorized to message on this request');
        }

        request.messages.push({
            userId,
            userRole: req.userDoc.role,
            message: message.trim(),
            timestamp: new Date()
        });
        request.updatedAt = new Date();
        await request.save();

        return sendSuccess(res, 200, 'Message added', {
            messageCount: request.messages.length
        });

    } catch (error) {
        console.error('Add Request Message Error:', error);
        return sendError(res, 500, 'Failed to add message', error.message);
    }
};

// ==========================================
// PATCH /api/student-requests/:requestId/respond
// ==========================================
exports.respondToRequest = async (req, res) => {
    try {
        const { requestId } = req.params;
        const { status, statusReason } = req.body;
        const adminId = req.userDoc._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return sendError(res, 400, 'Invalid request ID format');
        }
        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return sendError(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }
        if (['approved', 'rejected', 'needs_revision'].includes(status) && !statusReason?.trim()) {
            return sendError(res, 400, 'Status reason is required for final decisions');
        }

        // التأكد من الصلاحية (مشرف مكلف أو نفس الدور)
        const request = await StudentRequest.findOne({
            _id: requestId,
            $or: [
                { assignedToUserId: adminId },
                { requestedAdminRole: req.userDoc.role }
            ]
        });

        if (!request) {
            return sendError(res, 404, 'Request not found or you are not authorized');
        }

        if (request.status === 'approved' || request.status === 'rejected') {
            return sendError(res, 400, `Request already ${request.status}`);
        }

        request.status = status;
        request.statusReason = statusReason?.trim() || '';
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        // محاولة إرسال إشعار (اختياري)
        try {
            const student = await User.findById(request.studentId).select('email').lean();
            if (student?.email) {
                // يمكن استخدام Firebase أو أي خدمة أخرى
                await admin.auth().getUserByEmail(student.email);
            }
        } catch (notifError) {
            console.warn('Notification failed:', notifError.message);
        }

        return sendSuccess(res, 200, `Request ${status}`, {
            request: {
                id: request._id,
                status: request.status
            }
        });

    } catch (error) {
        console.error('Respond To Request Error:', error);
        return sendError(res, 500, 'Failed to respond to request', error.message);
    }
};

// ==========================================
// GET /api/student-requests/:requestId
// ==========================================
exports.getRequestDetails = async (req, res) => {
    try {
        const { requestId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return sendError(res, 400, 'Invalid request ID format');
        }

        const request = await StudentRequest.findById(requestId)
            .populate('studentId', 'name studentId email')
            .populate('assignedToUserId', 'name email')
            .populate('messages.userId', 'name role')
            .lean();

        if (!request) {
            return sendError(res, 404, 'Request not found');
        }

        // صلاحيات الوصول
        const isOwner = request.studentId._id.toString() === req.userDoc._id.toString();
        const isManager = canManageRequests(req.userDoc.role) &&
                          request.requestedAdminRole === req.userDoc.role;

        if (!isOwner && !isManager) {
            return sendError(res, 403, 'Access denied');
        }

        return sendSuccess(res, 200, 'Request details fetched', { request });

    } catch (error) {
        console.error('Get Request Details Error:', error);
        return sendError(res, 500, 'Failed to fetch request', error.message);
    }
};

// ==========================================
// GET /api/student-requests/me (Student)
// ==========================================
exports.getMyRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { studentId: req.userDoc._id };
        if (req.query.status) filter.status = req.query.status;

        const [requests, total] = await Promise.all([
            StudentRequest.find(filter)
                .populate('assignedToUserId', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            StudentRequest.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Your requests fetched', {
            requests,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get My Requests Error:', error);
        return sendError(res, 500, 'Failed to fetch your requests', error.message);
    }
};