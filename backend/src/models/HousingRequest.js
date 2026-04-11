const mongoose = require('mongoose');

const housingRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // الربط الموحد بجدول المستخدمين
    required: [true, 'Request must be linked to a student record']
  },
  type: {
    type: String,
    enum: ['transfer', 'vacate', 'maintenance'], // ضفت لك صيانة لو احتاجتها
    required: true
  },
  fromRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  toRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' },
  
  reason: { type: String, required: true, trim: true },
  
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  comments: { type: String } // ملاحظات المشرف عند القبول أو الرفض
}, {
  timestamps: true 
});

const HousingRequest = mongoose.model('HousingRequest', housingRequestSchema);
module.exports = HousingRequest;