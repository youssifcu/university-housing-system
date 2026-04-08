const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isSupervisor } = require('../middlewares/authMiddleware');

router.post('/request', verifyFirebaseToken, isStudent, leaveController.requestLeave);
router.patch('/approve/:requestId', verifyFirebaseToken, isSupervisor, leaveController.approveLeave);
router.get('/report/:studentId?', verifyFirebaseToken, leaveController.getAttendanceReport);

module.exports = router;