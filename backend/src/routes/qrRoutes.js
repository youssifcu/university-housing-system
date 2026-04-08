const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdmin, isFloorSupervisor, isMealAdmin } = require('../middlewares/authMiddleware');

router.post('/generate', verifyFirebaseToken, isStudent, qrController.generateStudentQRCodes);
router.get('/my-codes', verifyFirebaseToken, isStudent, qrController.getStudentQRCodes);
router.post('/scan-attendance', verifyFirebaseToken, isAdmin, qrController.recordAttendance);
router.post('/scan-meal', verifyFirebaseToken, isAdmin, qrController.recordMeal);

module.exports = router;