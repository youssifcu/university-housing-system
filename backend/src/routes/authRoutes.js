const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// Public routes
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);
router.patch('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/profile', verifyFirebaseToken, authController.getProfile);
router.patch('/password', verifyFirebaseToken, authController.changePassword);

module.exports = router;