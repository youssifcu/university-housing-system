const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin } = require('../middlewares/roleMiddleware');
const multer = require('multer');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
});

router.get('/:id/profile-picture', userController.getProfilePicture);
router.get('/me/profile', verifyToken, userController.getUserProfile);

router.get('/:id', verifyToken, userController.getUserById);

router.put('/profile/update', verifyToken, upload.single('profilePicture'), userController.updateUserProfile);

router.get('/', verifyToken, isAdmin, userController.getAllUsers);

router.put('/:id', verifyToken, isAdmin, upload.single('profilePicture'), userController.updateUser);

router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
