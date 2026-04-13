const express = require('express');
const router = express.Router();
const housingRequestController = require('../controllers/housingRequestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// 1. مسارات مشتركة (Shared / Student Specific)
// ==========================================

// تقديم طلب جديد
router.post(
    '/',
    verifyToken,
    housingRequestController.submitRequest
);

// عرض الطلبات 
// (الكنترولر الآن ذكي: الطالب بيشوف حاجته بس، والأدمن بيشوف الكل)
router.get(
    '/',
    verifyToken,
    housingRequestController.getAllRequests
);

// عرض تفاصيل طلب محدد (محمي داخل الكنترولر للأدمن أو صاحب الطلب)
router.get(
    '/:id',
    verifyToken,
    housingRequestController.getRequestById
);

// 🚀 المسار الجديد: تعديل الطالب لطلبه المعلق (Pending)
router.patch(
    '/:id',
    verifyToken,
    housingRequestController.updateMyRequest
);

// ==========================================
// 2. مسارات الإدارة (Admin/Supervisor Only)
// ==========================================

// تحديث حالة الطلب (موافقة/رفض) - مع دعم التسكين اليدوي overrideRoomId
router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    housingRequestController.updateStatus
);

module.exports = router;