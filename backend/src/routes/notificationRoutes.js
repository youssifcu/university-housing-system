const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// ==========================================
router.get(
    '/',
    verifyToken,
    notificationController.getMyNotifications
);

router.get(
    '/unread-count',
    verifyToken,
    notificationController.getUnreadCount
);

router.patch(
    '/:id/read',
    verifyToken,
    notificationController.markAsRead
);

router.patch(
    '/read-all',
    verifyToken,
    notificationController.markAllAsRead
);

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.post(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    notificationController.createNotification
);

module.exports = router;