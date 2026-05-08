const mongoose = require('mongoose');

const mealBookingSchema = new mongoose.Schema(
    {
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Student reference is required'],
            index: true
        },
        mealId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Meal',
            required: [true, 'Meal reference is required'],
            index: true
        },
        date: {
            type: Date,
            required: [true, 'Booking date is required'],
            index: true
        },
        status: {
            type: String,
            enum: {
                values: ['booked', 'cancelled', 'missed'],
                message: 'Status must be booked, cancelled, or missed'
            },
            default: 'booked',
            index: true
        },
        isServed: {
            type: Boolean,
            default: false,
            index: true
        },
        servedAt: Date,
        servedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        cancellationReason: {
            type: String,
            trim: true,
            maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
        },
        cancelledAt: Date,
        rating: {
            type: Number,
            min: [1, 'Rating must be at least 1'],
            max: [5, 'Rating cannot exceed 5']
        },
        review: {
            type: String,
            trim: true,
            maxlength: [500, 'Review cannot exceed 500 characters']
        },
        specialRequests: {
            type: String,
            trim: true,
            maxlength: [200, 'Special requests cannot exceed 200 characters']
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
mealBookingSchema.virtual('isActive').get(function () {
    return this.status === 'booked' && !this.isServed;
});

mealBookingSchema.virtual('canCancel').get(function () {
    return this.status === 'booked' && !this.isServed;
});

// ==========================================
// Indexes
// ==========================================
mealBookingSchema.index({ studentId: 1, mealId: 1 }, { unique: true });

mealBookingSchema.index({ date: 1, status: 1 });
mealBookingSchema.index({ mealId: 1, isServed: 1 });
mealBookingSchema.index({ studentId: 1, date: -1 });

// ==========================================
// Static Methods
// ==========================================
mealBookingSchema.statics.getStudentBookingStats = async function (studentId) {
    const result = await this.aggregate([
        { $match: { studentId: mongoose.Types.ObjectId(studentId) } },
        {
            $group: {
                _id: null,
                totalBookings: { $sum: 1 },
                servedCount: { $sum: { $cond: ['$isServed', 1, 0] } },
                cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
                missedCount: { $sum: { $cond: [{ $eq: ['$status', 'missed'] }, 1, 0] } }
            }
        }
    ]);
    return result[0] || { totalBookings: 0, servedCount: 0, cancelledCount: 0, missedCount: 0 };
};

mealBookingSchema.statics.hasActiveBooking = async function (studentId, mealId) {
    const booking = await this.findOne({
        studentId,
        mealId,
        status: 'booked'
    }).lean();
    return !!booking;
};

mealBookingSchema.statics.getMealBookingSummary = async function (mealId) {
    return this.aggregate([
        { $match: { mealId: mongoose.Types.ObjectId(mealId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                served: { $sum: { $cond: ['$isServed', 1, 0] } }
            }
        }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
mealBookingSchema.pre('save', function () {
    if (this.isModified('status') && this.status === 'cancelled') {
        this.cancelledAt = new Date();
    }

    if (this.isModified('isServed') && this.isServed) {
        this.servedAt = new Date();
        this.status = 'booked';
    }

});

const MealBooking = mongoose.model('MealBooking', mealBookingSchema);

module.exports = MealBooking;