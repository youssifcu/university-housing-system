const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// Public Login: No middleware needed here because we check the body's firebaseUID
router.post('/login', authController.loginUser);

// Protected Registration: Needs token to get UID/Email safely
router.post('/register', verifyFirebaseToken, authController.registerUser);

// Protected Profile: Needs token to identify who is asking
router.get('/profile', verifyFirebaseToken, authController.getProfile);

// Change Password Route
router.patch('/password', verifyFirebaseToken, authController.changePassword);

// Forget Password
router.post('/forgot-password', authController.forgotPassword);

module.exports = router;