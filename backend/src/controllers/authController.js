const { User, Student, ComputerAdmin, FloorAdmin, MealAdmin, SupervisorAdmin } = require('../models/User');
const admin = require('../config/firebase');

/**
 * @desc    Register a new user (Default as Student)
 * @route   POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, profilePicture, uid, email, studentId, universityYear, faculty } = req.body;

    // 1. التأكد من عدم وجود المستخدم مسبقاً
    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists in the system" 
      });
    }

    // 2. إنشاء مستخدم جديد (Student بصفتها الـ Role الافتراضي)
    // ملاحظة: studentId إجباري في الـ Schema الخاصة بك
    const user = new Student({
      firebaseUid: uid,
      email: email.toLowerCase(),
      name: name,
      phoneNumber: phoneNumber,
      profilePicture: profilePicture || '',
      role: 'student', // القيمة المفتاحية للـ discriminator
      studentId: studentId || `STU-${Date.now()}`, // توليد ID مؤقت لو لم يرسل
      universityYear: universityYear || 1,
      faculty: faculty || ''
    });

    await user.save();

    res.status(201).json({ 
      success: true,
      message: "User registered successfully on server", 
      user 
    });
  } catch (error) {
    console.error("Registration Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Registration failed on server", 
      error: error.message 
    });
  }
};

/**
 * @desc    Login user by verifying their Firebase UID
 * @route   POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  try {
    const { firebaseUID } = req.body; // تأكد أن الاسم مطابق لما يرسله الفرونت إند

    // البحث عن المستخدم باستخدام firebaseUid (مطابق للـ Schema)
    const user = await User.findOne({ firebaseUid: firebaseUID });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "This account does not exist. Please register first." 
      });
    }

    // تحديث تاريخ آخر تسجيل دخول
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: "Login successful", 
      user 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    // req.user.mongoId يجب أن يتم تمريره من الـ middleware الخاص بالتوكن
    const user = await User.findById(req.user.mongoId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Update profile data
 * @route   PATCH /api/auth/profile
 */
exports.updateProfile = async (req, res) => {
  try {
    const { firebaseUID, name, email, profilePicture, phoneNumber } = req.body;

    if (!firebaseUID) {
      return res.status(400).json({ success: false, message: "firebaseUID is required" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;

    const user = await User.findOneAndUpdate(
      { firebaseUid: firebaseUID },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Change Password via Firebase Admin
 */
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const uid = req.user.uid; 

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    await admin.auth().updateUser(uid, { password: newPassword });

    res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Forgot Password - Send link
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const link = await admin.auth().generatePasswordResetLink(email);
    console.log(`Reset link: ${link}`);

    res.status(200).json({ success: true, message: "Reset link generated" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
