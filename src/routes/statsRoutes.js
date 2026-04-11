const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisorOrFloorAdmin } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الإدارة (Admin/Supervisor)
// ==========================================
// لوحة التحكم (إحصائيات سريعة)
router.get(
    '/dashboard',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getDashboardStats
);

// إحصائيات الطلاب حسب الكلية
router.get(
    '/students-by-college',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getStudentsByCollege
);

// إحصائيات الطلاب حسب السنة الدراسية
router.get(
    '/students-by-grade',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getStudentsByGrade
);

// إحصائيات الغرف (إذا كانت موجودة في الكنترولر)
router.get(
    '/rooms',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getRoomsStats
);

// إحصائيات توفر المباني
router.get(
    '/buildings-availability',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getBuildingsAvailability
);

// إحصائيات الوجبات
router.get(
    '/meals',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getMealsStats
);

// إحصائيات تحضير الوجبات
router.get(
    '/meals/preparation',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
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