const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const leaveController = require('../controllers/leaveController');
const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.get(
    '/me',
    verifyToken,
    isStudent,
    studentController.getMyProfile
);

router.get(
    '/me/qr',
    verifyToken,
    isStudent,
    studentController.getMyQRCode
);

router.post(
    '/me/generate-qr',
    verifyToken,
    isStudent,
    studentController.generateMyQRCode
);

router.post(
    '/me/leave',
    verifyToken,
    isStudent,
    leaveController.requestLeave
);

router.get(
    '/me/attendance',
    verifyToken,
    isStudent,
    attendanceController.getMyAttendance
);

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.post(
    '/validate-qr',
    verifyToken,
    isAdminOrSupervisor,
    studentController.validateQRCode
);

router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAllStudents
);

router.get(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getStudentById
);

router.patch(
    '/:id',
    verifyToken,
    isAdmin,
    studentController.updateStudent
);

router.patch(
    '/leave/:requestId/approve',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.approveLeave
);

router.patch(
    '/:studentId/end-leave',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.endLeave
);

router.get(
    '/:studentId/attendance',
    verifyToken,
    isAdminOrSupervisor,
    attendanceController.getStudentAttendance
);

module.exports = router;