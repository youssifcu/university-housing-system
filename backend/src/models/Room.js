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
    type: String, 
    required: [true, 'Room number/label is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Maximum occupancy is required'],
    min: [1, 'Capacity cannot be less than 1']
  },
  currentOccupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true
});

roomSchema.index({ buildingId: 1, roomNumber: 1 }, { unique: true });

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;