const mongoose = require('mongoose');

const housingRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Request must be linked to a student record']
  },
  type: {
    type: String,
    enum: ['transfer', 'vacate'],
    required: [true, 'Please specify if this is a room transfer or vacating request']
  },
  // These are specific to 'transfer' types
  fromRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  toRoomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  },
  reason: {
    type: String,
    required: [true, 'A reason for the request is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Links to the Admin/Supervisor who handled the request
  }
}, {
  timestamps: true // Automatically handles createdAt (Submission timestamp)
});

const HousingRequest = mongoose.model('HousingRequest', housingRequestSchema);

module.exports = HousingRequest;