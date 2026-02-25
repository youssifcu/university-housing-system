const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // This comes from Firebase
  firebaseUID: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  
  // Basic info
  name: { type: String, required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  
  // University specifics (Great for Cairo University projects)
  universityID: { type: String }, 
  phoneNumber: { type: String },
  
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', UserSchema);
