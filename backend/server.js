const app = require('./src/app'); // Import the app logic
const connectDB = require('./src/config/db');
require('dotenv').config(); // Important for your MongoDB URI

// Validate required environment variables
const requiredEnvVars = ['FIREBASE_PROJECT_ID'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar] && envVar !== 'FIREBASE_PROJECT_ID');

if (missingEnvVars.length > 0) {
  console.warn(`Warning: Some optional environment variables are not set: ${missingEnvVars.join(', ')}`);
}

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server is barking on port ${PORT}`);
});

// Socket.io setup with secure CORS
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io available in app
app.set('io', io);

module.exports = { server, io };