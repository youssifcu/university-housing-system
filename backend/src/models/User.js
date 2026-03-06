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

const Student = User.discriminator('student', new mongoose.Schema({
  studentId: { type: String, required: true, unique: true, trim: true },
  universityYear: { type: Number, min: 1, max: 7 },
  faculty: { type: String, trim: true },
  housingStatus: { 
    type: String, 
    enum: [
      'new_applicant',
      'currently_resident',
      'previously_resident',
      'discontinued',
      'banned'
    ], 
    default: 'new_applicant' 
  },
  academicStatus: { type: String, enum: ['active', 'graduated', 'suspended'], default: 'active' },
  banReason: { type: String, default: '' }
}));

const ComputerAdmin = User.discriminator('computer_admin', new mongoose.Schema({
  labNumber: { type: String, required: true },
  technicalSkills: [{ type: String }],
  officeHours: {
    start: { type: String },
    end: { type: String }
  },
  managedAssetsCount: { type: Number, default: 0 }
}));

const FloorAdmin = User.discriminator('floor_admin', new mongoose.Schema({
  floorNumber: { type: Number, required: true },
  buildingResponsibility: { type: String, required: true },
  emergencyContact: { type: String },
  isNightShift: { type: Boolean, default: false }
}));

const RestaurantAdmin = User.discriminator('restaurant_admin', new mongoose.Schema({
  restaurantSection: { type: String, default: 'Main' },
  healthCertificateNumber: { type: String },
  stockManagementAccess: { type: Boolean, default: true },
  dailyMealsLimit: { type: Number, default: 500 }
}));

module.exports = { User, Student, ComputerAdmin, FloorAdmin, RestaurantAdmin };