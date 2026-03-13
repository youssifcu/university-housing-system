const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

router.get('/', verifyToken, isAdmin, applicationController.getAllApplications);
router.get('/my', verifyToken, applicationController.getMyApplications);
router.get('/:id', verifyToken, applicationController.getApplicationById);
router.post('/', verifyToken, applicationController.submitApplication);
router.patch('/:id/approve', verifyToken, isAdmin, applicationController.approveApplication);
router.patch('/:id/reject', verifyToken, isAdmin, applicationController.rejectApplication);
router.patch('/:id', verifyToken, applicationController.updateApplication);
router.delete('/:id', verifyToken, applicationController.deleteApplication);

module.exports = router;