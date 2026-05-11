const mongoose = require('mongoose');
const Notification = require('../models/Notification');
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

const ALLOWED_TYPES = ['info', 'warning', 'success', 'meal', 'attendance', 'announcement'];
const ALLOWED_TARGET_ROLES = ['all', 'student', 'supervisor', 'security', 'admin'];

// ==========================================
// POST /api/notifications (Admin/System)
// ==========================================
exports.createNotification = async (req, res) => {
    try {
        const { title, message, targetUser, targetRole, type } = req.body;
        const senderId = req.userDoc._id;

        if (!title?.trim() || !message?.trim()) {
            return sendError(res, 400, 'Title and message are required');
        }

        if (type && !ALLOWED_TYPES.includes(type)) {
            return sendError(res, 400, `Invalid notification type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
        }

        if (targetRole && !ALLOWED_TARGET_ROLES.includes(targetRole)) {
            return sendError(res, 400, `Invalid target role. Allowed: ${ALLOWED_TARGET_ROLES.join(', ')}`);
        }

        if (targetUser && !mongoose.Types.ObjectId.isValid(targetUser)) {
            return sendError(res, 400, 'Invalid target user ID format');
        }

        const notification = new Notification({
            title: title.trim(),
            message: message.trim(),
            targetUser: targetUser || null,
            targetRole: targetUser ? null : (targetRole || 'all'),
            type: type || 'info',
            sender: senderId,
            isRead: false
        });

        await notification.save();

        const io = req.app.get('io');
        if (io) {
            const notificationData = {
                id: notification._id,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                createdAt: notification.createdAt
            };

            if (targetUser) {
                io.to(targetUser.toString()).emit('notification:new', notificationData);
            } else {
                const role = targetRole || 'all';
                io.to(`role:${role}`).emit('notification:new', notificationData);
            }
        }

        return sendSuccess(res, 201, 'Notification created successfully', {
            id: notification._id
        });

    } catch (error) {
        console.error('Create Notification Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to create notification', error.message);
    }
};

// ==========================================
// GET /api/notifications/me
// ==========================================
exports.getMyNotifications = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {
            $or: [
                { targetUser: req.userDoc._id },
                { targetRole: req.userDoc.role },
                { targetRole: 'all' }
            ]
        };

        if (req.query.isRead === 'true') {
            filter.isRead = true;
        } else if (req.query.isRead === 'false') {
            filter.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            Notification.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Notification.countDocuments(filter),
            Notification.countDocuments({ ...filter, isRead: false })
        ]);

        return sendSuccess(res, 200, 'Notifications fetched successfully', {
            notifications,
            unreadCount,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get My Notifications Error:', error);
        return sendError(res, 500, 'Failed to fetch notifications', error.message);
    }
};

// ==========================================
// PATCH /api/notifications/:id/read
// ==========================================
exports.markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid notification ID format');
        }

        const notification = await Notification.findOne({
            _id: id,
            $or: [
                { targetUser: req.userDoc._id },
                { targetRole: req.userDoc.role },
                { targetRole: 'all' }
            ]
        });

        if (!notification) {
            return sendError(res, 404, 'Notification not found or access denied');
        }

        if (notification.isRead) {
            return sendSuccess(res, 200, 'Notification already marked as read', { id });
        }

        notification.isRead = true;
        await notification.save();

        return sendSuccess(res, 200, 'Notification marked as read', { id });

    } catch (error) {
        console.error('Mark As Read Error:', error);
        return sendError(res, 500, 'Failed to mark notification as read', error.message);
    }
};

// ==========================================
// PATCH /api/notifications/read-all
// ==========================================
exports.markAllAsRead = async (req, res) => {
    try {
        const filter = {
            isRead: false,
            $or: [
                { targetUser: req.userDoc._id },
                { targetRole: req.userDoc.role },
                { targetRole: 'all' }
            ]
        };

        const result = await Notification.updateMany(filter, { isRead: true });

        return sendSuccess(res, 200, 'All notifications marked as read', {
            updatedCount: result.modifiedCount
        });

    } catch (error) {
        console.error('Mark All As Read Error:', error);
        return sendError(res, 500, 'Failed to mark all as read', error.message);
    }
};

// ==========================================
// GET /api/notifications/unread-count
// ==========================================
exports.getUnreadCount = async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            isRead: false,
            $or: [
                { targetUser: req.userDoc._id },
                { targetRole: req.userDoc.role },
                { targetRole: 'all' }
            ]
        });

        return sendSuccess(res, 200, 'Unread count fetched', { count });

    } catch (error) {
        console.error('Get Unread Count Error:', error);
        return sendError(res, 500, 'Failed to get unread count', error.message);
    }
};