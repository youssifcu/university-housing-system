const express = require('express');
const cors = require('cors');
const bookingRoutes = require('./routes/bookingRoutes'); // New Booking Routes
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger for debugging on your Legion
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// Root Route
app.get('/', (req, res) => {
  res.send('University Housing Server is Running...');
});

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes); // This makes '/api/bookings' implicit

module.exports = app; // Export app to be used in server.js