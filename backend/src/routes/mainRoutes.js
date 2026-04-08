const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isSupervisor, isFloorSupervisor, isMealAdmin, isStudent, checkStudentApproval } = require('../middlewares/authMiddleware');

const studentRequestController = require('../controllers/studentRequestController');
const qrCodeController = require('../controllers/qrCodeController');
const leaveManagementController = require('../controllers/leaveManagementController');

router.post('/requests/submit', verifyFirebaseToken, isStudent, checkStudentApproval, studentRequestController.submitRequest);
router.get('/requests', verifyFirebaseToken, isAdmin, studentRequestController.getRequestsForAdmin);
router.get('/requests/:requestId', verifyFirebaseToken, studentRequestController.getRequestDetails);
router.patch('/requests/:requestId/assign', verifyFirebaseToken, isAdmin, studentRequestController.assignRequestToSelf);
router.patch('/requests/:requestId/message', verifyFirebaseToken, studentRequestController.addRequestMessage);
router.patch('/requests/:requestId/respond', verifyFirebaseToken, isAdmin, studentRequestController.respondToRequest);

router.post('/qr-codes/generate', verifyFirebaseToken, isStudent, checkStudentApproval, qrCodeController.generateStudentQRCodes);
router.get('/qr-codes', verifyFirebaseToken, isStudent, qrCodeController.getStudentQRCodes);
router.post('/attendance/scan', verifyFirebaseToken, isFloorSupervisor, qrCodeController.recordAttendance);
router.post('/meals/scan', verifyFirebaseToken, isMealAdmin, qrCodeController.recordMeal);

router.post('/leave/request', verifyFirebaseToken, isStudent, checkStudentApproval, leaveManagementController.requestLeave);
router.patch('/leave/:requestId/approve', verifyFirebaseToken, isSupervisor, leaveManagementController.approveLeave);
router.patch('/leave/:studentId/end', verifyFirebaseToken, isSupervisor, leaveManagementController.endLeave);
router.get('/attendance/:studentId/report', verifyFirebaseToken, leaveManagementController.getAttendanceReport);

module.exports = router;