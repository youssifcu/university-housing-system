const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isStudent } = require('../middlewares/roleMiddleware');

// ==========================================
//   (Student Only)
// ==========================================
router.get(
    '/my',
    verifyToken,
    isStudent,
    paymentController.getMyPayments
);

router.post(
    '/',
    verifyToken,
    isStudent,
    paymentController.createPayment
);

router.get(
    '/:id',
    verifyToken,
    isStudent,
    paymentController.getPaymentById
);

// ==========================================
//   (Admin Only)
// ==========================================
//    ( Pagination )
router.get(
    '/',
    verifyToken,
    isAdmin,
    paymentController.getAllPayments
);

router.put(
    '/:id',
    verifyToken,
    isAdmin,
    paymentController.updatePayment
);

router.delete(
    '/:id',
    verifyToken,
    isAdmin,
    paymentController.deletePayment
);

module.exports = router;