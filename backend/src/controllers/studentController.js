const Student = require('../models/Student');

// GET /api/students (Admin only)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().select('fullName faculty roomId');
    const formatted = students.map(s => ({
      id: s._id,
      fullName: s.fullName,
      faculty: s.faculty,
      roomId: s.roomId
    }));
    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
};

// GET /api/students/:id (Admin/Staff)
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({
      id: student._id,
      fullName: student.fullName,
      housingStatus: student.status, // mapping 'status' to 'housingStatus' per image
      roomId: student.roomId
    });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// GET /api/students/me (Logged-in Student)
exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) return res.status(404).json({ message: "Record not found" });

    res.status(200).json({
      id: student._id,
      fullName: student.fullName,
      qrCode: student.qrCode,
      roomId: student.roomId
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/students/me/qr (Logged-in Student QR)
exports.getMyQRCode = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId }).select('qrCode');
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Returns the string stored in DB; frontend can convert this to a QR image
    res.status(200).json({ qrCode: student.qrCode });
  } catch (error) {
    res.status(500).json({ message: "Error fetching QR", error: error.message });
  }
};

// PATCH /api/students/:id (Admin only)
exports.updateStudent = async (req, res) => {
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!updatedStudent) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({ message: "Student updated" });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};