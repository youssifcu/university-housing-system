const { User, Student } = require('../models/User');
const Application = require('../models/Application');

// ================= التسجيل (الويب - Sprint 1) =================
exports.registerUser = async (req, res) => {
  try {
    const { 
      firebaseUid, email, name, phoneNumber, 
      studentId, nationalId, universityYear, faculty 
    } = req.body;

    // 1. التأكد من عدم وجود المستخدم مسبقاً
    const existingUser = await User.findOne({ $or: [{ email }, { firebaseUid }] });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists with this email or UID" });
    }

    // 2. إنشاء الطالب باستخدام الـ Discriminator (student)
    // لاحظ: الـ housingStatus هتكون 'new_applicant' تلقائياً حسب الموديل بتاعك
    const newStudent = new Student({
      firebaseUid,
      email,
      name,
      phoneNumber,
      role: 'student', // مهمة جداً عشان الـ Discriminator يشتغل
      studentId,
      nationalId,
      universityYear,
      faculty
    });

    await newStudent.save();

    res.status(201).json({
      success: true,
      message: "Registration successful. Please submit your housing application documents.",
      userId: newStudent._id
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= تسجيل الدخول (الموبايل والويب) =================
exports.loginUser = async (req, res) => {
  try {
    const { firebaseUid } = req.body;

    const user = await User.findOne({ firebaseUid });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    // --- منطق الـ Sprint 1: منع الطالب من الدخول لو لسه مخدش Approved ---
    if (user.role === 'student') {
      if (user.housingStatus === 'new_applicant') {
        return res.status(403).json({
          success: false,
          message: "Login denied: Your application is still pending approval from the admin."
        });
      }
      
      if (user.housingStatus === 'banned') {
        return res.status(403).json({ success: false, message: "This account has been banned." });
      }
    }

    // تحديث وقت الدخول
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        role: user.role,
        name: user.name,
        email: user.email,
        housingStatus: user.role === 'student' ? user.housingStatus : undefined
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= عرض البروفايل (الموبايل - Sprint 2) =================
exports.getProfile = async (req, res) => {
  try {
    // req.userDoc بييجي من الـ authMiddleware اللي بيعمل verify للـ token
    const user = await User.findById(req.userDoc._id);
    
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};