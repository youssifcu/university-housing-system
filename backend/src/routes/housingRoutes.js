const express = require('express');
const router = express.Router();
const housingController = require('../controllers/housingController'); // أو housingController حسب تسميتك
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// عرض جميع الغرف (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    roomController.getAllRooms
);

// عرض الغرف المتاحة فقط (للطلاب)
router.get(
    '/available',
    verifyToken,
    roomController.getAvailableRooms
);

// عرض غرفتي (للطالب المسجل)
router.get(
    '/my',
    verifyToken,
    roomController.getMyRoom
);

// عرض تفاصيل غرفة محددة
router.get(
    '/:id',
    verifyToken,
    roomController.getRoomById // تأكد من وجود هذه الدالة في الكنترولر
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// إنشاء غرفة جديدة
router.post(
    '/',
    verifyToken,
    isAdmin,
    roomController.createRoom
);

// تسكين طالب في غرفة
router.post(
    '/:id/assign',
    verifyToken,
    isAdminOrSupervisor,
    roomController.assignStudent
);

// إزالة طالب من غرفة (إخلاء)
router.post(
    '/:id/remove',
    verifyToken,
    isAdminOrSupervisor,
    roomController.removeStudent
);

// تحديث بيانات غرفة
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    roomController.updateRoom
);

// حذف غرفة (اختياري)
router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    roomController.deleteRoom
);

module.exports = router;