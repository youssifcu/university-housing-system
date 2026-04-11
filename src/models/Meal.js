const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Meal name is required'],
            trim: true,
            maxlength: [100, 'Meal name cannot exceed 100 characters']
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        mealType: {
            type: String,
            enum: {
                values: ['breakfast', 'lunch', 'dinner', 'snack'],
                message: 'Meal type must be breakfast, lunch, dinner, or snack'
            },
            required: [true, 'Meal type is required']
        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative']
        },
        date: {
            type: Date,
            required: [true, 'Serving date is required'],
            index: true
        },
        servingTime: {
            start: { type: String }, // e.g., "08:00"
            end: { type: String }    // e.g., "10:00"
        },
        maxBookings: {
            type: Number,
            min: [0, 'Maximum bookings cannot be negative'],
            default: 0 // 0 means unlimited
        },
        currentBookings: {
            type: Number,
            default: 0,
            min: [0, 'Current bookings cannot be negative']
        },
        isAvailable: {
            type: Boolean,
            default: true
        },
        ingredients: [{
            name: { type: String, trim: true },
            allergens: [{ type: String, trim: true }]
        }],
        nutritionalInfo: {
            calories: Number,
            protein: Number,
            carbs: Number,
            fat: Number
        },
        image: {
            url: String,
            alt: String
        },
        createdBy: {
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

// ==========================================
// Virtuals
// ==========================================
mealSchema.virtual('availableBookings').get(function() {
    if (this.maxBookings === 0) return Infinity;
    return Math.max(0, this.maxBookings - this.currentBookings);
});

mealSchema.virtual('isFullyBooked').get(function() {
    return this.maxBookings > 0 && this.currentBookings >= this.maxBookings;
});

mealSchema.virtual('bookingRate').get(function() {
    if (this.maxBookings === 0) return 0;
    return (this.currentBookings / this.maxBookings) * 100;
});

// ==========================================
// Indexes
// ==========================================
// منع تكرار نفس نوع الوجبة في نفس اليوم (اختياري)
mealSchema.index(
    { date: 1, mealType: 1 },
    { unique: true, partialFilterExpression: { mealType: { $exists: true } } }
);

mealSchema.index({ date: 1, isAvailable: 1 });
mealSchema.index({ mealType: 1, date: -1 });

// ==========================================
// Static Methods
// ==========================================
mealSchema.statics.findAvailable = function(date = null) {
    const query = { isAvailable: true };
    if (date) {
        const start = new Date(date);
        start.setHours(0, 0, 0, 0);
        const end = new Date(date);
        end.setHours(23, 59, 59, 999);
        query.date = { $gte: start, $lte: end };
    }
    return this.find(query).sort({ date: 1, mealType: 1 });
};

mealSchema.statics.getMealsForDate = async function(date) {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    return this.aggregate([
        { $match: { date: { $gte: start, $lte: end } } },
        {
            $lookup: {
                from: 'mealbookings',
                localField: '_id',
                foreignField: 'mealId',
                as: 'bookings'
            }
        },
        {
            $addFields: {
                bookingCount: { $size: '$bookings' },
                servedCount: {
                    $size: {
                        $filter: {
                            input: '$bookings',
                            as: 'booking',
                            cond: { $eq: ['$$booking.isServed', true] }
                        }
                    }
                }
            }
        },
        { $sort: { mealType: 1 } }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
mealSchema.pre('save', function(next) {
    // تحديث isAvailable تلقائياً إذا اكتمل الحجز
    if (this.maxBookings > 0 && this.currentBookings >= this.maxBookings) {
        this.isAvailable = false;
    }
    next();
});

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;