const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// all booking endpoints require authentication
router.post('/', verifyFirebaseToken, bookingController.createBooking);
router.get('/', verifyFirebaseToken, bookingController.getAllBookings);
router.get('/:id', verifyFirebaseToken, bookingController.getBookingById);
router.put('/:id', verifyFirebaseToken, bookingController.updateBooking);
router.delete('/:id', verifyFirebaseToken, bookingController.deleteBooking);

module.exports = router;
