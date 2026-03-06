const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const upload = require('../middlewares/upload');

router.post('/register', upload.single('profilePicture'), authController.registerUser);
router.post('/login', verifyFirebaseToken, authController.loginUser);
router.post('/forgot-password', authController.forgotPassword);

router.get('/profile', verifyFirebaseToken, authController.getUserProfile);
router.put('/profile', verifyFirebaseToken, upload.single('profilePicture'), authController.updateUserProfile);

module.exports = router; 