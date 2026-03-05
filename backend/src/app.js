const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const housingRoutes = require('./routes/housingRoutes'); // Import housing management routes
const userRoutes = require('./routes/userRoutes');

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Request Logger: Useful for debugging API calls on your terminal
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('University Housing Server is Running...');
});

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/housing', housingRoutes); // Housing endpoint fixed at /api/housing
app.use('/api/users', userRoutes);

module.exports = app; // Export app for server.js to listen