const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// الحصول على الإعلانات المتاحة للمستخدم الحالي
router.get(
    '/',
    verifyToken,
    announcementController.getAllAnnouncements
);

// الحصول على تفاصيل إعلان محدد (مع التحقق من الصلاحية داخل الكنترولر)
router.get(
    '/:id',
    verifyToken,
    announcementController.getAnnouncementById
);

// ==========================================
// مسارات خاصة بالمشرفين والأدمن
// ==========================================
// إنشاء إعلان جديد
router.post(
    '/',
    verifyToken,
    isAdminOrSupervisor, // يسمح للأدمن والمشرفين
    announcementController.createAnnouncement
);

// تحديث إعلان بالكامل
router.put(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    announcementController.updateAnnouncement
);

// تحديث حالة الإعلان فقط
router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    announcementController.updateAnnouncementStatus
);

// حذف إعلان
router.delete(
    '/:id',
    verifyToken,
    isAdmin, // الأدمن فقط
    announcementController.deleteAnnouncement
);

module.exports = router;