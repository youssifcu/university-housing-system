const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  housing: { type: mongoose.Schema.Types.ObjectId, ref: 'Housing', required: true },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  requestDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);