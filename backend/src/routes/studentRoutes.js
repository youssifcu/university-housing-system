const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

// Student Personal Routes
router.get('/me', verifyToken, studentController.getMyProfile);
router.get('/me/qr', verifyToken, studentController.getMyQRCode);

// Admin Management Routes
router.get('/', verifyToken, isAdmin, studentController.getAllStudents);
router.get('/:id', verifyToken, isAdmin, studentController.getStudentById);
router.patch('/:id', verifyToken, isAdmin, studentController.updateStudent);

module.exports = router;