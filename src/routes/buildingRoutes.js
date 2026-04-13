const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// عرض جميع المباني (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    buildingController.getAllBuildings
);

// عرض تفاصيل مبنى محدد مع الإحصائيات
router.get(
    '/:id',
    verifyToken,
    buildingController.getBuildingById
);

// ==========================================
// مسارات الإدارة (Admin Only)
// ==========================================
// إنشاء مبنى جديد
router.post(
    '/',
    verifyToken,
    isAdmin,
    buildingController.createBuilding
);

// تحديث بيانات مبنى
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    buildingController.updateBuilding
);

// حذف مبنى (أدمن فقط)
router.delete(
    '/:id',
    verifyToken,
    isAdmin, // أو حسب الميدل وير بتاعك
    buildingController.deleteBuilding // التأكد إن الاسم ده هو اللي في الكنترولر
);

// حذف مبنى (اختياري - إن أردت إضافته للكنترولر)
// router.delete('/:id', verifyToken, isAdmin, buildingController.deleteBuilding);

module.exports = router;