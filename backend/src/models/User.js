const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  firebaseUID: {
    type: String,
    required: [true, 'Firebase UID is required for linking'],
    unique: true
  },
  phone: {
    type: String,
    trim: true
  },
  roles: {
    type: String,
    enum: [
      'user', 
      'student', 
      'restaurant_supervisor', 
      'floor_supervisor', 
      'computer_supervisor', 
      'admin'
    ],
    default: 'user'
  },
  profilePicture: {
    type: String,
    default: '' // URL to profile image
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'], // Standard account statuses
    default: 'active'
  }
}, {
  timestamps: true // This automatically handles the 'createdAt' field
});

const User = mongoose.model('User', userSchema);

module.exports = User;