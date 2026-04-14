const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: {
                values: ['maintenance', 'complaint', 'emergency', 'malfunction', 'other'],
                message: 'Report type must be maintenance, complaint, emergency, malfunction, or other'
            },
            required: [true, 'Report type is required']
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // تم التغيير إلى User ليتوافق مع النظام الموحد
            required: [true, 'Student reference is required'],
            index: true
        },
        reportedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Reporter reference is required']
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters']
        },
        imageUrls: [{
            type: String,
            trim: true
        }],
        severity: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high', 'critical'],
                message: 'Severity must be low, medium, high, or critical'
            },
            default: 'low',
            index: true
        },
        status: {
            type: String,
            enum: {
                values: ['open', 'in_progress', 'resolved', 'closed', 'reopened'],
                message: 'Status must be open, in_progress, resolved, closed, or reopened'
            },
            default: 'open',
            index: true
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        location: {
            buildingId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Building'
            },
            roomId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Room'
            },
            description: {
                type: String,
                trim: true
            }
        },
        resolvedAt: Date,
        resolutionNotes: {
            type: String,
            trim: true,
            maxlength: [500, 'Resolution notes cannot exceed 500 characters']
        },
        adminComment: {
            type: String,
            trim: true,
            maxlength: [500, 'Admin comment cannot exceed 500 characters']
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
reportSchema.virtual('isResolved').get(function() {
    return ['resolved', 'closed'].includes(this.status);
});

reportSchema.virtual('isUrgent').get(function() {
    return this.severity === 'critical' || this.severity === 'high';
});

// ==========================================
// Indexes
// ==========================================
reportSchema.index({ studentId: 1, status: 1 });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ severity: 1, createdAt: -1 });
reportSchema.index({ assignedTo: 1, status: 1 });
reportSchema.index({ 'location.buildingId': 1 });

// ==========================================
// Static Methods
// ==========================================
reportSchema.statics.findOpen = function() {
    return this.find({ status: { $in: ['open', 'in_progress', 'reopened'] } })
        .populate('studentId', 'name studentId')
        .sort({ severity: -1, createdAt: 1 });
};

reportSchema.statics.getStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
reportSchema.pre('save', function() {
    // تعيين تاريخ الحل عند تغيير الحالة إلى resolved أو closed
    if (this.isModified('status') && ['resolved', 'closed'].includes(this.status) && !this.resolvedAt) {
        this.resolvedAt = new Date();
    }
    // إذا أعيد فتح البلاغ، نمسح تاريخ الحل
    if (this.isModified('status') && this.status === 'reopened') {
        this.resolvedAt = undefined;
    }
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;