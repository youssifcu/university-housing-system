const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

// Only Admins can delete users
router.delete('/:id', verifyFirebaseToken, isAdmin, userController.deleteUser);

module.exports = router;