const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/verifyFirebaseToken');
const {
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isStudent,
    isAdminOrSupervisor
} = require('../middlewares/roleMiddleware');

const studentRequestController = require('../controllers/requestController');
const qrController = require('../controllers/qrController');
const studentController = require('../controllers/studentController');
const attendanceController = require('../controllers/attendanceController');
const mealController = require('../controllers/mealController');

// ==========================================
//(Student Requests)
// ==========================================
router.post(
    '/requests',
    verifyToken,
    isStudent,
    studentRequestController.submitRequest
);

router.get(
    '/requests/my',
    verifyToken,
    isStudent,
    studentRequestController.getMyRequests
);

router.get(
    '/requests',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.getRequestsForAdmin
);

router.get(
    '/requests/:requestId',
    verifyToken,
    studentRequestController.getRequestDetails
);

router.patch(
    '/requests/:requestId/assign',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.assignRequestToSelf
);

router.post(
    '/requests/:requestId/messages',
    verifyToken,
    studentRequestController.addRequestMessage
);

router.patch(
    '/requests/:requestId/respond',
    verifyToken,
    isAdminOrSupervisor,
    studentRequestController.respondToRequest
);

const leaveController = require('../controllers/leaveController');

// ==========================================
//  QR Codes
// ==========================================
router.post(
    '/qr/generate',
    verifyToken,
    isStudent,
    qrController.generateStudentQRCodes
);

router.post(
    '/qr/refresh',
    verifyToken,
    isStudent,
    qrController.refreshStudentQRCodes
);

router.get(
    '/qr/my',
    verifyToken,
    isStudent,
    qrController.getStudentQRCodes
);

// ==========================================
//  Legacy API v2 Paths (Preserved for Mobile/Frontend)
// ==========================================
router.post(
    '/attendance/scan',
    verifyToken,
    isFloorAdmin,
    attendanceController.scanAttendance
);

router.post(
    '/meals/scan',
    verifyToken,
    isMealAdmin,
    mealController.scanMeal
);

router.post(
    '/leave/request',
    verifyToken,
    isStudent,
    leaveController.requestLeave
);

router.patch(
    '/leave/:requestId/approve',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.approveLeave
);

router.patch(
    '/leave/:studentId/end',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.endLeave
);

router.get(
    '/attendance/report',
    verifyToken,
    attendanceController.getMyAttendance
);

router.get(
    '/attendance/report/:studentId',
    verifyToken,
    attendanceController.getStudentAttendance
);

module.exports = router;