const mongoose = require('mongoose');

const housingSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { type: String, enum: ['single', 'double', 'triple'], default: 'single' },
  price: { type: Number, required: true },
  description: { type: String },
  isAvailable: { type: Boolean, default: true },
  images: [{ type: String }] // URLs for room photos
}, { timestamps: true });

module.exports = mongoose.model('Housing', housingSchema);