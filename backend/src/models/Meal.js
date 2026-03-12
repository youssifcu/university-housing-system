const mongoose = require('mongoose');

const mealSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Meal name is required (e.g., Chicken Rice Bowl)'],
    trim: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: [true, 'Please specify the meal category']
  },
  price: {
    type: Number,
    required: [true, 'Meal price is required'],
    min: [0, 'Price cannot be negative']
  },
  date: {
    type: Date,
    required: [true, 'Date the meal is served is required']
  }
}, {
  timestamps: true
});

// Optional: Ensure only one meal of a specific type exists per day
// mealSchema.index({ date: 1, mealType: 1 }, { unique: true });

const Meal = mongoose.model('Meal', mealSchema);

module.exports = Meal;