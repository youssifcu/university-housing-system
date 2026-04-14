const mongoose = require('mongoose');
const Report = require('../models/Report');
const { User } = require('../models/User');
const Notification = require('../models/Notification');

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
const ALLOWED_REPORT_TYPES = ['maintenance', 'complaint', 'emergency', 'other'];
const ALLOWED_SEVERITIES = ['low', 'medium', 'high', 'critical'];
const ALLOWED_STATUSES = ['open', 'in_progress', 'resolved', 'closed'];

// التحقق من صلاحيات الإدارة
const canManageReports = (role) => ['admin', 'floor_admin', 'supervisor'].includes(role);

// ==========================================
// POST /api/reports (Student)
// ==========================================
exports.createReport = async (req, res) => {
    try {
        const { type, description, severity, imageUrls, location } = req.body; // نستخدم imageUrls كـ Array
        const studentId = req.userDoc._id;

        // 1. التحقق من الحقول المطلوبة
        if (!type || !description?.trim()) {
            return sendError(res, 400, 'Type and description are required');
        }

        // 2. مزامنة أنواع البلاغات مع الموديل (ضفنا malfunction)
        const MODEL_TYPES = ['maintenance', 'complaint', 'emergency', 'malfunction', 'other'];
        if (!MODEL_TYPES.includes(type)) {
            return sendError(res, 400, `Invalid type. Allowed: ${MODEL_TYPES.join(', ')}`);
        }

        const report = await Report.create({
            type,
            description: description.trim(),
            severity: severity || 'low',
            imageUrls: imageUrls || [], // مصفوفة صور
            studentId,
            reportedBy: studentId,
            location: location || {}, // دعم بيانات الموقع (Building/Room)
            status: 'open'
        });

        return sendSuccess(res, 201, 'Report submitted successfully', { id: report._id });
    } catch (error) {
        console.error('Create Report Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to submit report', error.message);
    }
};

// ==========================================
// GET /api/reports (Admin/Supervisor)
// ==========================================
exports.getAllReports = async (req, res) => {
    try {
        if (!canManageReports(req.userDoc.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // فلترة
        const filter = {};
        if (req.query.type) filter.type = req.query.type;
        if (req.query.status) filter.status = req.query.status;
        if (req.query.severity) filter.severity = req.query.severity;
        if (req.query.studentId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.studentId)) {
                return sendError(res, 400, 'Invalid student ID format');
            }
            filter.studentId = req.query.studentId;
        }

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .populate('studentId', 'name studentId assignedRoomId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Report.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Reports fetched successfully', {
            reports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get All Reports Error:', error);
        return sendError(res, 500, 'Failed to fetch reports', error.message);
    }
};

// ==========================================
// GET /api/reports/:id
// ==========================================
exports.getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid report ID format');
        }

        const report = await Report.findById(id)
            .populate('studentId', 'name studentId email phoneNumber')
            .populate('reportedBy', 'name role')
            .lean();

        if (!report) {
            return sendError(res, 404, 'Report not found');
        }

        // صلاحيات الوصول
        const isOwner = report.studentId._id.toString() === req.userDoc._id.toString();
        const isManagement = canManageReports(req.userDoc.role);

        if (!isOwner && !isManagement) {
            return sendError(res, 403, 'Access denied');
        }

        if (req.userDoc.role === 'student') {
            const shapedReport = {
                id: report._id,
                type: report.type,
                description: report.description,
                status: report.status,
                imageUrls: report.imageUrls || [],
                location: report.location || {},
                createdAt: report.createdAt,
                updatedAt: report.updatedAt
            };
            return sendSuccess(res, 200, 'Report fetched successfully', { report: shapedReport });
        }

        return sendSuccess(res, 200, 'Report fetched successfully', { report });

    } catch (error) {
        console.error('Get Report By ID Error:', error);
        return sendError(res, 500, 'Failed to fetch report', error.message);
    }
};

// ==========================================
// PATCH /api/reports/:id/status (Admin/Supervisor)
// ==========================================
exports.updateReportStatus = async (req, res) => {
    try {
        if (!canManageReports(req.userDoc.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const { id } = req.params;
        const { status, comment } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid report ID format');
        }

        if (!status || !ALLOWED_STATUSES.includes(status)) {
            return sendError(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }

        const report = await Report.findById(id);
        if (!report) {
            return sendError(res, 404, 'Report not found');
        }

        // تحديث الحقول
        report.status = status;
        report.updatedAt = new Date();
        if (comment) {
            report.adminComment = comment.trim();
        }

        await report.save();

        // إنشاء إشعار للطالب
        await Notification.create({
            title: `Report #${report._id.toString().slice(-6)} Updated`,
            message: `Your ${report.type} report status changed to: ${status}`,
            targetUser: report.studentId,
            type: 'info'
        });

        // إرسال تنبيه فوري عبر Socket.io
        const io = req.app.get('io');
        if (io) {
            io.to(report.studentId.toString()).emit('notification:new', {
                type: 'report_update',
                reportId: report._id,
                status
            });
        }

        return sendSuccess(res, 200, `Report status updated to ${status}`, {
            id: report._id,
            status: report.status
        });

    } catch (error) {
        console.error('Update Report Status Error:', error);
        return sendError(res, 500, 'Failed to update report', error.message);
    }
};

// ==========================================
// GET /api/reports/me (Student)
// ==========================================
exports.getMyReports = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { studentId: req.userDoc._id };

        const [reports, total] = await Promise.all([
            Report.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Report.countDocuments(filter)
        ]);

        const shapedReports = reports.map(report => ({
            id: report._id,
            type: report.type,
            description: report.description,
            status: report.status,
            imageUrls: report.imageUrls || [],
            createdAt: report.createdAt,
            updatedAt: report.updatedAt
        }));

        return sendSuccess(res, 200, 'Your reports fetched successfully', {
            reports: shapedReports,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get My Reports Error:', error);
        return sendError(res, 500, 'Failed to fetch your reports', error.message);
    }
};

// ==========================================
// PUT /api/reports/:id (Student)
// ==========================================
exports.updateMyReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { type, description, imageUrls } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid report ID format');
        }

        const report = await Report.findById(id);

        if (!report) {
            return sendError(res, 404, 'Report not found');
        }

        // 1. Check ownership
        if (report.studentId.toString() !== req.userDoc._id.toString()) {
            return sendError(res, 403, 'Access denied: You can only edit your own reports');
        }

        // 2. Check status
        if (report.status !== 'open') {
            return sendError(res, 400, 'Cannot edit report because it is no longer open');
        }

        // 3. Validate & Update fields
        if (type) {
            const MODEL_TYPES = ['maintenance', 'complaint', 'emergency', 'malfunction', 'other'];
            if (!MODEL_TYPES.includes(type)) {
                return sendError(res, 400, `Invalid type. Allowed: ${MODEL_TYPES.join(', ')}`);
            }
            report.type = type;
        }

        if (description !== undefined) {
            if (!description.trim()) {
                return sendError(res, 400, 'Description cannot be empty');
            }
            report.description = description.trim();
        }

        if (imageUrls !== undefined) {
            report.imageUrls = imageUrls;
        }

        report.updatedAt = new Date();

        await report.save();

        return sendSuccess(res, 200, 'Report updated successfully', {
            id: report._id,
            type: report.type,
            description: report.description
        });

    } catch (error) {
        console.error('Update My Report Error:', error);
        return sendError(res, 500, 'Failed to update report', error.message);
    }
};

// ==========================================
// DELETE /api/reports/:id (Admin/Supervisor)
// ==========================================
exports.deleteReport = async (req, res) => {
    try {
        if (!canManageReports(req.userDoc.role)) {
            return sendError(res, 403, 'Access denied');
        }

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid report ID format');
        }

        const report = await Report.findByIdAndDelete(id);
        if (!report) {
            return sendError(res, 404, 'Report not found');
        }

        return sendSuccess(res, 200, 'Report deleted successfully', {
            id: report._id
        });

    } catch (error) {
        console.error('Delete Report Error:', error);
        return sendError(res, 500, 'Failed to delete report', error.message);
    }
};