const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// عرض غرفتي
router.get(
    '/my',
    verifyToken,
    isStudent,
    roomController.getMyRoom
);

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// عرض جميع الغرف (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    roomController.getAllRooms
);

// عرض الغرف المتاحة فقط
router.get(
    '/available',
    verifyToken,
    roomController.getAvailableRooms
);

// عرض غرف مبنى محدد
router.get(
    '/building/:buildingId',
    verifyToken,
    roomController.getRoomsByBuilding
);

// عرض تفاصيل غرفة محددة
router.get(
    '/:id',
    verifyToken,
    roomController.getRoomById
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

// تحديث بيانات غرفة
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    roomController.updateRoom
);

// تحديث حالة الغرفة (متاحة، صيانة، ممتلئة)
router.patch(
    '/:id/status',
    verifyToken,
    isAdmin,
    roomController.updateRoomStatus
);

// تسكين طالب يدوياً في غرفة محددة
router.patch(
    '/:id/assign',
    verifyToken,
    isAdminOrSupervisor,
    roomController.assignStudent
);

// إزالة طالب من غرفة
router.patch(
    '/:id/remove',
    verifyToken,
    isAdminOrSupervisor,
    roomController.removeStudent
);

// تسكين تلقائي (يبحث عن غرفة متاحة للطالب)
router.post(
    '/auto-assign/:studentId',
    verifyToken,
    isAdmin,
    roomController.autoAssignRoom
);

module.exports = router;