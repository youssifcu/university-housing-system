const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.post(
    '/',
    verifyToken,
    isStudent,
    reportController.createReport
);

router.get(
    '/me',
    verifyToken,
    isStudent,
    reportController.getMyReports
);

router.get(
    '/:id',
    verifyToken,
    isStudent,
    reportController.getReportById
);

router.put(
    '/:id',
    verifyToken,
    isStudent,
    reportController.updateMyReport
);

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    reportController.getAllReports
);

router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    reportController.updateReportStatus
);

router.delete(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    reportController.deleteReport
);

module.exports = router;