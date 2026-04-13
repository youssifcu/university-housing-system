const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// 🚀 تعديل: خلي المسار الرئيسي هو اللي يجيب الإشعارات بدل /my
router.get(
    '/',
    verifyToken,
    notificationController.getMyNotifications
);

// عدد الإشعارات غير المقروءة
router.get(
    '/unread-count',
    verifyToken,
    notificationController.getUnreadCount
);

// تعليم إشعار كمقروء
router.patch(
    '/:id/read',
    verifyToken,
    notificationController.markAsRead
);

// تعليم الكل كمقروء
router.patch(
    '/read-all',
    verifyToken,
    notificationController.markAllAsRead
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// إنشاء إشعار جديد (للأدمن والمشرفين)
router.post(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    notificationController.createNotification
);

module.exports = router;