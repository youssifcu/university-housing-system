const Attendance = require('../models/Attendance');
const { User } = require('../models/User');

// ================= تسجيل الحضور بالـ QR (للمشرف) =================
exports.scanAttendance = async (req, res) => {
  try {
    const { qrCodeString, buildingId } = req.body;

    // 1. البحث عن الطالب بكود الحضور
    const student = await User.findOne({ "qrCode.attendanceCode": qrCodeString, role: 'student' });
    if (!student) return res.status(404).json({ success: false, message: "Invalid QR Code" });

    // 2. التحقق من حالة الإجازة (حسب الـ Enum في الموديل بتاعك 'suspended')
    if (student.housingStatus === 'suspended') {
      return res.status(200).json({ 
        success: true, 
        message: "Student is on approved leave. Attendance not required.",
        onLeave: true 
      });
    }

    // 3. منع التكرار في نفس اليوم
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(); end.setHours(23,59,59,999);

    const existingRecord = await Attendance.findOne({
      studentId: student._id,
      date: { $gte: start, $lte: end }
    });

    if (existingRecord) return res.status(400).json({ success: false, message: "Attendance already recorded today" });

    // 4. تسجيل الحضور
    const attendance = await Attendance.create({
      studentId: student._id,
      buildingId: buildingId || student.assignedRoomId, // الأفضل يتبعت من الموبايل بتاع المشرف
      date: new Date(),
      status: 'present',
      recordedBy: req.userDoc._id
    });

    res.status(201).json({ 
      success: true, 
      message: `Attendance recorded for ${student.name}`,
      studentDetails: { name: student.name, studentId: student.studentId }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= عرض سجل حضوري (للطالب) =================
exports.getMyAttendance = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.userDoc._id }).sort({ date: -1 });
    res.status(200).json({ success: true, records });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};