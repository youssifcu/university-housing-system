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
            required: [true, 'Room must belong to a building'],
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
            max: [10, 'Capacity cannot exceed 10'],
            default: 4
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
        amenities: [{
            name: { type: String, trim: true },
            isWorking: { type: Boolean, default: true }
        }],
        notes: {
            type: String,
            trim: true,
            maxlength: [500, 'Notes cannot exceed 500 characters']
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
roomSchema.virtual('occupancy').get(function () {
    return this.currentOccupants ? this.currentOccupants.length : 0;
});

roomSchema.virtual('availableSeats').get(function () {
    return Math.max(0, this.capacity - this.occupancy);
});

roomSchema.virtual('isAvailable').get(function () {
    return this.status === 'available' && this.occupancy < this.capacity;
});

// ==========================================
// Indexes
// ==========================================
roomSchema.index({ buildingId: 1, floorNumber: 1, roomNumber: 1 }, { unique: true });
roomSchema.index({ buildingId: 1, status: 1 });
roomSchema.index({ currentOccupants: 1 });

// ==========================================
// Pre-save Middleware (  )
// ==========================================
roomSchema.pre('save', function () {
    const occupantCount = this.currentOccupants ? this.currentOccupants.length : 0;

    if (this.status === 'maintenance') {

    } else if (occupantCount >= this.capacity) {
        this.status = 'full';
    } else {
        this.status = 'available';
    }
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;
