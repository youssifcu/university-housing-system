const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// عرض مدفوعاتي
router.get(
    '/my',
    verifyToken,
    isStudent,
    paymentController.getMyPayments
);

// إنشاء دفعة جديدة (للطالب)
router.post(
    '/',
    verifyToken,
    isStudent,
    paymentController.createPayment
);

// عرض تفاصيل دفعة محددة (للطالب - بشروط الملكية داخل الكنترولر)
router.get(
    '/:id',
    verifyToken,
    isStudent,
    paymentController.getPaymentById
);

// ==========================================
// مسارات الإدارة (Admin Only)
// ==========================================
// عرض جميع المدفوعات (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    isAdmin,
    paymentController.getAllPayments
);

// تحديث دفعة
router.put(
    '/:id',
    verifyToken,
    isAdmin,
    paymentController.updatePayment
);

// حذف دفعة
router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    paymentController.deletePayment
);

module.exports = router;