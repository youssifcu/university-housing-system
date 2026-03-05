const app = require('./src/app'); // Import the app logic
const connectDB = require('./src/config/db');
require('dotenv').config(); // Important for your MongoDB URI

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is barking on port ${PORT}`);
});