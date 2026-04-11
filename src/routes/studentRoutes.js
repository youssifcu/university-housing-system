const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// عرض بروفايلي
router.get(
    '/me',
    verifyToken,
    isStudent,
    studentController.getMyProfile
);

// عرض QR Codes الخاصة بي
router.get(
    '/me/qr',
    verifyToken,
    isStudent,
    studentController.getMyQRCode
);

// توليد QR Codes جديدة
router.post(
    '/me/generate-qr',
    verifyToken,
    isStudent,
    studentController.generateMyQRCode
);

// طلب إجازة
router.post(
    '/me/leave',
    verifyToken,
    isStudent,
    studentController.requestLeave
);

// عرض سجل حضوري
router.get(
    '/me/attendance',
    verifyToken,
    isStudent,
    studentController.getAttendanceReport
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// التحقق من صحة QR Code
router.post(
    '/validate-qr',
    verifyToken,
    isAdminOrSupervisor,
    studentController.validateQRCode
);

// عرض جميع الطلاب (مع Pagination)
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAllStudents
);

// عرض تفاصيل طالب محدد
router.get(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getStudentById
);

// تحديث بيانات طالب
router.patch(
    '/:id',
    verifyToken,
    isAdmin,
    studentController.updateStudent
);

// الموافقة على طلب إجازة
router.patch(
    '/leave/:requestId/approve',
    verifyToken,
    isAdminOrSupervisor,
    studentController.approveLeave
);

// إنهاء إجازة طالب
router.patch(
    '/:studentId/end-leave',
    verifyToken,
    isAdminOrSupervisor,
    studentController.endLeave
);

// عرض تقرير حضور طالب محدد
router.get(
    '/:studentId/attendance',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAttendanceReport
);

module.exports = router;