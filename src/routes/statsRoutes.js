const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// لوحة التحكم (إحصائيات سريعة)
router.get(
    '/dashboard',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getDashboardStats
);

// إحصائيات الطلاب حسب الكلية
router.get(
    '/students-by-college',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getStudentsByCollege
);

// إحصائيات الطلاب حسب السنة الدراسية
router.get(
    '/students-by-grade',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getStudentsByGrade
);

// إحصائيات الغرف (إذا كانت موجودة في الكنترولر)
router.get(
    '/rooms',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getRoomsStats
);

// إحصائيات توفر المباني
router.get(
    '/buildings-availability',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getBuildingsAvailability
);

// إحصائيات الوجبات
router.get(
    '/meals',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getMealsStats
);

// إحصائيات تحضير الوجبات
router.get(
    '/meals/preparation',
    verifyToken,
    isAdminOrSupervisor,
    statsController.getMealsPreparationStats
);

// إحصائيات المدفوعات
router.get(
    '/payments',
    verifyToken,
    isAdmin,
    statsController.getPaymentsStats
);

module.exports = router;