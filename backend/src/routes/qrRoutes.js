const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isFloorAdmin, isMealAdmin } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
//  QR Codes 
router.post(
    '/generate',
    verifyToken,
    isStudent,
    qrController.generateStudentQRCodes
);

router.post(
    '/refresh',
    verifyToken,
    isStudent,
    qrController.refreshStudentQRCodes
);

router.get(
    '/my',
    verifyToken,
    isStudent,
    qrController.getStudentQRCodes
);

// ==========================================
// ==========================================
router.get(
    '/verify',
    verifyToken,
    qrController.verifyQRCode
);

module.exports = router;