const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/university-housing-system';
    
    await mongoose.connect(mongoUri);
    console.log(' MongoDB Connected Successfully!');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;