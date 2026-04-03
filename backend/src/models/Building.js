const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Building name is required (e.g., Block A)'],
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please specify if this building is for male or female students']
  },
  floors: {
    type: Number,
    required: [true, 'Total number of floors is required'],
    min: [1, 'A building must have at least one floor']
  },
  description: {
    type: String,
    trim: true
  },
  supervisorName: {
    type: String,
    trim: true
  },
  supervisorPhone: {
    type: String,
    trim: true
  }
});

const Building = mongoose.model('Building', buildingSchema);

module.exports = Building;