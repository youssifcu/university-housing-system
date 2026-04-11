const QRCode = require('qrcode');
const { User } = require('../models/User');
const crypto = require('crypto');

// ================= توليد أكواد QR جديدة (للطالب) =================
exports.generateStudentQRCodes = async (req, res) => {
  try {
    const studentId = req.userDoc._id;

    // توليد سترينج عشوائي فريد
    const attendanceCode = crypto.randomBytes(16).toString('hex');
    const mealCode = crypto.randomBytes(16).toString('hex');

    // توليد الصور Base64
    const attendanceQR = await QRCode.toDataURL(attendanceCode);
    const mealQR = await QRCode.toDataURL(mealCode);

    // تحديث الطالب (لاحظ إننا بنحدث الـ User Model لأن الطالب جزء منه)
    await User.findByIdAndUpdate(studentId, {
      "qrCode.attendanceCode": attendanceCode,
      "qrCode.attendanceQR": attendanceQR, // تأكد إنك ضفت الحقل ده في الموديل لو محتاجه
      "qrCode.mealCode": mealCode,
      "qrCode.mealQR": mealQR
    });

    res.status(200).json({
      success: true,
      qrCodes: {
        attendance: { code: attendanceCode, qrImage: attendanceQR },
        meal: { code: mealCode, qrImage: mealQR }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= الحصول على الأكواد الحالية =================
exports.getStudentQRCodes = async (req, res) => {
  try {
    const student = await User.findById(req.userDoc._id);

    if (!student || !student.qrCode || !student.qrCode.attendanceCode) {
      return res.status(404).json({ message: 'QR codes not found. Please generate them first.' });
    }

    res.status(200).json({
      success: true,
      qrCodes: student.qrCode
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};