const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'Building name is required'],
            unique: true,
            trim: true,
            maxlength: [100, 'Building name cannot exceed 100 characters'],
            index: true
        },
        code: {
            type: String,
            trim: true,
            uppercase: true,
            maxlength: [10, 'Building code cannot exceed 10 characters']
        },
        gender: {
            type: String,
            enum: {
                values: ['male', 'female', 'mixed'],
                message: 'Gender must be male, female, or mixed'
            },
            required: [true, 'Building gender specification is required']
        },
        grade: {
            type: Number,
            required: [true, 'Building grade is required'],
            min: [1, 'Building grade must be at least 1'],
            max: [10, 'Building grade cannot exceed 10'],
            description: 'Grade level required for housing in this building (students with grade <= building grade can request)'
        },
        type: {
            type: String,
            enum: {
                values: ['dormitory', 'apartment', 'studio'],
                message: 'Building type must be dormitory, apartment, or studio'
            },
            default: 'dormitory'
        },
        floors: {
            type: Number,
            required: [true, 'Number of floors is required'],
            min: [1, 'Building must have at least one floor'],
            max: [20, 'Building cannot exceed 20 floors']
        },
        totalRooms: {
            type: Number,
            min: [0, 'Total rooms cannot be negative'],
            default: 0
        },
        address: {
            street: { type: String, trim: true },
            city: { type: String, trim: true, default: 'Cairo' },
            governorate: { type: String, trim: true },
            postalCode: { type: String, trim: true }
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, 'Description cannot exceed 500 characters']
        },
        supervisorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
            index: true
        },
        assistantSupervisors: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        status: {
            type: String,
            enum: {
                values: ['active', 'maintenance', 'inactive', 'full'],
                message: 'Status must be active, maintenance, inactive, or full'
            },
            default: 'active',
            index: true
        },
        amenities: [{
            name: { type: String, trim: true },
            description: { type: String, trim: true },
            isAvailable: { type: Boolean, default: true }
        }],
        contactInfo: {
            phone: { type: String, trim: true },
            email: { type: String, trim: true, lowercase: true }
        },
        images: [{
            url: { type: String, required: true },
            caption: { type: String, trim: true },
            isPrimary: { type: Boolean, default: false }
        }],
        operatingHours: {
            openTime: { type: String }, // e.g., "08:00"
            closeTime: { type: String }, // e.g., "22:00"
            visitingHours: { type: String }
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                validate: {
                    validator: function(v) {
                        return v.length === 2 &&
                               v[0] >= -180 && v[0] <= 180 &&
                               v[1] >= -90 && v[1] <= 90;
                    },
                    message: 'Invalid coordinates'
                }
            }
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
buildingSchema.virtual('occupancyRate').get(function() {
    if (!this.totalRooms || this.totalRooms === 0) return 0;
    // This requires population or separate query; return 0 by default.
    return 0;
});

buildingSchema.virtual('isAvailable').get(function() {
    return this.status === 'active';
});

buildingSchema.virtual('fullAddress').get(function() {
    const parts = [];
    if (this.address?.street) parts.push(this.address.street);
    if (this.address?.city) parts.push(this.address.city);
    if (this.address?.governorate) parts.push(this.address.governorate);
    return parts.join(', ');
});

// ==========================================
// Indexes
// ==========================================
buildingSchema.index({ gender: 1, status: 1 });
buildingSchema.index({ name: 'text', description: 'text' }); // Full-text search
buildingSchema.index({ location: '2dsphere' });
buildingSchema.index({ type: 1, status: 1 });

// ==========================================
// Static Methods
// ==========================================
buildingSchema.statics.findByGender = function(gender) {
    return this.find({ gender, status: 'active' }).select('name code floors supervisorId');
};

buildingSchema.statics.getBuildingsWithStats = async function() {
    return this.aggregate([
        {
            $lookup: {
                from: 'rooms',
                localField: '_id',
                foreignField: 'buildingId',
                as: 'rooms'
            }
        },
        {
            $addFields: {
                totalCapacity: { $sum: '$rooms.capacity' },
                occupiedBeds: { $sum: { $size: '$rooms.currentOccupants' } },
                availableBeds: { $subtract: [{ $sum: '$rooms.capacity' }, { $sum: { $size: '$rooms.currentOccupants' } }] }
            }
        },
        {
            $project: {
                name: 1,
                code: 1,
                gender: 1,
                floors: 1,
                status: 1,
                totalCapacity: 1,
                occupiedBeds: 1,
                availableBeds: 1,
                occupancyRate: {
                    $cond: {
                        if: { $eq: ['$totalCapacity', 0] },
                        then: 0,
                        else: { $multiply: [{ $divide: ['$occupiedBeds', '$totalCapacity'] }, 100] }
                    }
                }
            }
        },
        { $sort: { name: 1 } }
    ]);
};

// ==========================================
// Pre-save Middleware
// ==========================================
buildingSchema.pre('save', function(next) {
    // Auto-generate code from name if not provided
    if (!this.code && this.name) {
        this.code = this.name
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 6)
            .toUpperCase();
    }
    next();
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;