const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['maintenance', 'complaint', 'malfunction'],
    required: [true, 'Please specify the type of report']
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Report must be linked to a student']
  },
  // In case a supervisor files a report on behalf of a student
  reportedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description of the issue'],
    trim: true
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'low'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  }
}, {
  timestamps: true // Handles createdAt automatically
});

const Report = mongoose.model('Report', reportSchema);

module.exports = Report;