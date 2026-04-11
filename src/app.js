const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express'); 
const swaggerSpec = require('./config/swagger'); 
const path = require('path');

// استدعاء المسارات
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
const mainRoutes = require('./routes/mainRoutes'); 

const app = express();

// ==========================================
// 1. Middleware أساسي (بدون تثبيت جديد)
// ==========================================

// أمان: نخفي إننا شغالين بـ Express
app.disable('x-powered-by');

// أمان: نضيف Headers مفيدة يدويًا
app.use((req, res, next) => {
    // منع الـ Clickjacking
    res.setHeader('X-Frame-Options', 'DENY');
    // تفعيل حماية XSS في المتصفحات الحديثة
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

// CORS محسن: بيدعم Array of Origins
const allowedOrigins = process.env.CORS_ORIGIN 
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) 
    : ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5173'];

app.use(cors({
    origin: function (origin, callback) {
        // نسمح للـ Mobile Apps أو Server-to-Server بدون Origin
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true,
    optionsSuccessStatus: 200
}));

// Body Parsers
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Logger محلي (بديل بسيط لـ Morgan)
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        const log = `${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms`;
        if (res.statusCode >= 400) {
            console.error(`❌ ${log}`);
        } else {
            console.log(`✅ ${log}`);
        }
    });
    next();
});

// ==========================================
// 2. ملفات ثابتة مع كاش
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '1d', // تحميل من الكاش لمدة يوم
    setHeaders: (res, filePath) => {
        // منع كاش ملفات الـ HTML لو كانت موجودة
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ==========================================
// 3. Swagger Documentation
// ==========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }'
}));

// ==========================================
// 4. الصفحة الرئيسية
// ==========================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'University Housing API is running...',
        docs: '/api-docs',
        timestamp: new Date().toISOString()
    });
});

// ==========================================
// 5. تسجيل المسارات (نفس القديم لكن بشكل أنظف)
// ==========================================
const routesMap = [
    { path: '/api/auth', router: authRoutes },
    { path: '/api/users', router: userRoutes },
    { path: '/api/applications', router: applicationRoutes },
    { path: '/api/buildings', router: buildingRoutes },
    { path: '/api/rooms', router: roomRoutes },
    { path: '/api/housing-requests', router: housingRequestRoutes },
    { path: '/api/meals', router: mealRoutes },
    { path: '/api/attendance', router: attendanceRoutes },
    { path: '/api/reports', router: reportRoutes },
    { path: '/api/students', router: studentRoutes },
    { path: '/api/payments', router: paymentRoutes },
    { path: '/api/stats', router: statsRoutes },
    { path: '/api/announcements', router: announcementRoutes },
    { path: '/api/notifications', router: notificationRoutes },
    { path: '/api/v2', router: mainRoutes }
];

routesMap.forEach(route => {
    app.use(route.path, route.router);
});

// ==========================================
// 6. معالج 404 للمسارات الغير موجودة
// ==========================================
app.use((req, res, next) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// ==========================================
// 7. Global Error Handler (مع تفاصيل آمنة)
// ==========================================
app.use((err, req, res, next) => {
    // تسجيل الخطأ كامل في الكونسول بس
    console.error('💥 ERROR:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    // لو الخطأ بسبب CORS (نتيجة الـ callback فوق)
    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS Error: Origin not allowed'
        });
    }

    // لو الخطأ من Mongoose (Validation Error)
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    // لو JWT Error
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info .title { font-size: 2.2em; color: #0a4b6e; }
        .swagger-ui .scheme-container { background: #f8f9fa; }
        .swagger-ui .opblock-tag { font-size: 1.3em; }
        body { background: #f4f7f9; }
    `,
    customSiteTitle: 'Housing API Docs',
    customfavIcon: 'https://img.icons8.com/color/48/university.png'
}));
    // خطأ عام
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // بنبعت تفاصيل أكتر في الـ Development بس
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;