const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisorOrFloorAdmin } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.get(
    '/dashboard',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getDashboardStats
);

router.get(
    '/students-by-college',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getStudentsByCollege
);

router.get(
    '/students-by-grade',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getStudentsByGrade
);

router.get(
    '/rooms',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getRoomsStats
);

router.get(
    '/buildings-availability',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getBuildingsAvailability
);

router.get(
    '/meals',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getMealsStats
);

router.get(
    '/meals/preparation',
    verifyToken,
    isAdminOrSupervisorOrFloorAdmin,
    statsController.getMealsPreparationStats
);

router.get(
    '/payments',
    verifyToken,
    isAdmin,
    statsController.getPaymentsStats
);

module.exports = router;