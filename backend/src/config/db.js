const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGO_URI ||
      process.env.MONGODB_URI ||
      process.env.MONGODB_TEST_URI ||
      'mongodb://localhost:27017/university-housing-system';
    
    await mongoose.connect(mongoUri);
    const safeMongoUri = mongoUri.replace(/\/\/([^@]+)@/, '//***:***@');
    console.log(' MongoDB Connected Successfully!');
    console.log('--- MongoDB Connection Details ---');
    console.log(`Connected to: ${safeMongoUri}`);
    console.log('---------------------------------');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;