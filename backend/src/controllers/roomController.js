const Room = require('../models/Room');

// GET /api/rooms
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/available
exports.getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'available' });
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/building/:buildingId
exports.getRoomsByBuilding = async (req, res) => {
  try {
    const rooms = await Room.find({ buildingId: req.params.buildingId })
      .select('roomNumber status'); 
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/rooms/:id
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .select('buildingId roomNumber capacity');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/rooms
exports.createRoom = async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    const savedRoom = await newRoom.save();
    res.status(201).json({
      id: savedRoom._id,
      message: 'Room created'
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/rooms/:id
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Room updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/rooms/:id/status
exports.updateRoomStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/rooms/:id/assign
exports.assignStudent = async (req, res) => {
  try {
    const { studentId, bedNumber } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    
    if (room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room is full' });
    }

    const student = await require('../models/Student').findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    student.roomId = room._id;
    student.bedNumber = bedNumber;
    await student.save();

    room.currentOccupancy += 1;
    if (room.currentOccupancy >= room.capacity) {
      room.status = 'full';
    }
    await room.save();
    
    res.status(200).json({ message: 'Student assigned' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/rooms/:id/remove-student
exports.removeStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    const student = await require('../models/Student').findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (student.roomId.toString() !== room._id.toString()) {
      return res.status(400).json({ message: 'Student not in this room' });
    }

    student.roomId = null;
    student.bedNumber = null;
    await student.save();

    room.currentOccupancy = Math.max(0, room.currentOccupancy - 1);
    if (room.currentOccupancy < room.capacity) {
      room.status = 'available';
    }
    await room.save();
    
    res.status(200).json({ message: 'Student removed' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};