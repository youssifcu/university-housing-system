const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const verifyToken = require('../middlewares/verifyFirebaseToken');

router.post('/', verifyToken, attendanceController.recordAttendance);
router.post('/scan', verifyToken, attendanceController.scanAttendance);
router.get('/student/:id', verifyToken, attendanceController.getAttendanceByStudent);
router.get('/building/:id', verifyToken, attendanceController.getAttendanceByBuilding);
router.patch('/:id', verifyToken, attendanceController.updateAttendance);

module.exports = router;
