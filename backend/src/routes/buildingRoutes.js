const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

// Standard GET routes
router.get('/', verifyToken, buildingController.getAllBuildings);
router.get('/:id', verifyToken, buildingController.getBuildingById);

// Admin-only Management
router.post('/', verifyToken, isAdmin, buildingController.createBuilding);
router.put('/:id', verifyToken, isAdmin, buildingController.updateBuilding);

module.exports = router;