const mongoose = require('mongoose');

/**
 * Housing Schema - Represents a room in the university dormitory
 */
const housingSchema = new mongoose.Schema({
  roomNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  capacity: { 
    type: Number, 
    required: true 
  }, // Maximum number of students allowed in the room
  occupiedSeats: { 
    type: Number, 
    default: 0 
  }, // Current number of students registered in this room
  // Array of User ObjectIDs referencing the students living here
  residents: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  }], 
  price: { 
    type: Number, 
    required: true 
  },
  isAvailable: { 
    type: Boolean, 
    default: true 
  }, // Manually or automatically toggled based on capacity
}, { timestamps: true }); // Automatically adds createdAt and updatedAt fields

module.exports = mongoose.model('Housing', housingSchema);