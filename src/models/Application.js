const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true
        },
        studentType: {
            type: String,
            enum: {
                values: ['new', 'returning'],
                message: 'Student type must be either new or returning'
            },
            required: [true, 'Student type is required']
        },
        nationalId: {
            type: String,
            required: [true, 'National ID is required'],
            unique: true,
            trim: true,
            match: [/^\d{14}$/, 'National ID must be 14 digits']
        },
        fullName: {
            type: String,
            required: [true, 'Full name is required'],
            trim: true,
            maxlength: [100, 'Full name cannot exceed 100 characters']
        },

        // Personal Details
        gender: {
            type: String,
            enum: {
                values: ['male', 'female'],
                message: 'Gender must be male or female'
            },
            required: [true, 'Gender is required']
        },
        dateOfBirth: {
            type: Date,
            required: [true, 'Date of birth is required'],
            validate: {
                validator: function(value) {
                    const today = new Date();
                    const birthDate = new Date(value);
                    let age = today.getFullYear() - birthDate.getFullYear();
                    const monthDiff = today.getMonth() - birthDate.getMonth();
                    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                    }
                    return age >= 16;
                },
                message: 'Student must be at least 16 years old'
            }
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            match: [/^01[0-2,5]{1}[0-9]{8}$/, 'Please enter a valid Egyptian phone number']
        },
        email: {
            type: String,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        address: {
            type: String,
            required: [true, 'Residence address is required'],
            trim: true,
            maxlength: [200, 'Address cannot exceed 200 characters']
        },
        emergencyContact: {
            name: { type: String, trim: true },
            phone: { 
                type: String, 
                trim: true,
                match: [/^01[0-2,5]{1}[0-9]{8}$/, 'Please enter a valid phone number']
            },
            relation: { type: String, trim: true }
        },

        // Academic Information
        college: {
            type: String,
            required: [true, 'College is required'],
            trim: true
        },
        department: {
            type: String,
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
        gpa: {
            type: Number,
            min: [0, 'GPA cannot be negative'],
            max: [4.0, 'GPA cannot exceed 4.0']
        },

        // Housing Details
        housingType: {
            type: String,
            enum: {
                values: ['normal', 'distinguished'],
                message: 'Housing type must be normal or distinguished'
            },
            default: 'normal'
        },
        specialNeeds: {
            hasSpecialNeeds: { type: Boolean, default: false },
            description: { type: String, trim: true }
        },
        preferredRoommate: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },

        // Administrative
        status: {
            type: String,
            enum: {
                values: ['pending', 'under_review', 'approved', 'rejected', 'needs_update', 'waitlist'],
                message: 'Invalid application status'
            },
            default: 'pending',
            index: true
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        reviewedAt: Date,
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Rejection reason cannot exceed 500 characters']
        },
        adminNotes: {
            type: String,
            trim: true
        },

        // Files
        documents: {
            nationalIdCard: { data: Buffer, contentType: String, originalName: String, uploadedAt: Date },
            personalPhoto: { data: Buffer, contentType: String, originalName: String, uploadedAt: Date },
            medicalReport: { data: Buffer, contentType: String, originalName: String, uploadedAt: Date },
            universityIdCard: { data: Buffer, contentType: String, originalName: String, uploadedAt: Date },
            additionalDocuments: [{
                name: String, data: Buffer, contentType: String, originalName: String, uploadedAt: Date
            }]
        },

        // للتتبع
        submittedFromIP: String,
        lastUpdatedBy: {
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

// Virtuals
applicationSchema.virtual('age').get(function() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
});

applicationSchema.virtual('isComplete').get(function() {
    return !!(
        this.fullName && this.nationalId && this.gender && this.dateOfBirth &&
        this.phoneNumber && this.address &&
        this.college && this.academicYear &&
        this.documents?.nationalIdCard?.data && this.documents?.personalPhoto?.data
    );
});

applicationSchema.virtual('canBeReviewed').get(function() {
    return this.status === 'pending' && this.isComplete;
});

// Indexes
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ userId: 1, status: 1 });
applicationSchema.index({ college: 1, academicYear: 1 });
applicationSchema.index({ 'documents.nationalIdCard.uploadedAt': 1 });

// Static Methods
applicationSchema.statics.findPending = function() {
    return this.find({ status: 'pending' }).sort({ createdAt: 1 });
};
applicationSchema.statics.findByCollege = function(college) {
    return this.find({ college, status: { $ne: 'rejected' } });
};
applicationSchema.statics.getStats = async function() {
    return this.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]);
};

// Pre-save Middleware
applicationSchema.pre('save', function() {
    if (this.isModified('status') && ['approved', 'rejected', 'needs_update'].includes(this.status)) {
        this.reviewedAt = new Date();
    }
    if (this.phoneNumber) {
        this.phoneNumber = this.phoneNumber.replace(/\s+/g, '');
    }
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;