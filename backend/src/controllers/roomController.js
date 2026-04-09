const Room = require('../models/Room');
const { Student } = require('../models/User');

// ================= GET ALL ROOMS =================
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate('buildingId', 'name');
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET AVAILABLE ROOMS =================
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({
      $expr: { $lt: [{ $size: "$currentOccupants" }, "$capacity"] }
    }).populate('buildingId', 'name');

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ROOMS BY BUILDING =================
exports.getRoomsByBuilding = async (req, res) => {
  try {
    const rooms = await Room.find({
      buildingId: req.params.buildingId
    }).populate('buildingId', 'name');

    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= GET ROOM BY ID =================
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('buildingId', 'name')
      .populate('currentOccupants', 'name email');

    if (!room) return res.status(404).json({ message: 'Room not found' });

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= CREATE ROOM =================
exports.createRoom = async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();

    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= UPDATE ROOM =================
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!room) return res.status(404).json({ message: 'Room not found' });

    res.status(200).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= UPDATE ROOM STATUS =================
exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.status = status;
    await room.save();

    res.status(200).json({ message: 'Status updated', room });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= ASSIGN STUDENT =================
exports.assignStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);

    if (!room) return res.status(404).json({ message: 'Room not found' });

    if (room.currentOccupants.length >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.assignedRoomId = room._id;
    student.roomAllocationDate = new Date();

    if (!room.currentOccupants.includes(studentId)) {
      room.currentOccupants.push(studentId);
    }

    if (room.currentOccupants.length >= room.capacity) {
      room.status = 'full';
    }

    await student.save();
    await room.save();

    res.status(200).json({ message: 'Student assigned successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= AUTO ASSIGN =================
exports.autoAssignRoom = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    if (student.assignedRoomId) {
      return res.status(400).json({ message: 'Already assigned' });
    }

    const room = await Room.findOne({
      $expr: { $lt: [{ $size: "$currentOccupants" }, "$capacity"] }
    });

    if (!room) return res.status(404).json({ message: 'No available rooms' });

    room.currentOccupants.push(studentId);
    student.assignedRoomId = room._id;
    student.roomAllocationDate = new Date();

    if (room.currentOccupants.length >= room.capacity) {
      room.status = 'full';
    }

    await room.save();
    await student.save();

    res.status(200).json({ message: 'Auto assigned successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ================= REMOVE STUDENT =================
exports.removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    room.currentOccupants = room.currentOccupants.filter(
      id => id.toString() !== studentId
    );

    const student = await Student.findById(studentId);
    if (student) {
      student.assignedRoomId = null;
      student.roomAllocationDate = null;
      await student.save();
    }

    room.status = 'available';

    await room.save();

    res.status(200).json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ================= GET MY ROOM =================
exports.getMyRoom = async (req, res) => {
  try {
    const studentId = req.userDoc._id;

    const room = await Room.findOne({ currentOccupants: studentId })
      .populate('buildingId', 'name')
      .populate('currentOccupants', 'name email');

    if (!room) return res.status(404).json({ message: 'No room assigned' });

    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};