const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================

// ==========================================

router.get(
    '/',
    verifyToken,
    announcementController.getAllAnnouncements
);

router.get(
    '/:id',
    verifyToken,
    announcementController.getAnnouncementById
);

// ==========================================
// ==========================================
router.post(
    '/',
    verifyToken,
    isAdminOrSupervisor,
    announcementController.createAnnouncement
);

router.put(
    '/:id',
    verifyToken,
    isAdminOrSupervisor,
    announcementController.updateAnnouncement
);

router.patch(
    '/:id/status',
    verifyToken,
    isAdminOrSupervisor,
    announcementController.updateAnnouncementStatus
);

router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    announcementController.deleteAnnouncement
);

module.exports = router;