const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const verifyToken = require('../middlewares/verifyFirebaseToken');

router.get('/menu/today', verifyToken, mealController.getTodayMenu);
router.get('/menu/week', verifyToken, mealController.getWeeklyMenu);

router.post('/', verifyToken, mealController.createMeal);
router.put('/:id', verifyToken, mealController.updateMeal);
router.delete('/:id', verifyToken, mealController.deleteMeal);

router.post('/book', verifyToken, mealController.bookMeal);
router.delete('/book/:id', verifyToken, mealController.cancelBooking);
router.get('/bookings/my', verifyToken, mealController.getMyBookings);

router.post('/scan', verifyToken, mealController.scanMeal);

module.exports = router;
