const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User', // تم التغيير إلى User ليتوافق مع النظام الموحد
            required: [true, 'Student reference is required'],
            index: true
        },
        amount: {
            type: Number,
            required: [true, 'Payment amount is required'],
            min: [0, 'Amount cannot be negative']
        },
        paymentMethod: {
            type: String,
            enum: {
                values: ['cash', 'card', 'bank_transfer', 'online', 'fawry'],
                message: 'Payment method must be cash, card, bank_transfer, online, or fawry'
            },
            required: [true, 'Payment method is required']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [200, 'Description cannot exceed 200 characters'],
            default: 'Housing Payment'
        },
        paymentDate: {
            type: Date,
            default: Date.now,
            index: true
        },
        dueDate: {
            type: Date,
            validate: {
                validator: function(value) {
                    return !value || value >= this.paymentDate;
                },
                message: 'Due date must be after payment date'
            }
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
                message: 'Status must be pending, completed, failed, refunded, or cancelled'
            },
            default: 'pending',
            index: true
        },
        transactionId: {
            type: String,
            unique: true,
            sparse: true // يسمح بقيم null متعددة
        },
        receiptUrl: {
            type: String
        },
        confirmedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        confirmedAt: Date,
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters']
        },
        refundReason: {
            type: String,
            trim: true
        },
        refundedAt: Date
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
paymentSchema.virtual('isOverdue').get(function() {
    if (!this.dueDate) return false;
    return this.status === 'pending' && new Date() > this.dueDate;
});

paymentSchema.virtual('isPaid').get(function() {
    return this.status === 'completed';
});

// ==========================================
// Indexes
// ==========================================
paymentSchema.index({ studentId: 1, status: 1 });
paymentSchema.index({ status: 1, dueDate: 1 });
paymentSchema.index({ paymentDate: -1 });

// ==========================================
// Static Methods
// ==========================================
paymentSchema.statics.getStudentPaymentSummary = async function(studentId) {
    const result = await this.aggregate([
        { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
        {
            $group: {
                _id: '$status',
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    const summary = {
        totalPaid: 0,
        totalPending: 0,
        totalRefunded: 0
    };
    
    result.forEach(item => {
        if (item._id === 'completed') summary.totalPaid = item.totalAmount;
        if (item._id === 'pending') summary.totalPending = item.totalAmount;
        if (item._id === 'refunded') summary.totalRefunded = item.totalAmount;
    });
    
    return summary;
};

paymentSchema.statics.getOverallStats = async function() {
    return this.aggregate([
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                completedAmount: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$amount', 0] } },
                pendingAmount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, '$amount', 0] } },
                totalTransactions: { $sum: 1 }
            }
        }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
paymentSchema.pre('save', function(next) {
    // توليد transactionId فريد إذا لم يكن موجوداً
    if (!this.transactionId) {
        this.transactionId = `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    }
    
    // تعيين confirmedAt عند تغيير الحالة إلى completed
    if (this.isModified('status') && this.status === 'completed' && !this.confirmedAt) {
        this.confirmedAt = new Date();
    }
    
    // تعيين refundedAt عند تغيير الحالة إلى refunded
    if (this.isModified('status') && this.status === 'refunded' && !this.refundedAt) {
        this.refundedAt = new Date();
    }
    
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;