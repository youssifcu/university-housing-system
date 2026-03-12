const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: [true, 'A room must belong to a building']
  },
  floorNumber: {
    type: Number,
    required: [true, 'Floor number is required']
  },
  roomNumber: {
    type: String, // String allows for labels like "101A"
    required: [true, 'Room number/label is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Maximum occupancy is required'],
    min: [1, 'Capacity cannot be less than 1']
  },
  currentOccupancy: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Prevent duplicate room numbers within the same building
roomSchema.index({ buildingId: 1, roomNumber: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;