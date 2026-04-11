const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema(
    {
        roomNumber: {
            type: String,
            required: [true, 'Room number is required'],
            trim: true,
            maxlength: [20, 'Room number cannot exceed 20 characters']
        },
        buildingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Building',
            required: [true, 'Building reference is required'],
            index: true
        },
        floorNumber: {
            type: Number,
            required: [true, 'Floor number is required'],
            min: [0, 'Floor number cannot be negative'],
            max: [20, 'Floor number cannot exceed 20']
        },
        capacity: {
            type: Number,
            required: [true, 'Room capacity is required'],
            min: [1, 'Capacity must be at least 1'],
            max: [10, 'Capacity cannot exceed 10']
        },
        currentOccupants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: {
                values: ['available', 'full', 'maintenance', 'reserved'],
                message: 'Status must be available, full, maintenance, or reserved'
            },
            default: 'available',
            index: true
        },
        roomType: {
            type: String,
            enum: {
                values: ['single', 'double', 'triple', 'suite'],
                message: 'Room type must be single, double, triple, or suite'
            },
            default: 'double'
        },
        price: {
            type: Number,
            min: [0, 'Price cannot be negative']
        },
        amenities: [{
            name: { type: String, trim: true },
            isWorking: { type: Boolean, default: true }
        }],
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters']
        },
        lastMaintenanceDate: Date,
        nextMaintenanceDate: Date
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
roomSchema.virtual('occupancy').get(function() {
    return this.currentOccupants ? this.currentOccupants.length : 0;
});

roomSchema.virtual('availableSeats').get(function() {
    return Math.max(0, this.capacity - this.occupancy);
});

roomSchema.virtual('isAvailable').get(function() {
    return this.status === 'available' && this.occupancy < this.capacity;
});

roomSchema.virtual('occupancyRate').get(function() {
    if (this.capacity === 0) return 0;
    return (this.occupancy / this.capacity) * 100;
});

// ==========================================
// Indexes
// ==========================================
roomSchema.index({ buildingId: 1, floorNumber: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ buildingId: 1, status: 1 });
roomSchema.index({ currentOccupants: 1 });

// ==========================================
// Static Methods
// ==========================================
roomSchema.statics.findAvailable = function(buildingId = null) {
    const query = { status: 'available', $expr: { $lt: [{ $size: '$currentOccupants' }, '$capacity'] } };
    if (buildingId) query.buildingId = buildingId;
    return this.find(query).populate('buildingId', 'name gender');
};

roomSchema.statics.getStatsByBuilding = async function(buildingId) {
    return this.aggregate([
        { $match: { buildingId: mongoose.Types.ObjectId(buildingId) } },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalCapacity: { $sum: '$capacity' },
                totalOccupants: { $sum: { $size: '$currentOccupants' } }
            }
        }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
roomSchema.pre('save', function(next) {
    // تحديث الحالة تلقائياً بناءً على الإشغال
    const occupantCount = this.currentOccupants ? this.currentOccupants.length : 0;
    
    if (this.status === 'maintenance') {
        // إذا كانت في صيانة، نترك الحالة كما هي
    } else if (occupantCount >= this.capacity) {
        this.status = 'full';
    } else {
        this.status = 'available';
    }
    
    next();
});

// ==========================================
// Pre-update Middleware
// ==========================================
roomSchema.pre('findOneAndUpdate', function(next) {
    const update = this.getUpdate();
    
    // إذا تم تحديث currentOccupants، نعيد حساب الحالة
    if (update.$set && update.$set.currentOccupants) {
        const occupantCount = update.$set.currentOccupants.length;
        const capacity = update.$set.capacity;
        
        if (capacity && occupantCount >= capacity) {
            update.$set.status = 'full';
        } else if (capacity && occupantCount < capacity) {
            update.$set.status = 'available';
        }
    }
    
    next();
});

const Housing = mongoose.model('Housing', roomSchema);
module.exports = Housing;