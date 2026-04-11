const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, 'Announcement title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
            index: true // فهرس للبحث السريع
        },
        content: {
            type: String,
            required: [true, 'Announcement content is required'],
            trim: true,
            maxlength: [5000, 'Content cannot exceed 5000 characters']
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high'],
                message: 'Priority must be low, medium, or high'
            },
            default: 'medium'
        },
        targetRole: {
            type: String,
            enum: {
                values: ['all', 'student', 'supervisor', 'security', 'admin', 'floor_admin', 'meal_admin'],
                message: 'Invalid target role'
            },
            default: 'all',
            index: true
        },
        targetUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }], // لإرسال الإعلان لمستخدمين محددين (اختياري)
        status: {
            type: String,
            enum: {
                values: ['active', 'archived', 'draft'],
                message: 'Status must be active, archived, or draft'
            },
            default: 'active',
            index: true
        },
        expiresAt: {
            type: Date,
            validate: {
                validator: function(value) {
                    return !value || value > new Date();
                },
                message: 'Expiration date must be in the future'
            }
        },
        attachments: [{
            url: String,
            filename: String,
            mimetype: String
        }],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Creator reference is required']
        },
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);

// Virtual field: isExpired
announcementSchema.virtual('isExpired').get(function() {
    return this.expiresAt && this.expiresAt < new Date();
});

// Virtual field: isActive (status active and not expired)
announcementSchema.virtual('isActive').get(function() {
    return this.status === 'active' && !this.isExpired;
});

// Compound index for common queries
announcementSchema.index({ status: 1, targetRole: 1, createdAt: -1 });
announcementSchema.index({ createdBy: 1, createdAt: -1 });
announcementSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index for auto-deletion

// Pre-save middleware to auto-update status if expired
announcementSchema.pre('save', function(next) {
    if (this.expiresAt && this.expiresAt < new Date() && this.status === 'active') {
        this.status = 'archived';
    }
    next();
});

// Static method to get active announcements for a user
announcementSchema.statics.getActiveForUser = function(userId, userRole) {
    const now = new Date();
    return this.find({
        status: 'active',
        $or: [
            { expiresAt: { $gt: now } },
            { expiresAt: null }
        ],
        $or: [
            { targetRole: 'all' },
            { targetRole: userRole },
            { targetUsers: userId }
        ]
    }).sort({ priority: -1, createdAt: -1 });
};

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;