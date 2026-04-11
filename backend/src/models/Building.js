const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Building name is required (e.g., Block A)'],
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please specify if this building is for male or female students']
  },
  floors: {
    type: Number,
    required: [true, 'Total number of floors is required'],
    min: [1, 'A building must have at least one floor']
  },
  description: {
    type: String,
    trim: true
  },
  // ربط المشرف بجدول المستخدمين مباشرة عشان يظهر في موبايل الطالب
  supervisorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'maintenance', 'inactive'],
    default: 'active'
  }
}, {
  timestamps: true // لزوم الـ Sprint 2 (تاريخ الإضافة)
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;