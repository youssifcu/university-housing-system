const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// route imports
const authRoutes = require('./routes/authRoutes');
const housingRoutes = require('./routes/housingRoutes');
const userRoutes = require('./routes/userRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

// create app and configure
const app = express();

connectDB();

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/housing', housingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);

// simple health-check endpoint
app.get('/', (req, res) => {
  res.send('University Housing Server is Running...');
});

module.exports = app;
