const mongoose = require('mongoose');

const mealBookingSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Booking must be linked to a student']
  },
  mealId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meal',
    required: [true, 'Booking must reference a specific meal']
  },
  date: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['booked', 'cancelled'],
    default: 'booked'
  },
  isServed: {
    type: Boolean,
    default: false // Set to true once the QR code is scanned at the restaurant
  },
  servedAt: {
    type: Date
  },
  servedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Reference to the restaurant_supervisor
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Index to prevent a student from booking the same meal twice
mealBookingSchema.index({ studentId: 1, mealId: 1 }, { unique: true });

const MealBooking = mongoose.model('MealBooking', mealBookingSchema);

module.exports = MealBooking;