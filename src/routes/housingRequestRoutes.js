const express = require('express');
const router = express.Router();
const housingRequestController = require('../controllers/housingRequestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// 1.   (Shared / Student Specific)
// ==========================================

router.post(
    '/',
    verifyToken,
    housingRequestController.submitRequest
);


router.get(
    '/',
    verifyToken,
    housingRequestController.getAllRequests
);

router.get(
    '/:id',
    verifyToken,
    housingRequestController.getRequestById
);

router.patch(
    '/:id',
    verifyToken,
    housingRequestController.updateMyRequest
);

// ==========================================
// 2.(Admin/Supervisor Only)
// ==========================================

router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    housingRequestController.updateStatus
);

module.exports = router;