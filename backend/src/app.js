const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express'); 
const swaggerSpec = require('./config/swagger'); 

const authRoutes = require('./routes/authRoutes');
// const housingRoutes = require('./routes/housingRoutes'); // You can remove this if replaced by housing-requests
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const roomRoutes = require('./routes/roomRoutes'); // Added
const housingRequestRoutes = require('./routes/housingRequestRoutes'); // Added

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

// --- Swagger Documentation Route ---
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Root Health Check Route
app.get('/', (req, res) => {
  res.send('University Housing Server is Running...');
});

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes); // Added
app.use('/api/housing-requests', housingRequestRoutes); // Added
app.use('/uploads', express.static('uploads'));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;