const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { 
    isAdmin, 
    isSupervisor, 
    isFloorAdmin, 
    isMealAdmin, 
    isStudent,
    isAdminOrSupervisor 
} = require('../middlewares/roleMiddleware');

// استدعاء الكنترولرات الموحدة
const studentRequestController = require('../controllers/studentRequestController');
const qrController = require('../controllers/qrController');
const studentController = require('../controllers/studentController'); // دوال الإجازة والحضور

// ==========================================
// مسارات طلبات الطلاب (Student Requests)
// ==========================================
// تقديم طلب (student only)
router.post(
    '/requests',
    verifyToken,
    isStudent,
    studentRequestController.submitRequest
);

// عرض طلباتي (student only)
router.get(
    '/requests/my',
    verifyToken,
    isStudent,
    studentRequestController.getMyRequests
);

// عرض الطلبات المخصصة لدور المشرف/الأدمن
router.get(
    '/requests',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.getRequestsForAdmin
);

// تفاصيل طلب محدد (مالك الطلب أو مشرف)
router.get(
    '/requests/:requestId',
    verifyToken,
    studentRequestController.getRequestDetails
);

// تعيين الطلب للمشرف الحالي
router.patch(
    '/requests/:requestId/assign',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.assignRequestToSelf
);

// إضافة رسالة للطلب (مالك أو مشرف)
router.post(
    '/requests/:requestId/messages',
    verifyToken,
    studentRequestController.addRequestMessage
);

// الرد على الطلب (موافقة/رفض/مراجعة)
router.patch(
    '/requests/:requestId/respond',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.respondToRequest
);

// ==========================================
// مسارات QR Codes
// ==========================================
// توليد QR Codes للطالب
router.post(
    '/qr/generate',
    verifyToken,
    isStudent,
    qrController.generateStudentQRCodes
);

// تجديد QR Codes (اختياري)
router.post(
    '/qr/refresh',
    verifyToken,
    isStudent,
    qrController.refreshStudentQRCodes
);

// عرض QR Codes الحالية
router.get(
    '/qr/my',
    verifyToken,
    isStudent,
    qrController.getStudentQRCodes
);

// ==========================================
// مسارات الحضور والإجازات (Attendance & Leave)
// ==========================================
// تسجيل حضور (مسح QR) - للمشرفين
router.post(
    '/attendance/scan',
    verifyToken,
    isFloorAdmin,
    studentController.scanAttendance
);

// تسجيل وجبة (مسح QR) - لمسؤولي الوجبات
router.post(
    '/meals/scan',
    verifyToken,
    isMealAdmin,
    studentController.scanMeal
);

// طلب إجازة (طالب)
router.post(
    '/leave/request',
    verifyToken,
    isStudent,
    studentController.requestLeave
);

// الموافقة على طلب إجازة (مشرف/أدمن)
router.patch(
    '/leave/:requestId/approve',
    verifyToken,
    isAdminOrSupervisor,
    studentController.approveLeave
);

// إنهاء الإجازة (مشرف/أدمن)
router.patch(
    '/leave/:studentId/end',
    verifyToken,
    isAdminOrSupervisor,
    studentController.endLeave
);

// تقرير حضور طالب (للمشرف أو الطالب نفسه)
router.get(
    '/attendance/report/:studentId?',
    verifyToken,
    studentController.getAttendanceReport
);

module.exports = router;