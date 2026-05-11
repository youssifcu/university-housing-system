const Announcement = require('../models/Announcement');

// Allowed values ​​for input validation
const ALLOWED_PRIORITIES = ['low', 'medium', 'high'];
const ALLOWED_TARGET_ROLES = ['all', 'student', 'supervisor', 'security', 'admin'];// Modify according to your system
const ALLOWED_STATUSES = ['active', 'archived', 'draft'];

/**
 * Helper: Standardized format for successful response
 */
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data })
    });
};

/**
 * Helper: Unified format for failed response
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

        // 1. Check required fields
        if (!title?.trim() || !content?.trim()) {
            return sendError(res, 400, 'Title and content are required');
        }

        // 2. Check the allowed values
        if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
            return sendError(res, 400, `Invalid priority. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
        }
        if (targetRole && !ALLOWED_TARGET_ROLES.includes(targetRole)) {
            return sendError(res, 400, `Invalid targetRole. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`);
        }

        // Verify that the user exists and has the _id to avoid any TypeError
        if (!req.userDoc || !req.userDoc._id) {
            return sendError(res, 403, 'User profile is invalid or missing _id');
        }

        // 3. Create the ad
        const announcement = await Announcement.create({
            title: title.trim(),
            content: content.trim(),
            priority: priority || 'medium',
            targetRole: targetRole || 'all',
            createdBy: req.userDoc._id,
            status: 'active'
        });

        // 4. Send a Real-Time notification (the basic ad data is sent, not just the ID)
        const io = req.app.get('io');
        if (io && typeof io.emit === 'function') {
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
        // If the error is from Mongoose Validation
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        // Attach error text to the response to aid in debugging
        return sendError(res, 500, `Failed to create announcement: ${error.message}`);
    }
};

// ==========================================
// GET /api/announcements
// ==========================================
exports.getAllAnnouncements = async (req, res) => {
    try {
        // Build the filter based on the user role
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

        // Use .lean() to improve performance because we do not need Document functions
        const announcements = await Announcement.find(filter)
            .select('_id title status priority targetRole createdAt') // We select the required fields
            .sort({ createdAt: -1 })
            .lean();

        //Format the returned data
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

        // Access permissions for non-admins
        if (req.user.role !== 'admin') {
            const canAccess =
                announcement.status === 'active' &&
                (announcement.targetRole === 'all' || announcement.targetRole === req.user.role);

            if (!canAccess) {
                return sendError(res, 403, 'You do not have permission to view this announcement');
            }
        }

        //Format the data (remove internal fields if they exist)
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
        // If the ID is incorrect
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

        // Only fields allowed to be modified (prevent mass assignment)
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

        // Check the values ​​if they were sent
        if (updates.priority && !ALLOWED_PRIORITIES.includes(updates.priority)) {
            return sendError(res, 400, `Invalid priority. Allowed: ${ALLOWED_PRIORITIES.join(', ')}`);
        }
        if (updates.targetRole && !ALLOWED_TARGET_ROLES.includes(updates.targetRole)) {
            return sendError(res, 400, `Invalid targetRole. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`);
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        // Add modification date
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

        // You can send a Real-Time deletion notification if you want
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