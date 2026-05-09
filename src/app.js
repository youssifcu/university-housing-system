const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const swaggerDocument = require('../swagger-complete.json');

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
const qrRoutes = require('./routes/qrRoutes');
const mainRoutes = require('./routes/mainRoutes');


const app = express();

// ==========================================
// 1. Middleware 
// ==========================================

app.disable('x-powered-by');

app.use((req, res, next) => {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
});

const baseOrigins = [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'https://university-housing-system-production-64e5.up.railway.app',
    'https://university-housing-system.vercel.app',
    'https://university-housing-system-2.vercel.app'
];

const envOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim())
    : [];

const allowedOrigins = [...new Set([...baseOrigins, ...envOrigins])];

// Handle OPTIONS preflight requests globally BEFORE any other middleware
app.options('/{*path}', (req, res) => {
    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
        res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,x-auth-token');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Max-Age', '86400'); // cache preflight for 24h
    res.sendStatus(204);
});

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`⚠️ CORS blocked origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token'],
    credentials: true,
    optionsSuccessStatus: 204,
    preflightContinue: false
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
// 2.  
// ==========================================
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'), {
    maxAge: '1d',
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));

// ==========================================
// 3. Swagger Documentation ()
// ==========================================
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
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

// ==========================================
// 4.  Main Page
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
// 5. Routes 
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
    { path: '/api/qr', router: qrRoutes },
    { path: '/api/v2', router: mainRoutes }
];

routesMap.forEach(route => {
    app.use(route.path, route.router);
});

// ==========================================
// 6. Error 404
// ==========================================
app.use('/{*path}', (req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// ==========================================
// 7. Global Error Handler 
// ==========================================
app.use((err, req, res, next) => {
    console.error('💥 ERROR:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    if (err.message && err.message.includes('CORS')) {
        return res.status(403).json({
            success: false,
            message: 'CORS Error: Origin not allowed'
        });
    }

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: 'Validation Error',
            errors: Object.values(err.errors).map(e => e.message)
        });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    const statusCode = err.status || 500;
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

module.exports = app;
