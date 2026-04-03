const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const verifyToken = require('../middlewares/verifyFirebaseToken');

router.post('/', verifyToken, reportController.createReport);
router.get('/', verifyToken, reportController.getAllReports);
router.get('/:id', verifyToken, reportController.getReportById);
router.patch('/:id/status', verifyToken, reportController.updateReportStatus);
router.delete('/:id', verifyToken, reportController.deleteReport);

module.exports = router;
