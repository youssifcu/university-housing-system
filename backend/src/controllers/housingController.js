const Room = require('../models/Room'); // Using the Room model we created
const Student = require('../models/Student');

/**
 * @desc    Get rooms list (Filtered by Role and Availability)
 * @route   GET /api/housing
 * @access  Private (Student/Admin)
 */
exports.getAllRooms = async (req, res) => {
  try {
    const isAdmin = req.user && req.user.role === 'admin';

    let rooms;
    if (isAdmin) {
      // Admins see everything + the building details + the names of students inside
      rooms = await Room.find()
        .populate('buildingId', 'name buildingNumber')
        .populate('students', 'fullName email'); 
    } else {
      // Students only see rooms that have at least one empty bed
      // and haven't been manually disabled by an admin
      rooms = await Room.find({ 
        isAvailable: true,
        $expr: { $lt: ["$occupiedSlots", "$capacity"] } 
      })
      .select('roomNumber capacity occupiedSlots buildingId')
      .populate('buildingId', 'name');
    }

    res.status(200).json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error: Fetching rooms failed' });
  }
};

/**
 * @desc    Update room details (Admin only)
 * @route   PUT /api/housing/:id
 * @access  Private (Admin Only)
 */
exports.updateRoom = async (req, res) => {
  try {
    // If an admin updates capacity, we should check if it's now full
    const updateData = req.body;
    
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!updatedRoom) {
      return res.status(404).json({ success: false, error: 'Room not found' });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Room updated successfully', 
      data: updatedRoom 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to update room' });
  }
};

/**
 * @desc    Assign a student to a room
 * @route   POST /api/housing/assign
 * @access  Private (Admin Only)
 */
exports.assignStudent = async (req, res) => {
    try {
        const { studentId, roomId } = req.body;

        // 1. Fetch the room and student
        const room = await Room.findById(roomId);
        const student = await Student.findById(studentId);

        if (!room) return res.status(404).json({ message: "Room not found" });
        if (!student) return res.status(404).json({ message: "Student not found" });

        // 2. Check if the room is already full
        if (room.occupiedSlots >= room.capacity) {
            return res.status(400).json({ message: "Room is already at full capacity" });
        }

        // 3. Check if student is already assigned somewhere else
        if (student.roomId) {
            return res.status(400).json({ message: "Student is already assigned to a room" });
        }

        // 4. Update the Room record
        room.students.push(studentId);
        room.occupiedSlots += 1;
        
        // If the room just reached capacity, mark as unavailable
        if (room.occupiedSlots === room.capacity) {
            room.isAvailable = false;
        }

        // 5. Update the Student record
        student.roomId = roomId;
        student.roomStatus = 'resident'; // Assuming this field exists in your Student model

        // Save both (In production, you'd use a Mongoose Transaction here)
        await room.save();
        await student.save();

        res.status(200).json({
            success: true,
            message: `Student ${student.fullName} assigned to Room ${room.roomNumber}`,
            data: { room, student }
        });

    } catch (error) {
        console.error("Assignment Error:", error);
        res.status(500).json({ success: false, error: 'Assignment failed' });
    }
};