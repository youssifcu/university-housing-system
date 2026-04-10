const { User, Student, ComputerAdmin, FloorAdmin, MealAdmin, SupervisorAdmin } = require('../models/User');
const admin = require('../config/firebase');

/**
 * @desc    Register a new user (Default as Student)
 * @route   POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    const { name, phoneNumber, profilePicture, uid, email, studentId, universityYear, faculty } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ firebaseUid: uid }, { email: email.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists in the system" 
      });
    }

    const user = new Student({
      firebaseUid: uid,
      email: email.toLowerCase(),
      name: name,
      phoneNumber: phoneNumber,
      profilePicture: profilePicture || '',
      role: 'student',
      studentId: studentId || `STU-${Date.now()}`,
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
    const { firebaseUID } = req.body;

    const user = await User.findOne({ firebaseUid: firebaseUID });

    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: "This account does not exist. Please register first." 
      });
    }

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
 * @route   PATCH /api/auth/password
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
 * @desc    Forgot Password - Send reset link
 * @route   POST /api/auth/forgot-password
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

/**
 * @desc    Reset password using token from email link
 * @route   PATCH /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: "Password must be at least 6 characters." 
      });
    }

    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:resetPassword?key=${process.env.FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        oobCode: token,
        newPassword: newPassword
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(400).json({
        success: false,
        message: data.error?.message || "Invalid or expired reset token"
      });
    }

    res.status(200).json({
      success: true,
      message: "Password has been reset successfully"
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during password reset",
      error: error.message 
    });
  }
};

/**
 * @desc    Register a new admin (ComputerAdmin, FloorAdmin, MealAdmin, SupervisorAdmin)
 * @route   POST /api/auth/register-admin
 * @access  Private (Admin only)
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { email, password, name, phoneNumber, profilePicture, role, ...roleSpecificData } = req.body;

    const allowedRoles = ['computer_admin', 'floor_admin', 'meal_admin', 'supervisor_admin'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid admin role" });
    }

    // Check if user already exists in MongoDB
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    // Create user in Firebase Authentication
    let firebaseUser;
    try {
      firebaseUser = await admin.auth().createUser({
        email: email.toLowerCase(),
        password: password,
        displayName: name,
      });
    } catch (firebaseError) {
      return res.status(400).json({ success: false, message: firebaseError.message });
    }

    // Create admin user in MongoDB based on role
    let adminUser;
    const baseData = {
      firebaseUid: firebaseUser.uid,
      email: email.toLowerCase(),
      name,
      phoneNumber,
      profilePicture: profilePicture || '',
      role: role,
    };

    switch (role) {
      case 'computer_admin':
        adminUser = new ComputerAdmin({
          ...baseData,
          computerLabId: roleSpecificData.computerLabId,
        });
        break;
      case 'floor_admin':
        adminUser = new FloorAdmin({
          ...baseData,
          floorNumber: roleSpecificData.floorNumber,
          buildingName: roleSpecificData.buildingName,
        });
        break;
      case 'meal_admin':
        adminUser = new MealAdmin({
          ...baseData,
          mealType: roleSpecificData.mealType,
        });
        break;
      case 'supervisor_admin':
        adminUser = new SupervisorAdmin({
          ...baseData,
          supervisorDepartment: roleSpecificData.supervisorDepartment,
        });
        break;
      default:
        return res.status(400).json({ success: false, message: "Invalid role" });
    }

    await adminUser.save();

    res.status(201).json({
      success: true,
      message: `${role} created successfully`,
      user: adminUser
    });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};