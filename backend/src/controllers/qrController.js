const QRCode = require('qrcode');
const { Student, User } = require('../models/User');
const Attendance = require('../models/Attendance');
const crypto = require('crypto');

// تأكد من وجود موديل MealRecord لوحده أو استخدم Attendance بـ Type مختلف
const MealRecord = require('../models/Attendance'); 

exports.generateStudentQRCodes = async (req, res) => {
  try {
    const studentId = req.userDoc._id;
    const student = await Student.findById(studentId);

    if (!student) return res.status(404).json({ message: 'Student not found' });

    const attendanceCode = crypto.randomBytes(16).toString('hex');
    const mealCode = crypto.randomBytes(16).toString('hex');

    const attendanceQR = await QRCode.toDataURL(attendanceCode);
    const mealQR = await QRCode.toDataURL(mealCode);

    student.qrCode = {
      attendanceCode,
      attendanceQR,
      mealCode,
      mealQR
    };

    await student.save();

    res.status(200).json({
      message: 'QR codes generated successfully',
      qrCodes: {
        attendance: { code: attendanceCode, qrImage: attendanceQR },
        meal: { code: mealCode, qrImage: mealQR }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate QR codes', error: error.message });
  }
};

exports.getStudentQRCodes = async (req, res) => {
  try {
    const studentId = req.userDoc._id;
    const student = await Student.findById(studentId);

    if (!student || !student.qrCode || !student.qrCode.attendanceCode) {
      return res.status(404).json({ message: 'QR codes not found. Generate them first.' });
    }

    res.status(200).json({
      qrCodes: {
        attendance: { code: student.qrCode.attendanceCode, qrImage: student.qrCode.attendanceQR },
        meal: { code: student.qrCode.mealCode, qrImage: student.qrCode.mealQR }
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch QR codes', error: error.message });
  }
};

exports.recordAttendance = async (req, res) => {
  try {
    const { qrCode, attendanceType } = req.body;
    const supervisorId = req.userDoc._id;

    const student = await Student.findOne({ 'qrCode.attendanceCode': qrCode });
    if (!student) return res.status(404).json({ message: 'Invalid QR code or student not found' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isOnLeave = student.leaveStatus && student.leaveStatus.isOnLeave &&
      new Date(student.leaveStatus.leaveStartDate) <= today &&
      new Date(student.leaveStatus.leaveEndDate) >= today;

    const attendance = new Attendance({
      studentId: student._id,
      recordedBy: supervisorId,
      attendanceType,
      scannedQRCode: qrCode,
      status: isOnLeave ? 'excused' : 'present',
      date: today,
      wasOnLeave: isOnLeave
    });

    await attendance.save();

    res.status(201).json({
      message: 'Attendance recorded',
      attendance: { studentName: student.name, status: attendance.status }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
};

exports.recordMeal = async (req, res) => {
  try {
    const { qrCode, mealType } = req.body;
    const mealAdminId = req.userDoc._id;

    const student = await Student.findOne({ 'qrCode.mealCode': qrCode });
    if (!student) return res.status(404).json({ message: 'Invalid QR code' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const isOnLeave = student.leaveStatus && student.leaveStatus.isOnLeave &&
      new Date(student.leaveStatus.leaveStartDate) <= today &&
      new Date(student.leaveStatus.leaveEndDate) >= today;

    if (isOnLeave) {
      return res.status(403).json({ message: 'Student is on leave. Meal denied.' });
    }

    const mealRecord = new Attendance({
      studentId: student._id,
      recordedBy: mealAdminId,
      attendanceType: 'meal',
      scannedQRCode: qrCode,
      status: 'present',
      date: today
    });

    await mealRecord.save();

    await User.findByIdAndUpdate(mealAdminId, { $inc: { todaysMealCount: 1 } });

    res.status(201).json({
      message: 'Meal recorded',
      meal: { studentName: student.name, mealType }
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to record meal', error: error.message });
  }
};