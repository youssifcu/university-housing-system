const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController'); // دوال الإجازة هنا
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// تقديم طلب إجازة
router.post(
    '/request',
    verifyToken,
    isStudent,
    studentController.requestLeave
);

// عرض تقرير الحضور الخاص بالطالب
router.get(
    '/attendance',
    verifyToken,
    isStudent,
    studentController.getAttendanceReport
);

// ==========================================
// مسارات المشرفين والأدمن
// ==========================================
// الموافقة على طلب إجازة
router.patch(
    '/approve/:requestId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.approveLeave
);

// إنهاء الإجازة يدوياً (للطالب المحدد)
router.patch(
    '/end/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.endLeave
);

// عرض تقرير حضور طالب محدد
router.get(
    '/attendance/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAttendanceReport
);

module.exports = router;