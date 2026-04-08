const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const verifyFirebaseToken = require('../middlewares/verifyFirebaseToken');
const { isStudent, isAdmin, checkStudentApproval } = require('../middlewares/authMiddleware');

router.post('/submit', verifyFirebaseToken, isStudent, checkStudentApproval, requestController.submitRequest);

router.get('/admin/all', verifyFirebaseToken, isAdmin, requestController.getRequestsForAdmin);

router.patch('/assign/:requestId', verifyFirebaseToken, isAdmin, requestController.assignRequestToSelf);

router.post('/message/:requestId', verifyFirebaseToken, requestController.addRequestMessage);

module.exports = router;