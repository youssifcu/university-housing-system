const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const isAdmin = require('../middlewares/adminMiddleware');

router.get('/my', verifyToken, paymentController.getMyPayments);
router.post('/', verifyToken, paymentController.createPayment);

router.get('/', verifyToken, isAdmin, paymentController.getAllPayments);
router.get('/:id', verifyToken, isAdmin, paymentController.getPaymentById);
router.put('/:id', verifyToken, isAdmin, paymentController.updatePayment);
router.delete('/:id', verifyToken, isAdmin, paymentController.deletePayment);

module.exports = router;