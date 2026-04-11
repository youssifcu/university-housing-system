const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isFloorAdmin, isMealAdmin } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// توليد QR Codes جديدة
router.post(
    '/generate',
    verifyToken,
    isStudent,
    qrController.generateStudentQRCodes
);

// تجديد QR Codes (بدون تغيير الصلاحيات)
router.post(
    '/refresh',
    verifyToken,
    isStudent,
    qrController.refreshStudentQRCodes
);

// عرض QR Codes الحالية
router.get(
    '/my',
    verifyToken,
    isStudent,
    qrController.getStudentQRCodes
);

// ==========================================
// مسارات التحقق (للإدارة)
// ==========================================
// التحقق من صحة QR Code (حضور أو وجبة)
router.get(
    '/verify',
    verifyToken,
    qrController.verifyQRCode
);

module.exports = router;