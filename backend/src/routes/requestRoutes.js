const express = require('express');
const router = express.Router();
const studentRequestController = require('../controllers/requestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// تقديم طلب جديد
router.post(
    '/',
    verifyToken,
    isStudent,
    studentRequestController.submitRequest
);

// عرض طلباتي
router.get(
    '/my',
    verifyToken,
    isStudent,
    studentRequestController.getMyRequests
);

// عرض تفاصيل طلب (للطالب - بشروط الملكية داخل الكنترولر)
router.get(
    '/:requestId',
    verifyToken,
    isStudent,
    studentRequestController.getRequestDetails
);

// إضافة رسالة للطلب (للطالب)
router.post(
    '/:requestId/messages',
    verifyToken,
    isStudent,
    studentRequestController.addRequestMessage
);

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// عرض الطلبات المخصصة لدور المشرف/الأدمن
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.getRequestsForAdmin
);

// تعيين الطلب للمشرف الحالي
router.patch(
    '/:requestId/assign',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.assignRequestToSelf
);

// الرد على الطلب (موافقة/رفض/مراجعة)
router.patch(
    '/:requestId/respond',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.respondToRequest
);

module.exports = router;