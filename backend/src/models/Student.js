const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  // Relational Links
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // A user can only be one "student" record
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Application',
    required: true,
    unique: true // One approved application per student record
  },

  // Academic & Identification (Copied/Linked from Application)
  nationalId: {
    type: String,
    required: true
  },
  universityId: {
    type: String,
    required: true
  },
  faculty: {
    type: String,
    required: true
  },
  academicYear: {
    type: String,
    required: true
  },

  // Housing Operations
  housingStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room' // This will link to your Building/Room management logic
  },
  bedNumber: {
    type: Number
  },
  qrCode: {
    type: String, // String representation of the QR for validation
    unique: true,
    sparse: true // Allows this to be null until the QR is generated
  }
}, {
  timestamps: true // Handles 'createdAt' automatically
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;