const User = require('../models/User');
const admin = require('../config/firebase'); 

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    const { firebaseToken, name, email, phone } = req.body;

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const firebaseUID = decodedToken.uid;

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });
    if (user) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Create new user
    user = new User({
      name,
      email,
      firebaseUID,
      phone,
      role: 'user'
    });

    await user.save();
    res.status(201).json({ message: "User registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  try {
    const { firebaseToken } = req.body;

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const firebaseUID = decodedToken.uid;

    // Find user
    const user = await User.findOne({ firebaseUID });
    if (!user) {
      return res.status(404).json({ message: "User not found. Please register first." });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
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
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Change password
 * @route   PATCH /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    const uid = req.user.uid; 

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long." 
      });
    }

    await admin.auth().updateUser(uid, {
      password: newPassword
    });

    res.status(200).json({ 
      success: true,
      message: "Password updated successfully" 
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to update password", 
      error: error.message 
    });
  }
};

/**
 * @desc    Request a password reset link via email
 * @route   POST /api/auth/forgot-password
 */
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const link = await admin.auth().generatePasswordResetLink(email);

    console.log(`Password reset link for ${email}: ${link}`);

    res.status(200).json({ 
      success: true,
      message: "Reset link sent" 
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

/**
 * @desc    Reset password
 * @route   PATCH /api/auth/reset-password/:token
 */
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long." });
    }

    // Verify the reset token and update password
    const email = await admin.auth().verifyPasswordResetCode(token);
    await admin.auth().confirmPasswordReset(token, newPassword);

    res.status(200).json({ 
      success: true,
      message: "Password reset successfully" 
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Invalid or expired token", error: error.message });
  }
};

