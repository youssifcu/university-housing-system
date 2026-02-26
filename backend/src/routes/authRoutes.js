const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// تأكد إن authController.loginUser موجودة فعلاً في ملف الـ controller
router.post('/login', verifyFirebaseToken, authController.loginUser);

// تأكد إن authController.registerUser موجودة فعلاً في ملف الـ controller
router.post('/register', verifyFirebaseToken, authController.registerUser);

// simple logout endpoint (token is managed client-side)
router.post('/logout', authController.logoutUser);

module.exports = router;
