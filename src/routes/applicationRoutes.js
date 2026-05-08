const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');
const upload = require('../config/multer');

// ==========================================
//   (Student Only)
// ==========================================
router.post(
    '/',
    verifyToken,
    upload.fields([
        { name: 'nationalIdCard', maxCount: 1 },
        { name: 'personalPhoto', maxCount: 1 },
        { name: 'medicalReport', maxCount: 1 },
        { name: 'universityIdCard', maxCount: 1 }
    ]),
    applicationController.submitApplication
);

router.get(
    '/my',
    verifyToken,
    applicationController.getMyApplication
);

router.get(
    '/:id',
    verifyToken,
    applicationController.getApplicationById
);

router.delete(
    '/:id',
    verifyToken,
    applicationController.deleteApplication
);

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.get(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    applicationController.getAllApplications
);

router.patch(
    '/:id/approve',
    verifyToken,
    isAdminOrSupervisor,
    applicationController.approveApplication
);

router.patch(
    '/:id/reject',
    verifyToken,
    isAdminOrSupervisor,
    applicationController.rejectApplication
);

module.exports = router;