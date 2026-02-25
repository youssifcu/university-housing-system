const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    
    await mongoose.connect('mongodb://localhost:27017/university-housing-system');
    console.log(' MongoDB Connected to Compass Successfully!');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;