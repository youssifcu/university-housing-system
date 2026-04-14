const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// عرض الصورة الشخصية للمستخدم
router.get(
    '/:id/profile-picture',
    userController.getProfilePicture
);

// عرض بروفايل مستخدم محدد (للإدارة) أو النفس
router.get(
    '/:id',
    verifyToken,
    userController.getUserById
);

// ==========================================
// مسارات الإدارة (Admin Only)
// ==========================================
// عرض جميع المستخدمين (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    isAdmin,
    userController.getAllUsers
);

// تحديث مستخدم
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    userController.updateUser
);

// حذف مستخدم (من DB و Firebase)
router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    userController.deleteUser
);

module.exports = router;