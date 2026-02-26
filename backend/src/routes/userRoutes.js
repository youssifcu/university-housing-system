const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// all routes require authentication
router.get('/profile', verifyFirebaseToken, userController.getProfile);
router.put('/profile', verifyFirebaseToken, userController.updateProfile);
router.get('/bookings', verifyFirebaseToken, userController.getUserBookings);

module.exports = router;
