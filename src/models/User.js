const mongoose = require('mongoose');

// ==========================================
// Base Options & Schema
// ==========================================
const baseOptions = {
    discriminatorKey: 'role',
    collection: 'users',
    timestamps: true
};

const userSchema = new mongoose.Schema(
    {
        firebaseUid: {
            type: String,
            required: [true, 'Firebase UID is required'],
            unique: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters']
        },
        phoneNumber: {
            type: String,
            required: [true, 'Phone number is required'],
            trim: true,
            match: [/^01[0-2,5]{1}[0-9]{8}$/, 'Please enter a valid Egyptian phone number']
        },
        profilePicture: {
            type: String,
            default: ''
        },
        role: {
            type: String,
            enum: ['student', 'supervisor', 'floor_admin', 'admin', 'security', 'meal_admin'],
            required: true,
            index: true
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true
        },
        lastLogin: Date
    },
    baseOptions
);

// ==========================================
// Instance Methods (لجميع المستخدمين)
// ==========================================
userSchema.methods.toProfileJSON = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        role: this.role,
        profilePicture: this.profilePicture,
        phoneNumber: this.phoneNumber
    };
};

// ==========================================
// Static Methods
// ==========================================
userSchema.statics.findByRole = function(role) {
    return this.find({ role, isActive: true });
};

userSchema.statics.findActiveUsers = function() {
    return this.find({ isActive: true });
};

const User = mongoose.model('User', userSchema);

// ==========================================
// Student Schema (Discriminator)
// ==========================================
const studentSchema = new mongoose.Schema({
    studentId: {
        type: String,
        required: [true, 'Student ID is required'],
        unique: true,
        trim: true,
        index: true
    },
    nationalId: {
        type: String,
        required: [true, 'National ID is required'],
        unique: true,
        match: [/^\d{14}$/, 'National ID must be 14 digits']
    },
    universityYear: {
        type: Number,
        min: [1, 'University year must be at least 1'],
        max: [7, 'University year cannot exceed 7']
    },
    faculty: {
        type: String,
        required: [true, 'Faculty is required'],
        trim: true
    },
    department: {
        type: String,
        trim: true
    },
    grade: {
        type: Number,
        min: [1, 'Student grade must be at least 1'],
        max: [10, 'Student grade cannot exceed 10'],
        default: 5,
        description: 'Academic grade level (1-10, determines eligible buildings)'
    },
    housingStatus: {
        type: String,
        enum: {
            values: ['new_applicant', 'active', 'inactive', 'suspended', 'banned', 'graduated'],
            message: 'Invalid housing status'
        },
        default: 'new_applicant',
        index: true
    },
    applicationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Application',
        default: null
    },
    assignedRoomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Room',
        default: null,
        index: true
    },
    bedNumber: {
        type: Number,
        default: null,
        min: [1, 'Bed number must be at least 1']
    },
    roomAllocationDate: {
        type: Date,
        default: null
    },
    qrCode: {
        attendanceCode: { type: String, default: null },
        attendanceQR: { type: String, default: null },
        mealCode: { type: String, default: null },
        mealQR: { type: String, default: null },
        generatedAt: { type: Date, default: null }
    },
    leaveStatus: {
        isOnLeave: { type: Boolean, default: false },
        leaveStartDate: { type: Date, default: null },
        leaveEndDate: { type: Date, default: null },
        leaveReason: { type: String, default: '' },
        approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    }
});

// Virtual for student's full academic info
studentSchema.virtual('academicInfo').get(function() {
    return `${this.faculty} - Year ${this.universityYear}`;
});

// Static method to find active residents
studentSchema.statics.findActiveResidents = function() {
    return this.find({ housingStatus: 'active', assignedRoomId: { $ne: null } });
};

const Student = User.discriminator('student', studentSchema);

// ==========================================
// Floor Admin Schema (Discriminator)
// ==========================================
const floorAdminSchema = new mongoose.Schema({
    floorNumber: {
        type: Number,
        required: [true, 'Floor number is required'],
        min: [0, 'Floor number cannot be negative']
    },
    buildingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        required: [true, 'Building is required'],
        index: true
    },
    isNightShift: {
        type: Boolean,
        default: false
    }
});

floorAdminSchema.virtual('shift').get(function() {
    return this.isNightShift ? 'Night' : 'Day';
});

const FloorAdmin = User.discriminator('floor_admin', floorAdminSchema);

// ==========================================
// Supervisor Schema (Discriminator)
// ==========================================
const supervisorSchema = new mongoose.Schema({
    supervisorType: {
        type: String,
        enum: {
            values: ['housing', 'academic', 'discipline', 'general'],
            message: 'Invalid supervisor type'
        },
        required: [true, 'Supervisor type is required']
    },
    department: {
        type: String,
        trim: true
    },
    assignedBuildings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building'
    }]
});

const Supervisor = User.discriminator('supervisor', supervisorSchema);

// ==========================================
// Admin Schema (Discriminator)
// ==========================================
const adminSchema = new mongoose.Schema({
    adminType: {
        type: String,
        enum: {
            values: ['super_admin', 'system_admin', 'operations_admin'],
            message: 'Invalid admin type'
        },
        default: 'system_admin',
        description: 'Type of admin access'
    },
    department: {
        type: String,
        trim: true,
        default: 'Administration'
    },
    permissions: [{
        type: String,
        enum: ['manage_users', 'manage_buildings', 'manage_payments', 'manage_reports', 'manage_announcements', 'system_config'],
        default: ['manage_users', 'manage_buildings', 'manage_reports', 'manage_announcements']
    }],
    lastAuditLog: {
        action: String,
        timestamp: Date,
        details: String
    }
});

const Admin = User.discriminator('admin', adminSchema);

// ==========================================
// Meal Admin Schema (Discriminator)
// ==========================================
const mealAdminSchema = new mongoose.Schema({
    mealAdminType: {
        type: String,
        enum: {
            values: ['head_chef', 'cook', 'server', 'manager'],
            message: 'Invalid meal admin type'
        },
        required: [true, 'Meal admin type is required'],
        description: 'Role in meal service operations'
    },
    kitchenAssignment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Building',
        description: 'Kitchen location (building)'
    },
    workShift: {
        type: String,
        enum: {
            values: ['morning', 'afternoon', 'evening', 'night', 'full_day'],
            message: 'Invalid work shift'
        },
        default: 'full_day'
    },
    specialization: [{
        type: String,
        trim: true
    }],
    mealBudgetAllowance: {
        type: Number,
        min: [0, 'Budget cannot be negative'],
        default: 0,
        description: 'Monthly meal budget allowance'
    }
});

const MealAdmin = User.discriminator('meal_admin', mealAdminSchema);
userSchema.index({ role: 1, isActive: 1 });
studentSchema.index({ housingStatus: 1, assignedRoomId: 1 });
studentSchema.index({ faculty: 1, universityYear: 1 });

module.exports = { User, Student, FloorAdmin, Supervisor, Admin, MealAdmin };