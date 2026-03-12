const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Notification body is required'],
    trim: true
  },
  // If targetUser is null, it might be a role-based broadcast
  targetUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetRole: {
    type: String,
    enum: ['all', 'user', 'student', 'restaurant_supervisor', 'floor_supervisor', 'computer_supervisor', 'admin'],
    default: 'all'
  },
  type: {
    type: String,
    enum: ['announcement', 'application', 'meal', 'system'],
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true // Handles createdAt (Creation timestamp)
});

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;