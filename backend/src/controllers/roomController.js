const Room = require('../models/Room');
const { Student } = require('../models/User'); // التعديل الصحيح هنا

// GET /api/rooms - جلب كل الغرف مع بيانات المباني
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('buildingId', 'name');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/rooms/:id/assign - تسكين طالب يدوي (تعديل الـ Logic ليتناسب مع الموديل الجديد)
exports.assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);
    
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    // التحقق من المساحة باستخدام طول المصفوفة
    if (room.currentOccupants.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    // تحديث بيانات الطالب
    student.assignedRoomId = room._id;
    student.roomAllocationDate = new Date();
    await student.save();

    // تحديث بيانات الغرفة (إضافة الطالب للمصفوفة)
    if (!room.currentOccupants.includes(studentId)) {
      room.currentOccupants.push(studentId);
    }

    if (room.currentOccupants.length >= room.capacity) {
      room.status = 'full';
    }
    
    await room.save();
    
    res.status(200).json({ message: 'Student assigned successfully', roomNumber: room.roomNumber });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/rooms/my-room - دالة جديدة للطالب عشان يشوف أوضته
exports.getMyRoom = async (req, res) => {
  try {
    const studentId = req.userDoc._id;
    const room = await Room.findOne({ currentOccupants: studentId })
      .populate('buildingId', 'name')
      .populate('currentOccupants', 'name email phoneNumber profilePicture');

    if (!room) return res.status(404).json({ message: 'No room assigned to you' });
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// دالة التسكين التلقائي (التي اقترحتها لك سابقاً)
exports.autoAssignRoom = async (req, res) => {
  try {
    const { studentId } = req.params;
    const student = await Student.findById(studentId);
    
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.assignedRoomId) return res.status(400).json({ message: 'Student already has a room' });

    const availableRoom = await Room.findOne({
      status: 'available',
      $expr: { $lt: [{ $size: "$currentOccupants" }, "$capacity"] }
    });

    if (!availableRoom) return res.status(404).json({ message: 'No available rooms' });

    availableRoom.currentOccupants.push(studentId);
    if (availableRoom.currentOccupants.length === availableRoom.capacity) {
      availableRoom.status = 'full';
    }

    student.assignedRoomId = availableRoom._id;
    student.roomAllocationDate = new Date();

    await availableRoom.save();
    await student.save();

    res.status(200).json({ message: 'Auto-assigned to room ' + availableRoom.roomNumber });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ملاحظة: باقي الدوال (createRoom, updateRoom, delete) ستبقى كما هي مع التأكد من استخدام أسماء الحقول الجديدة