const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
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
    studentController.requestLeave
);

router.get(
    '/me/attendance',
    verifyToken,
    isStudent,
    studentController.getAttendanceReport
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
    studentController.approveLeave
);

router.patch(
    '/:studentId/end-leave',
    verifyToken,
    isAdminOrSupervisor,
    studentController.endLeave
);

router.get(
    '/:studentId/attendance',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAttendanceReport
);

module.exports = router;