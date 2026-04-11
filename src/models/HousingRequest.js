const mongoose = require('mongoose');

const housingRequestSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
            index: true
        },
        type: {
            type: String,
            enum: {
                values: ['transfer', 'leave', 'vacate', 'maintenance'],
                message: 'Request type must be transfer, leave, vacate, or maintenance'
            },
            required: [true, 'Request type is required']
        },
        fromRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: function() {
                // مطلوب لجميع الأنواع باستثناء الصيانة (حسب السياق)
                return this.type !== 'maintenance';
            }
        },
        toRoomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            required: function() {
                return this.type === 'transfer';
            }
        },
        reason: {
            type: String,
            required: [true, 'Reason is required'],
            trim: true,
            maxlength: [500, 'Reason cannot exceed 500 characters']
        },
        startDate: {
            type: Date,
            required: function() {
                return this.type === 'leave' || this.type === 'vacate';
            },
            validate: {
                validator: function(value) {
                    return !value || value >= new Date();
                },
                message: 'Start date must be in the future'
            }
        },
        endDate: {
            type: Date,
            required: function() {
                return this.type === 'leave' || this.type === 'vacate';
            },
            validate: {
                validator: function(value) {
                    if (!value) return true;
                    return !this.startDate || value > this.startDate;
                },
                message: 'End date must be after start date'
            }
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected', 'cancelled'],
                message: 'Status must be pending, approved, rejected, or cancelled'
            },
            default: 'pending',
            index: true
        },
        priority: {
            type: String,
            enum: {
                values: ['low', 'medium', 'high', 'urgent'],
                message: 'Priority must be low, medium, high, or urgent'
            },
            default: 'medium'
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        adminComment: {
            type: String,
            trim: true,
            maxlength: [500, 'Admin comment cannot exceed 500 characters']
        },
        attachments: [{
            url: String,
            filename: String,
            uploadedAt: { type: Date, default: Date.now }
        }]
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
housingRequestSchema.virtual('isActive').get(function() {
    if (this.status !== 'approved') return false;
    if (this.type === 'leave' || this.type === 'vacate') {
        const now = new Date();
        return this.startDate <= now && this.endDate >= now;
    }
    return this.status === 'approved';
});

housingRequestSchema.virtual('durationDays').get(function() {
    if (this.startDate && this.endDate) {
        const diff = this.endDate - this.startDate;
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return null;
});

// ==========================================
// Indexes
// ==========================================
housingRequestSchema.index({ studentId: 1, status: 1 });
housingRequestSchema.index({ type: 1, status: 1 });
housingRequestSchema.index({ startDate: 1, endDate: 1 });
housingRequestSchema.index({ fromRoomId: 1, status: 1 });
housingRequestSchema.index({ createdAt: -1 });

// ==========================================
// Static Methods
// ==========================================
housingRequestSchema.statics.findPending = function() {
    return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};

housingRequestSchema.statics.findActiveForStudent = function(studentId) {
    return this.findOne({
        studentId,
        status: 'approved',
        $or: [
            { type: 'transfer' },
            {
                type: { $in: ['leave', 'vacate'] },
                startDate: { $lte: new Date() },
                endDate: { $gte: new Date() }
            }
        ]
    });
};

// ==========================================
// Pre-save Middleware
// ==========================================
housingRequestSchema.pre('save', function(next) {
    // تعيين reviewedAt تلقائياً عند تغيير الحالة إلى approved أو rejected
    if (this.isModified('status') && ['approved', 'rejected'].includes(this.status)) {
        this.reviewedAt = new Date();
    }

    // تأكد من أن الغرفة المصدر ليست نفس الغرفة الهدف في حالة النقل
    if (this.type === 'transfer' && this.fromRoomId && this.toRoomId) {
        if (this.fromRoomId.toString() === this.toRoomId.toString()) {
            return next(new Error('Source and target rooms cannot be the same'));
        }
    }

    next();
});

const HousingRequest = mongoose.model('HousingRequest', housingRequestSchema);

module.exports = HousingRequest;