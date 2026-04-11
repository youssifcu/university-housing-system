const Room = require('../models/Room');
const { User } = require('../models/User');

// ================= الحصول على كل الغرف =================
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find()
      .populate('buildingId', 'name gender')
      .populate('currentOccupants', 'name email studentId');
    res.status(200).json({ success: true, count: rooms.length, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= الحصول على الغرف المتاحة فقط =================
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available' }).populate('buildingId', 'name');
    res.status(200).json({ success: true, rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= إنشاء غرفة جديدة =================
exports.createRoom = async (req, res) => {
  try {
    const { roomNumber, capacity, buildingId, floorNumber } = req.body;

    const room = new Room({ roomNumber, capacity, buildingId, floorNumber });
    await room.save();

    res.status(201).json({ success: true, message: "Room created successfully", room });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= تسكين طالب يدوياً (Admin Only) =================
exports.assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const { id: roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.currentOccupants.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student record not found' });
    }

    // منع التكرار وإضافة الطالب
    if (!room.currentOccupants.includes(studentId)) {
      room.currentOccupants.push(studentId);
      await room.save(); // الـ Pre-save middleware سيحدث الحالة لـ full تلقائياً
    }

    // تحديث بيانات الطالب ليرتبط بالغرفة
    student.assignedRoomId = room._id;
    student.roomAllocationDate = new Date();
    student.housingStatus = 'active';
    await student.save();

    res.status(200).json({ success: true, message: 'Student assigned successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= إزالة طالب من الغرفة (إخلاء) =================
exports.removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const { id: roomId } = req.params;

    const room = await Room.findById(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.currentOccupants = room.currentOccupants.filter(id => id.toString() !== studentId);
    await room.save();

    // تحديث بيانات الطالب ليصبح غير مسكن
    await User.findByIdAndUpdate(studentId, {
      assignedRoomId: null,
      roomAllocationDate: null,
      housingStatus: 'inactive'
    });

    res.status(200).json({ success: true, message: 'Student removed successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= عرض بيانات غرفتي (للموبايل - Sprint 2) =================
exports.getMyRoom = async (req, res) => {
  try {
    // نستخدم ID الطالب من الـ req.userDoc الذي وفره الـ middleware
    const room = await Room.findOne({ currentOccupants: req.userDoc._id })
      .populate({
        path: 'buildingId',
        populate: { path: 'supervisorId', select: 'name phoneNumber email' }
      })
      .populate('currentOccupants', 'name email phoneNumber profilePicture');

    if (!room) return res.status(404).json({ success: false, message: 'No room assigned to you yet' });

    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};