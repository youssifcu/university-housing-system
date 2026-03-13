const express = require('express');
const router = express.Router();
const housingRequestController = require('../controllers/housingRequestController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

// Student submits their request
router.post('/', verifyToken, housingRequestController.submitRequest);

// Admin views and manages requests
router.get('/', verifyToken, isAdmin, housingRequestController.getAllRequests);
router.get('/:id', verifyToken, isAdmin, housingRequestController.getRequestById);
router.patch('/:id/approve', verifyToken, isAdmin, housingRequestController.approveRequest);
router.patch('/:id/reject', verifyToken, isAdmin, housingRequestController.rejectRequest);

module.exports = router;