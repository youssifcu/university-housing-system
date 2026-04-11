const mongoose = require('mongoose');

const studentRequestSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student ID is required'],
            index: true
        },
        requestType: {
            type: String,
            enum: {
                values: ['room_change', 'complaint', 'leave_request', 'meal_exception', 'maintenance'],
                message: 'Invalid request type'
            },
            required: [true, 'Request type is required']
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [150, 'Title cannot exceed 150 characters']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        startDate: {
            type: Date,
            required: function() {
                return this.requestType === 'leave_request';
            }
        },
        endDate: {
            type: Date,
            required: function() {
                return this.requestType === 'leave_request';
            }
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high', 'urgent'],
                message: 'Priority must be low, medium, high, or urgent'
            },
            default: 'medium',
            index: true
        },
        status: {
            type: String,
            enum: {
                values: ['submitted', 'in_review', 'needs_revision', 'approved', 'rejected', 'closed'],
                message: 'Invalid status'
            },
            default: 'submitted',
            index: true
        },
        statusReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Status reason cannot exceed 500 characters']
        },
        requestedAdminRole: {
            type: String,
            enum: {
                values: ['supervisor', 'it', 'meal_admin', 'floor_admin', 'admin'],
                message: 'Invalid admin role'
            },
            required: [true, 'Requested admin role is required']
        },
        assignedToUserId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true
        },
        messages: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            userRole: String,
            message: {
                type: String,
                required: true,
                trim: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }],
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        attachments: [{
            url: String,
            filename: String,
            uploadedAt: { type: Date, default: Date.now }
        }],
        relatedRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room'
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
studentRequestSchema.virtual('isPending').get(function() {
    return ['submitted', 'in_review', 'needs_revision'].includes(this.status);
});

studentRequestSchema.virtual('isClosed').get(function() {
    return ['approved', 'rejected', 'closed'].includes(this.status);
});

// ==========================================
// Indexes
// ==========================================
studentRequestSchema.index({ studentId: 1, status: 1 });
studentRequestSchema.index({ requestType: 1, status: 1 });
studentRequestSchema.index({ requestedAdminRole: 1, status: 1 });
studentRequestSchema.index({ assignedToUserId: 1, status: 1 });
studentRequestSchema.index({ createdAt: -1 });

// ==========================================
// Static Methods
// ==========================================
studentRequestSchema.statics.findPending = function() {
    return this.find({ status: { $in: ['submitted', 'in_review', 'needs_revision'] } })
        .populate('studentId', 'name email studentId')
        .sort({ priority: -1, createdAt: 1 });
};

studentRequestSchema.statics.findAssignedToUser = function(userId) {
    return this.find({ assignedToUserId: userId, status: { $nin: ['approved', 'rejected', 'closed'] } })
        .populate('studentId', 'name email');
};

// ==========================================
// Pre-save Middleware
// ==========================================
studentRequestSchema.pre('save', function(next) {
    // تعيين reviewedAt عند تغيير الحالة إلى approved أو rejected
    if (this.isModified('status') && ['approved', 'rejected'].includes(this.status)) {
        this.reviewedAt = new Date();
    }
    next();
});

const StudentRequest = mongoose.model('StudentRequest', studentRequestSchema);

module.exports = StudentRequest;