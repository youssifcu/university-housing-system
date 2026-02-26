const mongoose = require('mongoose');

const HousingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  address: { type: String },
  price: { type: Number, default: 0 },
  images: [{ type: String }],
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Housing', HousingSchema);
