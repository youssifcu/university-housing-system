const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const verifyToken = require('../middlewares/verifyFirebaseToken');


router.post('/login', authController.loginUser);
//router.post('/register', verifyToken, authController.registerUser);


module.exports = router;
