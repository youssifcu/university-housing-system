const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentType: { type: String, enum: ['new', 'returning'], required: true },
  nationalId: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  
  // Personal Details
  gender: { type: String, enum: ['male', 'female'], required: true },
  dateOfBirth: { type: Date, required: true },
  mobile: { type: String, required: true },
  residenceAddress: { type: String, required: true },

  // Family Information
  fatherName: { type: String, required: true },
  fatherNationalId: { type: String, required: true },
  fatherPhone: { type: String },

  // Academic Information
  college: { type: String, required: true },
  academicYear: { type: String, required: true },
  gradePercentage: { type: Number },

  // Housing Details
  housingType: { type: String, enum: ['normal', 'distinguished'], default: 'normal' },
  hasSpecialNeeds: { type: Boolean, default: false },

  // Administrative
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_update'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason: { type: String },
  
  // التعديل هنا: تخزين روابط الملفات بدل الـ Buffer لسرعة الأداء
  files: {
    idCardUrl: { type: String }, 
    medicalReportUrl: { type: String },
    personalPhotoUrl: { type: String }
  }
}, {
  timestamps: true 
});

const Application = mongoose.model('Application', applicationSchema);
module.exports = Application;