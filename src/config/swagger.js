const swaggerJsdoc = require('swagger-jsdoc');

// ==========================================
// Helper: ضبط صيغة URL السيرفر
// ==========================================
const trimTrailingSlash = (url) => (url ? String(url).replace(/\/$/, '') : null);

const ensureAbsoluteServerUrl = (url) => {
    if (!url) return null;
    const u = String(url).trim();
    if (u === '/') return '/';
    const noTrail = trimTrailingSlash(u) || u;
    if (/^https?:\/\//i.test(noTrail)) return noTrail;
    if (noTrail.startsWith('/')) return noTrail;
    return `https://${noTrail}`;
};

// تحديد سيرفر Swagger (يدعم local و Railway)
const serverUrlRaw =
    trimTrailingSlash(process.env.SWAGGER_SERVER_URL) ||
    trimTrailingSlash(process.env.PUBLIC_API_URL) ||
    trimTrailingSlash(process.env.RAILWAY_STATIC_URL) ||
    (process.env.RAILWAY_PUBLIC_DOMAIN ? `https://${trimTrailingSlash(process.env.RAILWAY_PUBLIC_DOMAIN)}` : null);

const serverUrl = serverUrlRaw ? ensureAbsoluteServerUrl(serverUrlRaw) : null;

const servers = serverUrl
    ? [{ url: serverUrl, description: process.env.NODE_ENV === 'production' ? 'Production Server' : 'Staging Server' }]
    : [
          { url: 'http://localhost:5000', description: 'Local Development' },
          { url: '/', description: 'Same as Swagger UI' }
      ];

// ==========================================
// إعدادات Swagger الأساسية
// ==========================================
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: '🏢 University Housing System API',
            version: '2.0.0',
            description: `
                **نظام إدارة السكن الجامعي - جامعة القاهرة**
                
                ## المميزات الرئيسية:
                - تسجيل الطلاب وإدارة طلبات الالتحاق.
                - التسكين التلقائي واليدوي في الغرف.
                - نظام حضور وانصراف عبر QR Code.
                - حجز الوجبات وصرفها عبر QR Code.
                - تقديم طلبات (صيانة، شكاوى، إجازات، نقل غرف).
                - إشعارات فورية عبر Socket.io.
                - لوحة تحكم وإحصائيات شاملة.
                
                ## 🔐 المصادقة:
                معظم المسارات تتطلب **Bearer Token** (Firebase ID Token).
                قم بإضافته في الـ Header: \`Authorization: Bearer <token>\`
            `,
            contact: {
                name: 'Cairo University IT Team',
                email: 'housing@eng.cu.edu.eg'
            },
            license: {
                name: 'ISC',
                url: 'https://opensource.org/licenses/ISC'
            }
        },
        servers,
        tags: [
            { name: 'Auth', description: 'تسجيل الدخول وإدارة الحساب' },
            { name: 'Applications', description: 'طلبات الالتحاق بالسكن' },
            { name: 'Buildings', description: 'المباني السكنية' },
            { name: 'Rooms', description: 'الغرف والتسكين' },
            { name: 'Students', description: 'الملف الشخصي للطالب وQR' },
            { name: 'Housing Requests', description: 'طلبات النقل والإجازات والإخلاء' },
            { name: 'Meals', description: 'الوجبات والحجز' },
            { name: 'Attendance', description: 'تسجيل الحضور' },
            { name: 'Reports', description: 'البلاغات والشكاوى' },
            { name: 'Payments', description: 'المدفوعات' },
            { name: 'Stats', description: 'الإحصائيات ولوحة التحكم' },
            { name: 'Announcements', description: 'الإعلانات' },
            { name: 'Notifications', description: 'الإشعارات' },
            { name: 'QR Codes', description: 'توليد ومسح QR Codes' },
            { name: 'V2 / Main', description: 'الواجهة الموحدة (طلبات، QR، حضور)' }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'أدخل Firebase ID Token'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: [
        './src/routes/*.js',      // سيقوم بقراءة التعليقات من الراوترات (إن وجدت)
        './src/models/*.js'       // لاستخراج schemas
    ]
};

const swaggerSpec = swaggerJsdoc(options);

// ==========================================
// إضافة مسارات يدوية (للتوافق مع ملفك الحالي)
// ==========================================
// ندمج المسارات التي كنت تعرفها يدوياً داخل الـ spec
// حتى لا تفقد أي تعريفات قمت بها مسبقاً
const manualPaths = {
    // Applications
    '/api/applications': {
        get: { summary: 'Get all applications (Admin)', tags: ['Applications'], security: [{ bearerAuth: [] }] },
        post: { summary: 'Submit application', tags: ['Applications'], security: [{ bearerAuth: [] }] }
    },
    '/api/applications/my': {
        get: { summary: 'Get my applications', tags: ['Applications'], security: [{ bearerAuth: [] }] }
    },
    '/api/applications/{id}': {
        get: { summary: 'Get application by ID', tags: ['Applications'], security: [{ bearerAuth: [] }] },
        patch: { summary: 'Update application', tags: ['Applications'], security: [{ bearerAuth: [] }] },
        delete: { summary: 'Delete application', tags: ['Applications'], security: [{ bearerAuth: [] }] }
    },
    '/api/applications/{id}/approve': {
        patch: { summary: 'Approve application (Admin)', tags: ['Applications'], security: [{ bearerAuth: [] }] }
    },
    '/api/applications/{id}/reject': {
        patch: { summary: 'Reject application (Admin)', tags: ['Applications'], security: [{ bearerAuth: [] }] }
    },
    // Buildings
    '/api/buildings': {
        get: { summary: 'Get all buildings', tags: ['Buildings'] },
        post: { summary: 'Create building (Admin)', tags: ['Buildings'], security: [{ bearerAuth: [] }] }
    },
    '/api/buildings/{id}': {
        get: { summary: 'Get building by ID', tags: ['Buildings'] },
        put: { summary: 'Update building (Admin)', tags: ['Buildings'], security: [{ bearerAuth: [] }] }
    },
    // Rooms
    '/api/rooms': {
        get: { summary: 'Get all rooms', tags: ['Rooms'], security: [{ bearerAuth: [] }] },
        post: { summary: 'Create room (Admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/available': {
        get: { summary: 'Get available rooms', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/building/{buildingId}': {
        get: { summary: 'Get rooms by building', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/{id}': {
        get: { summary: 'Get room by ID', tags: ['Rooms'], security: [{ bearerAuth: [] }] },
        put: { summary: 'Update room (Admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/{id}/status': {
        patch: { summary: 'Update room status (Admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/{id}/assign': {
        patch: { summary: 'Assign student to room (Admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    '/api/rooms/{id}/remove-student': {
        patch: { summary: 'Remove student from room (Admin)', tags: ['Rooms'], security: [{ bearerAuth: [] }] }
    },
    // Students
    '/api/students': {
        get: { summary: 'Get all students (Admin)', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    '/api/students/me': {
        get: { summary: 'Get my profile', tags: ['Students'], security: [{ bearerAuth: [] }] },
        patch: { summary: 'Update my profile', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    '/api/students/me/qr': {
        get: { summary: 'Get my QR code', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    '/api/students/me/generate-qr': {
        post: { summary: 'Generate my QR code', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    '/api/students/validate-qr': {
        post: { summary: 'Validate QR code', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    '/api/students/{id}': {
        get: { summary: 'Get student by ID (Admin)', tags: ['Students'], security: [{ bearerAuth: [] }] }
    },
    // Housing Requests
    '/api/housing-requests': {
        get: { summary: 'Get all housing requests (Admin)', tags: ['Housing Requests'], security: [{ bearerAuth: [] }] },
        post: { summary: 'Submit housing request', tags: ['Housing Requests'], security: [{ bearerAuth: [] }] }
    },
    '/api/housing-requests/{id}': {
        get: { summary: 'Get housing request by ID', tags: ['Housing Requests'], security: [{ bearerAuth: [] }] }
    },
    '/api/housing-requests/{id}/status': {
        patch: { summary: 'Update request status (Admin)', tags: ['Housing Requests'], security: [{ bearerAuth: [] }] }
    },
    // Auth
    '/api/auth/login': { post: { summary: 'Login', tags: ['Auth'] } },
    '/api/auth/register': { post: { summary: 'Register', tags: ['Auth'] } },
    '/api/auth/profile': { get: { summary: 'Get profile', tags: ['Auth'], security: [{ bearerAuth: [] }] } },
    '/api/auth/password': { patch: { summary: 'Change password', tags: ['Auth'], security: [{ bearerAuth: [] }] } },
    // Users
    '/api/users/{id}': {
        delete: { summary: 'Delete user (Admin)', tags: ['User'], security: [{ bearerAuth: [] }] }
    },
    // V2 Requests
    '/api/v2/requests': {
        get: { summary: 'Get all requests (Admin)', tags: ['V2 / Main'], security: [{ bearerAuth: [] }] },
        post: { summary: 'Submit request (Student)', tags: ['V2 / Main'], security: [{ bearerAuth: [] }] }
    }
};

// دمج المسارات اليدوية مع الـ spec الموجود
Object.keys(manualPaths).forEach(path => {
    if (!swaggerSpec.paths[path]) swaggerSpec.paths[path] = {};
    Object.assign(swaggerSpec.paths[path], manualPaths[path]);
});

module.exports = swaggerSpec;