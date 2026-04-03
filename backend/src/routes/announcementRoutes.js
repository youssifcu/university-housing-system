const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

router.post('/', verifyToken, isAdmin, announcementController.createAnnouncement);
router.get('/', verifyToken, announcementController.getAllAnnouncements);
router.get('/:id', verifyToken, announcementController.getAnnouncementById);
router.put('/:id', verifyToken, isAdmin, announcementController.updateAnnouncement);
router.patch('/:id/status', verifyToken, isAdmin, announcementController.updateAnnouncementStatus);
router.delete('/:id', verifyToken, isAdmin, announcementController.deleteAnnouncement);

module.exports = router;
