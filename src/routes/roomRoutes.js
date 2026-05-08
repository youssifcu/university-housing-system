const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.get(
    '/my',
    verifyToken,
    isStudent,
    roomController.getMyRoom
);

// ==========================================
// ==========================================
router.get(
    '/',
    verifyToken,
    roomController.getAllRooms
);

router.get(
    '/available',
    verifyToken,
    roomController.getAvailableRooms
);

router.get(
    '/building/:buildingId',
    verifyToken,
    roomController.getRoomsByBuilding
);

router.get(
    '/:id',
    verifyToken,
    roomController.getRoomById
);

// ==========================================
//   (Admin/Supervisor)
// ==========================================
router.post(
    '/',
    verifyToken,
    isAdmin,
    roomController.createRoom
);

router.put(
    '/:id',
    verifyToken,
    isAdmin,
    roomController.updateRoom
);

router.patch(
    '/:id/status',
    verifyToken,
    isAdmin,
    roomController.updateRoomStatus
);

router.patch(
    '/:id/assign',
    verifyToken,
    isAdminOrSupervisor,
    roomController.assignStudent
);

router.patch(
    '/:id/remove',
    verifyToken,
    isAdminOrSupervisor,
    roomController.removeStudent
);

router.post(
    '/auto-assign/:studentId',
    verifyToken,
    isAdmin,
    roomController.autoAssignRoom
);

module.exports = router;