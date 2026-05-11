const express = require('express');
const router = express.Router();
const buildingController = require('../controllers/buildingController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');


router.get(
    '/',
    verifyToken,
    buildingController.getAllBuildings
);

router.get(
    '/:id',
    verifyToken,
    buildingController.getBuildingById
);

// ==========================================
//   (Admin Only)
// ==========================================
//   
router.post(
    '/',
    verifyToken,
    isAdmin,
    buildingController.createBuilding
);

router.put(
    '/:id',
    verifyToken,
    isAdmin,
    buildingController.updateBuilding
);

router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    buildingController.deleteBuilding
);



module.exports = router;