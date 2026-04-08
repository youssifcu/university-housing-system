const mongoose = require('mongoose');
const QRCode = require('qrcode');

const baseOptions = {
  discriminatorKey: 'role',
  collection: 'users',
  timestamps: true
};

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, required: true, trim: true },
  phoneNumber: { type: String, trim: true },
  profilePicture: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, baseOptions);

const User = mongoose.model('User', userSchema);

const studentSchema = new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  universityYear: { type: Number, min: 1, max: 7 },
  faculty: { type: String, trim: true },
  registrationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  approvalDate: { type: Date, default: null },
  approvalReason: { type: String, default: '' },
  assignedRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  roomAllocationDate: { type: Date, default: null },
  qrCode: {
    attendanceCode: { type: String, default: null },
    attendanceQR: { type: String, default: null },
    mealCode: { type: String, default: null },
    mealQR: { type: String, default: null }
  },
  leaveStatus: {
    isOnLeave: { type: Boolean, default: false },
    leaveStartDate: { type: Date, default: null },
    leaveEndDate: { type: Date, default: null },
    leaveReason: { type: String, default: '' },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  },
  documents: {
    studentIdCard: { url: String, uploadedAt: Date },
    nationalId: { url: String, uploadedAt: Date },
    clearance: { url: String, uploadedAt: Date }
  },
  housingStatus: { 
    type: String, 
    enum: ['new_applicant', 'currently_resident', 'previously_resident', 'discontinued', 'banned'], 
    default: 'new_applicant' 
  },
  academicStatus: { type: String, enum: ['active', 'graduated', 'suspended'], default: 'active' },
  banReason: { type: String, default: '' }
});

const Student = User.discriminator('student', studentSchema);

const ComputerAdmin = User.discriminator('computer_admin', new mongoose.Schema({
  labNumber: { type: String, required: true },
  technicalSkills: [{ type: String }],
  officeHours: { start: { type: String }, end: { type: String } },
  managedAssetsCount: { type: Number, default: 0 },
  isMainSupervisor: { type: Boolean, default: false }
}));

const FloorAdmin = User.discriminator('floor_admin', new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  buildingResponsibility: { type: String, required: true },
  emergencyContact: { type: String },
  isNightShift: { type: Boolean, default: false },
  managedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}));

const MealAdmin = User.discriminator('meal_admin', new mongoose.Schema({
  restaurantSection: { type: String, default: 'Main' },
  healthCertificateNumber: { type: String },
  stockManagementAccess: { type: Boolean, default: true },
  dailyMealsLimit: { type: Number, default: 500 },
  todaysMealCount: { type: Number, default: 0 }
}));

const SupervisorAdmin = User.discriminator('supervisor', new mongoose.Schema({
  supervisorType: { type: String, enum: ['housing', 'academic', 'discipline'], required: true },
  department: { type: String },
  officeLocation: { type: String },
  assignedStudentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}));

module.exports = { User, Student, ComputerAdmin, FloorAdmin, MealAdmin, SupervisorAdmin };