const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');
const upload = require('../config/multer'); // <--- DON'T FORGET THIS LINE

// --- Public/Student Routes ---
router.post('/', verifyToken, upload.single('document'), applicationController.submitApplication);
router.get('/my', verifyToken, applicationController.getMyApplications);
router.get('/:id', verifyToken, applicationController.getApplicationById);
router.patch('/:id', verifyToken, applicationController.updateApplication);
router.delete('/:id', verifyToken, applicationController.deleteApplication);

// --- Admin Only Routes ---
router.get('/', verifyToken, isAdmin, applicationController.getAllApplications);
router.patch('/:id/approve', verifyToken, isAdmin, applicationController.approveApplication);
router.patch('/:id/reject', verifyToken, isAdmin, applicationController.rejectApplication);

module.exports = router;