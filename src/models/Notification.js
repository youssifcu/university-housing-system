const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Notification title is required'],
            trim: true,
            maxlength: [100, 'Title cannot exceed 100 characters']
        },
        message: {
            type: String,
            required: [true, 'Notification message is required'],
            trim: true,
            maxlength: [500, 'Message cannot exceed 500 characters']
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        targetRole: {
            type: String,
            enum: {
                values: ['all', 'student', 'supervisor', 'security', 'admin', 'floor_admin', 'meal_admin'],
                message: 'Invalid target role'
            },
            index: true
        },
        type: {
            type: String,
            enum: {
                values: ['info', 'warning', 'success', 'meal', 'attendance', 'announcement', 'application', 'maintenance'],
                message: 'Invalid notification type'
            },
            default: 'info'
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true
        },
        readAt: Date,
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        },
        link: {
            type: String,
            trim: true
        },
        expiresAt: {
            type: Date
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// ==========================================
// Virtuals
// ==========================================
notificationSchema.virtual('isExpired').get(function () {
    return this.expiresAt && this.expiresAt < new Date();
});

// ==========================================
// Indexes
// ==========================================
notificationSchema.index({ targetUser: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ targetRole: 1, createdAt: -1 });
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 }); // TTL: حذف تلقائي بعد 30 يوم

// ==========================================
// Static Methods
// ==========================================
notificationSchema.statics.getUnreadCount = async function (userId, userRole) {
    return this.countDocuments({
        isRead: false,
        $or: [
            { targetUser: userId },
            { targetRole: 'all' },
            { targetRole: userRole }
        ]
    });
};

notificationSchema.statics.markAllAsRead = async function (userId, userRole) {
    return this.updateMany(
        {
            isRead: false,
            $or: [
                { targetUser: userId },
                { targetRole: 'all' },
                { targetRole: userRole }
            ]
        },
        {
            $set: { isRead: true, readAt: new Date() }
        }
    );
};

// ==========================================
// Pre-save Middleware
// ==========================================
notificationSchema.pre('save', function () {
    if (this.targetUser) {
        this.targetRole = undefined;
    }
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;