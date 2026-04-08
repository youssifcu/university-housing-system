const express = require('express');
const router = express.Router();
const applicationController = require('../controllers/applicationController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');
const upload = require('../config/multer'); // <--- DON'T FORGET THIS LINE

// --- Public/Student Routes ---
router.post('/', 
  verifyToken, 
  upload.fields([
    { name: 'documentUrl', maxCount: 1 },
    { name: 'medicalReport', maxCount: 1 }
  ]), 
  applicationController.submitApplication
);
router.get('/my', verifyToken, applicationController.getMyApplications);
router.get('/:id', verifyToken, applicationController.getApplicationById);
router.patch('/:id', verifyToken, upload.single('document'), applicationController.updateApplication);
router.delete('/:id', verifyToken, applicationController.deleteApplication);

// --- Admin Only Routes ---
router.get('/', applicationController.getAllApplications);
router.patch('/:id/approve', applicationController.approveApplication);
router.patch('/:id/reject', verifyToken, isAdmin, applicationController.rejectApplication);

module.exports = router;