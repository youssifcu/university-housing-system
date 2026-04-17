const mongoose = require('mongoose');

const AttendanceSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buildingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Building' },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  attendanceType: {
    type: String,
    enum: ['morning', 'evening', 'meal', 'general'],
    default: 'general'
  },

  scannedQRCode: { type: String },
  status: { type: String, enum: ['present', 'absent', 'excused', 'late'], default: 'present' },

  date: { type: Date, required: true },
  timestamp: { type: Date, default: Date.now },

  notes: { type: String },
  wasOnLeave: { type: Boolean, default: false }
});

AttendanceSchema.index({ studentId: 1, date: 1 });
AttendanceSchema.index({ date: 1, attendanceType: 1 });

module.exports = mongoose.model('Attendance', AttendanceSchema);