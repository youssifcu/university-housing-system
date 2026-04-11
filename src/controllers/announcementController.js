const Announcement = require('../models/Announcement');

// قيم مسموح بها للتحقق من المدخلات
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
const ALLOWED_TARGET_ROLES = ['all', 'student', 'supervisor', 'security', 'admin']; // عدل حسب نظامك
const ALLOWED_STATUSES = ['active', 'archived', 'draft'];

/**
 * Helper: تنسيق موحد للاستجابة الناجحة
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data })
    });
};

/**
 * Helper: تنسيق موحد للاستجابة الفاشلة
 */
const sendError = (res, statusCode, message, errorDetails = null) => {
    const response = {
        success: false,
        message
    };
    if (errorDetails && process.env.NODE_ENV === 'development') {
        response.error = errorDetails;
    }
    return res.status(statusCode).json(response);
};

// ==========================================
// POST /api/announcements
// ==========================================
exports.createAnnouncement = async (req, res) => {
    try {
        const { title, content, priority, targetRole } = req.body;

        // 1. التحقق من الحقول المطلوبة
        if (!title?.trim() || !content?.trim()) {
            return sendError(res, 400, 'Title and content are required');
        }

        // 2. التحقق من القيم المسموح بها
        if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
            return sendError(res, 400, `Invalid priority. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
        }
        if (targetRole && !ALLOWED_TARGET_ROLES.includes(targetRole)) {
            return sendError(res, 400, `Invalid targetRole. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`);
        }

        // 3. إنشاء الإعلان
        const announcement = await Announcement.create({
            title: title.trim(),
            content: content.trim(),
            priority: priority || 'medium',
            targetRole: targetRole || 'all',
            createdBy: req.user.mongoId,
            status: 'active' // افتراضي
        });

        // 4. إرسال إشعار Real-Time (نبعت بيانات الإعلان الأساسية مش الـ ID بس)
        const io = req.app.get('io');
        if (io) {
            // نختار الحقول اللي هتبعت للسوكيت عشان منبعتش بيانات حساسة
            const announcementForSocket = {
                id: announcement._id,
                title: announcement.title,
                priority: announcement.priority,
                targetRole: announcement.targetRole,
                createdAt: announcement.createdAt
            };
            io.emit('announcement:new', announcementForSocket);
        }

        return sendSuccess(res, 201, 'Announcement created successfully', {
            id: announcement._id
        });

    } catch (error) {
        console.error('Create Announcement Error:', error);
        // لو الخطأ من Mongoose Validation
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to create announcement', error.message);
    }
};

// ==========================================
// GET /api/announcements
// ==========================================
exports.getAllAnnouncements = async (req, res) => {
    try {
        // بناء الفلتر حسب دور المستخدم
        let filter = {};
        if (req.user.role !== 'admin') {
            filter = {
                status: 'active',
                $or: [
                    { targetRole: 'all' },
                    { targetRole: req.user.role }
                ]
            };
        }

        // استخدام .lean() لتحسين الأداء لأننا مش محتاجين دوال الـ Document
        const announcements = await Announcement.find(filter)
            .select('_id title status priority targetRole createdAt') // نحدد الحقول المطلوبة
            .sort({ createdAt: -1 })
            .lean();

        // تنسيق البيانات المرجعة
        const formatted = announcements.map(a => ({
            id: a._id,
            title: a.title,
            status: a.status,
            priority: a.priority,
            targetRole: a.targetRole,
            createdAt: a.createdAt
        }));

        return sendSuccess(res, 200, 'Announcements fetched successfully', formatted);

    } catch (error) {
        console.error('Get All Announcements Error:', error);
        return sendError(res, 500, 'Failed to fetch announcements', error.message);
    }
};

// ==========================================
// GET /api/announcements/:id
// ==========================================
exports.getAnnouncementById = async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .select('title content status priority targetRole createdBy createdAt updatedAt')
            .lean();

        if (!announcement) {
            return sendError(res, 404, 'Announcement not found');
        }

        // صلاحيات الوصول لغير الأدمن
        if (req.user.role !== 'admin') {
            const canAccess = 
                announcement.status === 'active' &&
                (announcement.targetRole === 'all' || announcement.targetRole === req.user.role);
            
            if (!canAccess) {
                return sendError(res, 403, 'You do not have permission to view this announcement');
            }
        }

        // تنسيق البيانات (إزالة الحقول الداخلية لو موجودة)
        const data = {
            id: announcement._id,
            title: announcement.title,
            content: announcement.content,
            priority: announcement.priority,
            targetRole: announcement.targetRole,
            status: announcement.status,
            createdBy: announcement.createdBy,
            createdAt: announcement.createdAt,
            updatedAt: announcement.updatedAt
        };

        return sendSuccess(res, 200, 'Announcement fetched successfully', data);

    } catch (error) {
        console.error('Get Announcement By ID Error:', error);
        // لو الـ ID مش صحيح
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid announcement ID format');
        }
        return sendError(res, 500, 'Failed to fetch announcement', error.message);
    }
};

// ==========================================
// PUT /api/announcements/:id
// ==========================================
exports.updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        
        // الحقول المسموح بتعديلها فقط (منع الـ Mass Assignment)
        const allowedUpdates = ['title', 'content', 'priority', 'targetRole'];
        const updates = {};
        
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                let value = req.body[field];
                if (typeof value === 'string') {
                    value = value.trim();
                }
                updates[field] = value;
            }
        });

        // التحقق من القيم لو تم إرسالها
        if (updates.priority && !ALLOWED_PRIORITIES.includes(updates.priority)) {
            return sendError(res, 400, `Invalid priority. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
        }
        if (updates.targetRole && !ALLOWED_TARGET_ROLES.includes(updates.targetRole)) {
            return sendError(res, 400, `Invalid targetRole. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`);
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        // إضافة تاريخ التعديل
        updates.updatedAt = Date.now();

        const updated = await Announcement.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('_id title');

        if (!updated) {
            return sendError(res, 404, 'Announcement not found');
        }

        return sendSuccess(res, 200, 'Announcement updated successfully', {
            id: updated._id,
            title: updated.title
        });

    } catch (error) {
        console.error('Update Announcement Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid announcement ID format');
        }
        return sendError(res, 500, 'Failed to update announcement', error.message);
    }
};

// ==========================================
// PATCH /api/announcements/:id/status
// ==========================================
exports.updateAnnouncementStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const { id } = req.params;

        if (!status) {
            return sendError(res, 400, 'Status is required');
        }

        if (!ALLOWED_STATUSES.includes(status)) {
            return sendError(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }

        const updated = await Announcement.findByIdAndUpdate(
            id,
            { 
                $set: { 
                    status,
                    updatedAt: Date.now()
                } 
            },
            { new: true }
        ).select('_id status');

        if (!updated) {
            return sendError(res, 404, 'Announcement not found');
        }

        return sendSuccess(res, 200, 'Announcement status updated', {
            id: updated._id,
            status: updated.status
        });

    } catch (error) {
        console.error('Update Status Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid announcement ID format');
        }
        return sendError(res, 500, 'Failed to update status', error.message);
    }
};

// ==========================================
// DELETE /api/announcements/:id
// ==========================================
exports.deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;

        const deleted = await Announcement.findByIdAndDelete(id).select('_id title');

        if (!deleted) {
            return sendError(res, 404, 'Announcement not found');
        }

        // ممكن تبعت إشعار Real-Time بالحذف لو عايز
        // const io = req.app.get('io');
        // if (io) {
        //     io.emit('announcement:deleted', { id });
        // }

        return sendSuccess(res, 200, 'Announcement deleted successfully', {
            id: deleted._id,
            title: deleted.title
        });

    } catch (error) {
        console.error('Delete Announcement Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid announcement ID format');
        }
        return sendError(res, 500, 'Failed to delete announcement', error.message);
    }
};