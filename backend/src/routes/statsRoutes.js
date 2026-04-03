const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

router.get('/students-by-college', verifyToken, isAdmin, statsController.getStudentsByCollege);
router.get('/students-by-grade', verifyToken, isAdmin, statsController.getStudentsByGrade);
router.get('/rooms', verifyToken, isAdmin, statsController.getRoomsStats);
router.get('/buildings-availability', verifyToken, isAdmin, statsController.getBuildingsAvailability);
router.get('/meals', verifyToken, isAdmin, statsController.getMealsStats);
router.get('/meals/preparation', verifyToken, isAdmin, statsController.getMealsPreparationStats);
router.get('/payments', verifyToken, isAdmin, statsController.getPaymentsStats);

module.exports = router;