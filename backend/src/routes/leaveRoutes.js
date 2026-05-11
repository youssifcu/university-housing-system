const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController'); // دوال الإجازة هنا
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.post(
    '/request',
    verifyToken,
    isStudent,
    studentController.requestLeave
);

router.get(
    '/attendance',
    verifyToken,
    isStudent,
    studentController.getAttendanceReport
);


router.patch(
    '/approve/:requestId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.approveLeave
);

router.patch(
    '/end/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.endLeave
);

router.get(
    '/attendance/:studentId',
    verifyToken,
    isAdminOrSupervisor,
    studentController.getAttendanceReport
);

module.exports = router;