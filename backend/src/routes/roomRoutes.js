const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const verifyToken = require('../middlewares/verifyFirebaseToken');

// استدعاء الميدل ويرز اللي عملناها سوا
const { isAdmin, isStudent } = require('../middlewares/authMiddleware');

// --- مسارات الطلاب (Student Routes) ---

// الطالب يقدر يشوف بيانات أوضته ومين معاه
router.get('/my-room', verifyToken, isStudent, roomController.getMyRoom);

// --- مسارات عامة (Standard GETs) ---
router.get('/', verifyToken, roomController.getAllRooms);
router.get('/available', verifyToken, roomController.getAvailableRooms);
router.get('/building/:buildingId', verifyToken, roomController.getRoomsByBuilding);
router.get('/:id', verifyToken, roomController.getRoomById);

// --- مسارات الأدمن (Admin Only) ---

// إنشاء غرفة جديدة
router.post('/', verifyToken, isAdmin, roomController.createRoom);

// تحديث بيانات غرفة
router.put('/:id', verifyToken, isAdmin, roomController.updateRoom);

// تحديث حالة الغرفة (متاحة، صيانة، ممتلئة)
router.patch('/:id/status', verifyToken, isAdmin, roomController.updateRoomStatus);

// التسكين اليدوي (عن طريق ID الغرفة)
router.patch('/:id/assign', verifyToken, isAdmin, roomController.assignStudent);

// التسكين التلقائي (عن طريق ID الطالب - يبحث له عن أي غرفة فاضية)
router.post('/auto-assign/:studentId', verifyToken, isAdmin, roomController.autoAssignRoom);

// إزالة طالب من غرفة
router.patch('/:id/remove-student', verifyToken, isAdmin, roomController.removeStudent);

module.exports = router;