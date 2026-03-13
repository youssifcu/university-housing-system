const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  // Identification & Linking
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentType: { type: String, required: true }, // e.g., New Student, Returning
  nationality: { type: String, required: true },
  nationalId: { type: String, required: true },
  shuonId: { type: String }, // Student Affairs ID
  fullName: { type: String, required: true },
  
  // Personal Details
  dateOfBirth: { type: Date, required: true },
  placeOfBirth: { type: String, required: true },
  gender: { 
    type: String, 
    enum: ['male', 'female'], 
    required: true 
  },
  religion: { type: String },
  residenceAddress: { type: String, required: true },
  detailedAddress: { type: String },
  phone: { type: String },
  mobile: { type: String, required: true },

  // Family & Guardian Information
  fatherName: { type: String, required: true },
  fatherNationalId: { type: String, required: true },
  fatherJob: { type: String },
  fatherPhone: { type: String },
  fatherAddress: { type: String },
  guardianName: { type: String },
  guardianRelation: { type: String },
  guardianNationalId: { type: String },
  guardianPhone: { type: String },
  guardianAddress: { type: String },
  parentsStatus: { type: String }, // Marital status

  // Academic Information
  college: { type: String, required: true },
  academicYear: { type: String, required: true },
  lastYearGrade: { type: String },
  gradePercentage: { type: Number },

  // Housing Preferences & Requirements
  previousHousing: { type: Boolean, default: false },
  housingType: { type: String }, // e.g., Normal, Distinguished
  hasSpecialNeeds: { type: Boolean, default: false },
  familyAbroad: { type: Boolean, default: false },
  hasMedicalCondition: { type: Boolean, default: false },
  medicalReport: { type: String }, // URL to uploaded file

  // Administrative Fields
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_update'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to an Admin/Supervisor
  },
  rejectionReason: { type: String },
  submittedAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date } , 
  
  documentUrl: {
    type: String,
    required: [true, 'Please upload the required PDF document']
  }

  
}, {
  timestamps: true // Adds createdAt and updatedAt
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;