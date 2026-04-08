const Student = require('../models/Student');
const QRCode = require('qrcode');

// GET /api/students (Admin only)
exports.getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'name email').populate('roomId', 'roomNumber floorNumber');
    res.status(200).json({ students });
  } catch (error) {
    res.status(500).json({ message: "Error fetching students", error: error.message });
  }
};

// GET /api/students/:id (Admin/Staff)
exports.getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('userId', 'name email').populate('roomId', 'roomNumber floorNumber');
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// GET /api/students/me (Logged-in Student)
exports.getMyProfile = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId }).populate({
      path: 'roomId',
      populate: {
        path: 'buildingId',
        select: 'name supervisorName supervisorPhone'
      }
    });
    if (!student) return res.status(404).json({ message: "Record not found" });

    // Check if leave ended
    if (student.housingStatus === 'suspended') {
      const HousingRequest = require('../models/HousingRequest');
      const leave = await HousingRequest.findOne({
        studentId: student._id,
        type: 'vacate',
        status: 'approved',
        endDate: { $lt: new Date() }
      });
      if (leave) {
        student.housingStatus = 'active';
        await student.save();
      }
    }

    // Calculate weekly meal balance
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const MealBooking = require('../models/MealBooking');
    const mealBalance = await MealBooking.countDocuments({
      studentId: student._id,
      date: { $gte: startOfWeek, $lte: endOfWeek },
      status: 'booked',
      isServed: false
    });

    res.status(200).json({
      student: {
        ...student.toObject(),
        building: student.roomId?.buildingId,
        room: student.roomId,
        mealBalance
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// GET /api/students/me/qr (Logged-in Student)
exports.getMyQRCode = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) return res.status(404).json({ message: "Record not found" });

    const qrCodeDataURL = await student.qrCode;
    res.status(200).json({ qrCode: qrCodeDataURL
      ,status : "accepted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// PATCH /api/students/:id (Admin only)
exports.updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!student) return res.status(404).json({ message: "Student not found" });

    res.status(200).json({ student });
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};

// POST /api/students/me/generate-qr (Logged-in Student)
exports.generateMyQRCode = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) return res.status(200).json({ status : "pending" });

    const qrString = `STU-${student.universityId || student.nationalId || student._id}-${Date.now().toString(36)}-${Math.floor(Math.random() * 100000)}`;
    student.qrCode = qrString;
    await student.save();

    res.status(200).json({ qrCode: student.qrCode });
  } catch (error) {
    res.status(500).json({ message: "Error generating QR", error: error.message });
  }
};

// POST /api/students/validate-qr (Admin or student)
exports.validateQRCode = async (req, res) => {
  try {
    const { qrCode } = req.body;
    const student = await Student.findOne({ qrCode });
    if (!student) return res.status(200).json({ status : "pending" });

    res.status(200).json({ valid: true, studentId: student._id });
  } catch (error) {
    res.status(500).json({ message: 'Error validating QR', error: error.message });
  }
};