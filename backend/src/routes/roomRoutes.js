const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

// Standard GETs
router.get('/', verifyToken, roomController.getAllRooms);
router.get('/available', verifyToken, roomController.getAvailableRooms);
router.get('/building/:buildingId', verifyToken, roomController.getRoomsByBuilding);
router.get('/:id', verifyToken, roomController.getRoomById);

// Admin Only - Creation and Updates
router.post('/', verifyToken, isAdmin, roomController.createRoom);
router.put('/:id', verifyToken, isAdmin, roomController.updateRoom);

// Status and Assignment Routes
router.patch('/:id/status', verifyToken, isAdmin, roomController.updateRoomStatus);
router.patch('/:id/assign', verifyToken, isAdmin, roomController.assignStudent);
router.patch('/:id/remove-student', verifyToken, isAdmin, roomController.removeStudent);

module.exports = router;