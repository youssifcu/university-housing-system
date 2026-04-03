const express = require('express');
const router = express.Router();
const housingRequestController = require('../controllers/housingRequestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');
const isSupervisorOrAdmin = require('../middlewares/supervisorMiddleware');

// Student submits their request
router.post('/', verifyToken, housingRequestController.submitRequest);

// Supervisor/Admin views and manages requests
router.get('/', verifyToken, isSupervisorOrAdmin, housingRequestController.getAllRequests);
router.get('/:id', verifyToken, isSupervisorOrAdmin, housingRequestController.getRequestById);
router.patch('/:id/status', verifyToken, isSupervisorOrAdmin, housingRequestController.updateStatus);

module.exports = router;