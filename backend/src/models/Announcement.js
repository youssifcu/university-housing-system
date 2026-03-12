const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Announcement title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Announcement content is required'],
    trim: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  targetRole: {
    type: String,
    // Using the roles we defined in the User model
    enum: ['all', 'user', 'student', 'restaurant_supervisor', 'floor_supervisor', 'computer_supervisor', 'admin'],
    default: 'all'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Handles createdAt automatically
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;