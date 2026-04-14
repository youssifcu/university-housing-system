const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// تقديم بلاغ جديد
router.post(
    '/',
    verifyToken,
    isStudent,
    reportController.createReport
);

// عرض بلاغاتي
router.get(
    '/me',
    verifyToken,
    isStudent,
    reportController.getMyReports
);

// عرض تفاصيل بلاغ (للطالب - بشروط الملكية داخل الكنترولر)
router.get(
    '/:id',
    verifyToken,
    isStudent,
    reportController.getReportById
);

// تحديث بلاغ (للطالب)
router.put(
    '/:id',
    verifyToken,
    isStudent,
    reportController.updateMyReport
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// عرض جميع البلاغات (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    reportController.getAllReports
);

// تحديث حالة بلاغ
router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    reportController.updateReportStatus
);

// حذف بلاغ (اختياري - إن أردت إضافته للكنترولر)
router.delete(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    reportController.deleteReport
);

module.exports = router;