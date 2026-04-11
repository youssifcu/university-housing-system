const express = require('express');
const router = express.Router();
const housingRequestController = require('../controllers/housingRequestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// تقديم طلب جديد (نقل، إجازة، إخلاء، صيانة)
router.post(
    '/',
    verifyToken,
    housingRequestController.submitRequest
);

// عرض طلباتي (مع Pagination)
router.get(
    '/my',
    verifyToken,
    housingRequestController.getMyRequests
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// عرض جميع الطلبات (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    housingRequestController.getAllRequests
);

// عرض تفاصيل طلب محدد
router.get(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    housingRequestController.getRequestById
);

// تحديث حالة الطلب (موافقة/رفض) - مع تنفيذ الإجراءات تلقائياً
router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    housingRequestController.updateStatus
);

// تعليق على طلب (اختياري - لو موجود في الكنترولر)
// router.post('/:id/messages', verifyToken, isAdminOrSupervisor, housingRequestController.addRequestMessage);

module.exports = router;