const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leaveController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.post(
    '/request',
    verifyToken,
    isStudent,
    leaveController.requestLeave
);


router.patch(
    '/approve/:requestId',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.approveLeave
);

router.patch(
    '/end/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    leaveController.endLeave
);

module.exports = router;