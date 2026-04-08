const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

const { isAdmin, checkStudentApproval } = require('../middlewares/authMiddleware');

router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

router.get('/profile', verifyFirebaseToken, checkStudentApproval, authController.getProfile);

router.patch('/password', verifyFirebaseToken, authController.changePassword);
router.post('/update-profile', verifyFirebaseToken, authController.updateProfile);

\router.post('/register-admin', verifyFirebaseToken, isAdmin, authController.registerAdmin);

module.exports = router;