const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');
const upload = require('../config/multer');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// تقديم طلب جديد
router.post(
    '/',
    verifyToken,
    upload.fields([
        { name: 'nationalIdCard', maxCount: 1 },
        { name: 'personalPhoto', maxCount: 1 },
        { name: 'medicalReport', maxCount: 1 },
        { name: 'universityIdCard', maxCount: 1 }
    ]),
    applicationController.submitApplication
);

// عرض طلباتي
router.get(
    '/my',
    verifyToken,
    applicationController.getMyApplication // تم التغيير إلى getMyApplication كما في الكنترولر المحسن
);

// عرض طلب محدد (بصلاحيات مالك الطلب أو الأدمن)
router.get(
    '/:id',
    verifyToken,
    applicationController.getApplicationById
);

// حذف طلب (للطالب قبل المراجعة)
router.delete(
    '/:id',
    verifyToken,
    applicationController.deleteApplication
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// عرض كل الطلبات (مع Pagination)
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    applicationController.getAllApplications
);

// الموافقة على طلب (مع التسكين التلقائي)
router.patch(
    '/:id/approve',
    verifyToken,
    isAdmin,
    applicationController.approveApplication
);

// رفض الطلب
router.patch(
    '/:id/reject',
    verifyToken,
    isAdmin,
    applicationController.rejectApplication
);

module.exports = router;