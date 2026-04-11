const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User reference is required'],
            unique: true,
            index: true
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Application',
            required: [true, 'Application reference is required'],
            unique: true
        },
        nationalId: {
            type: String,
            required: [true, 'National ID is required'],
            trim: true,
            match: [/^\d{14}$/, 'National ID must be 14 digits']
        },
        universityId: {
            type: String,
            required: [true, 'University ID is required'],
            trim: true,
            unique: true
        },
        faculty: {
            type: String,
            required: [true, 'Faculty is required'],
            trim: true
        },
        academicYear: {
            type: String,
            required: [true, 'Academic year is required'],
            enum: {
                values: ['1', '2', '3', '4', '5', '6', 'preparatory'],
                message: 'Invalid academic year'
            }
        },
        housingStatus: {
            type: String,
            enum: {
                values: ['active', 'inactive', 'suspended', 'graduated'],
                message: 'Status must be active, inactive, suspended, or graduated'
            },
            default: 'active',
            index: true
        },
        roomId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Room',
            index: true
        },
        bedNumber: {
            type: Number,
            min: [1, 'Bed number must be at least 1']
        },
        qrCode: {
            type: String,
            unique: true,
            sparse: true,
            trim: true
        },
        leaveStatus: {
            isOnLeave: { type: Boolean, default: false },
            leaveStartDate: Date,
            leaveEndDate: Date,
            leaveReason: String,
            approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
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
studentSchema.virtual('isActive').get(function() {
    return this.housingStatus === 'active';
});

// ==========================================
// Indexes
// ==========================================
studentSchema.index({ housingStatus: 1, roomId: 1 });
studentSchema.index({ faculty: 1, academicYear: 1 });

// ==========================================
// Pre-save Middleware
// ==========================================
studentSchema.pre('save', function(next) {
    if (this.isModified('housingStatus') && this.housingStatus !== 'active') {
        this.roomId = undefined;
        this.bedNumber = undefined;
    }
    next();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;