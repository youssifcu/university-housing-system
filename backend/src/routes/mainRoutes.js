const express = require('express');
const router = express.Router();
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isSupervisor, isFloorSupervisor, isMealAdmin, isStudent, checkStudentApproval } = require('../middlewares/authMiddleware');

const requestController = require('../controllers/requestController');
const qrController = require('../controllers/qrController');
const leaveController = require('../controllers/leaveController');

router.post('/requests/submit', verifyFirebaseToken, isStudent, checkStudentApproval, requestController
.submitRequest);
router.get('/requests', verifyFirebaseToken, isAdmin, requestController
.getRequestsForAdmin);
router.get('/requests/:requestId', verifyFirebaseToken, requestController
.getRequestDetails);
router.patch('/requests/:requestId/assign', verifyFirebaseToken, isAdmin, requestController
.assignRequestToSelf);
router.patch('/requests/:requestId/message', verifyFirebaseToken, requestController
.addRequestMessage);
router.patch('/requests/:requestId/respond', verifyFirebaseToken, isAdmin, requestController
.respondToRequest);

router.post('/qr-codes/generate', verifyFirebaseToken, isStudent, checkStudentApproval, qrController.generateStudentQRCodes);
router.get('/qr-codes', verifyFirebaseToken, isStudent, qrController.getStudentQRCodes);
router.post('/attendance/scan', verifyFirebaseToken, isFloorSupervisor, qrController.recordAttendance);
router.post('/meals/scan', verifyFirebaseToken, isMealAdmin, qrController.recordMeal);

router.post('/leave/request', verifyFirebaseToken, isStudent, checkStudentApproval, leaveController.requestLeave);
router.patch('/leave/:requestId/approve', verifyFirebaseToken, isSupervisor, leaveController.approveLeave);
router.patch('/leave/:studentId/end', verifyFirebaseToken, isSupervisor, leaveController.endLeave);
router.get('/attendance/:studentId/report', verifyFirebaseToken, leaveController.getAttendanceReport);

module.exports = router;