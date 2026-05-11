const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// ==========================================
router.get(
    '/my',
    verifyToken,
    attendanceController.getMyAttendance
);

// ==========================================
// ==========================================
router.post(
    '/scan',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.scanAttendance
);

router.get(
    '/student/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.getStudentAttendance
);

router.get(
    '/building/:buildingId',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.getAttendanceByBuilding
);

router.patch(
    '/:id',
    verifyToken,
    isAdmin,
    attendanceController.updateAttendance
);



module.exports = router;