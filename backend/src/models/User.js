const mongoose = require('mongoose');

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

// ---- Student Schema ----
const studentSchema = new mongoose.Schema({
  // Academic Info
  studentId: { type: String, required: true, unique: true, trim: true },
  nationalId: { type: String, required: true, unique: true },
  universityYear: { type: Number, min: 1, max: 7 },
  faculty: { type: String, required: true, trim: true },
  
  // Housing Info
  housingStatus: { 
    type: String, 
    enum: ['new_applicant', 'active', 'inactive', 'suspended', 'banned'], 
    default: 'new_applicant' 
  },
  applicationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Application', default: null },
  assignedRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', default: null },
  bedNumber: { type: Number, default: null }, // رقم السرير
  roomAllocationDate: { type: Date, default: null },
  
  // QRs & Operations
  qrCode: {
    attendanceCode: { type: String, default: null },
    mealCode: { type: String, default: null }
  },
  leaveStatus: {
    isOnLeave: { type: Boolean, default: false },
    leaveStartDate: { type: Date, default: null },
    leaveEndDate: { type: Date, default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
  }
});

const Student = User.discriminator('student', studentSchema);

// ---- Admins & Supervisors Schemas ----
const FloorAdmin = User.discriminator('floor_admin', new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building', required: true },
  isNightShift: { type: Boolean, default: false }
}));

const SupervisorAdmin = User.discriminator('supervisor', new mongoose.Schema({
  supervisorType: { type: String, enum: ['housing', 'academic', 'discipline'], required: true },
  department: { type: String }
}));

module.exports = { User, Student, FloorAdmin, SupervisorAdmin };