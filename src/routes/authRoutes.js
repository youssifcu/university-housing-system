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
// مسارات عامة (بدون توثيق)
// ==========================================
// تسجيل طالب جديد
router.post(
    '/register',
    upload.single('profilePicture'),
    authController.registerUser
);

// تسجيل الدخول
router.post(
    '/login',
    authController.loginUser
);

// ==========================================
// مسارات تتطلب توثيق (للمستخدم المسجل)
// ==========================================
// عرض البروفايل الشخصي
router.get(
    '/profile',
    verifyToken,
    authController.getProfile
);

// تحديث البروفايل
router.put(
    '/profile',
    verifyToken,
    authController.updateProfile
);

// تغيير كلمة المرور (إن كانت مدعومة في الكنترولر)
router.patch(
    '/password',
    verifyToken,
    authController.changePassword
);

// ==========================================
// مسارات الأدمن فقط
// ==========================================
// تسجيل مستخدم جديد بدور معين (أدمن، مشرف، إلخ)
router.post(
    '/register-admin',
    verifyToken,
    isAdmin,
    authController.registerAdmin
);

// ==========================================
// مسارات اختيارية (لو موجودة في الكنترولر)
// ==========================================
// إذا أردت إضافة forgot/reset password لاحقاً
// router.post('/forgot-password', authController.forgotPassword);
// router.patch('/reset-password/:token', authController.resetPassword);

module.exports = router;
