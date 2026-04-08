const mongoose = require('mongoose');

const studentRequestSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requestType: {
    type: String,
    enum: ['room_change', 'complaint', 'leave_request', 'meal_exception', 'maintenance'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['submitted', 'in_review', 'approved', 'rejected', 'needs_revision'],
    default: 'submitted'
  },
  statusReason: {
    type: String,
    default: ''
  },
  requestedAdminRole: {
    type: String,
    enum: ['supervisor', 'it', 'meal_admin', 'floor_admin'],
    required: true
  },
  assignedToUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  messages: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    userRole: String,
    message: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('StudentRequest', studentRequestSchema);