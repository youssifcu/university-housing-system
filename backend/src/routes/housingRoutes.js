const express = require('express');
const router = express.Router();
const housingController = require('../controllers/housingController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');

// public
router.get('/', housingController.getAllHousings);
router.get('/:id', housingController.getHousingById);

// protected (admin only checked inside controller)
router.post('/', verifyFirebaseToken, housingController.createHousing);
router.put('/:id', verifyFirebaseToken, housingController.updateHousing);
router.delete('/:id', verifyFirebaseToken, housingController.deleteHousing);

module.exports = router;
