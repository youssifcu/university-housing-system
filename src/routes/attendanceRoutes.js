const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// الطالب يشوف سجل حضوره
router.get(
    '/my',
    verifyToken,
    attendanceController.getMyAttendance
);

// ==========================================
// مسارات المشرفين والأدمن (تسجيل وإدارة الحضور)
// ==========================================
// مسح QR لتسجيل حضور
router.post(
    '/scan',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.scanAttendance
);

// عرض سجل حضور طالب محدد (للإدارة)
router.get(
    '/student/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.getStudentAttendance
);

// عرض حضور مبنى معين في تاريخ محدد
router.get(
    '/building/:buildingId',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.getAttendanceByBuilding
);

// تحديث سجل حضور (يدوي)
router.patch(
    '/:id',
    verifyToken,
    isAdmin,
    attendanceController.updateAttendance
);

// ==========================================
// مسارات إضافية (إن وجدت في الكنترولر)
// ==========================================
// إذا كان عندك دالة recordAttendance اليدوية
// router.post('/', verifyToken, isAdminOrSupervisor, attendanceController.recordAttendance);

module.exports = router;