const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    console.log('Skipping MongoDB connection during test run');
    return;
  }

  try {
    const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/university-housing-system';
    // mongoose 6+ has its own defaults but we include options for backwards compatibility
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(' MongoDB Connected Successfully!');
  } catch (error) {
    console.error(' MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;