const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express'); 
const swaggerSpec = require('./config/swagger'); 

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const buildingRoutes = require('./routes/buildingRoutes');
const roomRoutes = require('./routes/roomRoutes'); 
const housingRequestRoutes = require('./routes/housingRequestRoutes'); 
const mealRoutes = require('./routes/mealRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const studentRoutes = require('./routes/studentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const statsRoutes = require('./routes/statsRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

// استدعاء المسارات الجديدة اللي عملناها
const mainRoutes = require('./routes/mainRoutes'); 

const app = express();

app.use(cors());
<<<<<<< HEAD

=======
>>>>>>> a0ec18d75d0d0cc6eec586a2e9aec51ed9757a53
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
  console.log(`${req.method} request to ${req.url}`);
  next();
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/', (req, res) => {
  res.send('University Housing Server is Running...');
});

// تسجيل المسارات
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/housing-requests', housingRequestRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

// إضافة المسار الموحد اللي بيجمع الـ QR والطلبات والإجازات
app.use('/api/v2', mainRoutes); 

app.use('/uploads', express.static('uploads'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong on the server!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

module.exports = app;