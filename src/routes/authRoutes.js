const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin } = require('../middlewares/roleMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

// ==========================================
// ==========================================
router.post(
    '/register',
    upload.single('profilePicture'),
    authController.registerUser
);

router.post(
    '/login',
    authController.loginUser
);

// ==========================================
// ==========================================
router.get(
    '/profile',
    verifyToken,
    authController.getProfile
);

router.put(
    '/profile',
    verifyToken,
    authController.updateProfile
);

router.patch(
    '/password',
    verifyToken,
    authController.changePassword
);

// ==========================================
// ==========================================
router.post(
    '/register-admin',
    verifyToken,
    isAdmin,
    authController.registerAdmin
);



module.exports = router;
