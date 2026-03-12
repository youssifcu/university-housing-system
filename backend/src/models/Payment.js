const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Payment must be linked to a student']
  },
  amount: {
    type: Number,
    required: [true, 'Payment amount is required'],
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    enum: ['housing', 'meal'],
    required: [true, 'Please specify the payment type']
  },
  paymentDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true // Useful for tracking when the record was created vs when paymentDate occurred
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;