const User = require('../models/User');

/**
 * @desc    Login user by verifying their Firebase UID in the database
 * @route   POST /api/auth/login
 */
exports.loginUser = async (req, res) => {
  try {
    const { firebaseUID } = req.body;

    // Search for the user in the database
    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // If user is not found, reject the login instead of creating a new record
      return res.status(404).json({ 
        message: "This account does not exist. Please register first." 
      });
    }

    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Register a new user using Firebase token data and additional body info
 * @route   POST /api/auth/register
 */
exports.registerUser = async (req, res) => {
  try {
    // Data extracted from the verified Firebase token (100% Secure)
    const { uid, email, name } = req.user; 
    // Additional data from the request body
    const { universityID, phoneNumber, faculty } = req.body;

    // Check if the user is already registered in our database
    let user = await User.findOne({ firebaseUID: uid });
    if (user) {
      return res.status(400).json({ message: "You are already registered in the system" });
    }

    // Create and save the new user record
    user = new User({
      firebaseUID: uid,
      email,
      name,
      universityID,
      phoneNumber,
      faculty
    });

    await user.save();
    res.status(201).json({ message: "Account created successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/profile
 */
exports.getProfile = async (req, res) => {
  try {
    // req.user.mongoId was attached by the verifyFirebaseToken middleware
    const user = await User.findById(req.user.mongoId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.roles, // Ensure this matches 'roles' in your schema
        phoneNumber: user.phone,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// Make sure this matches your project's path to the firebase config
const admin = require('../config/firebase'); 
const User = require('../models/User');

// ... (loginUser, registerUser, getProfile go here)

/**
 * @desc    Change current user password
 * @route   PATCH /api/auth/password
 */
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    
    // This 'uid' comes from the decoded Firebase token in your middleware
    const uid = req.user.uid; 

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long." 
      });
    }

    // This updates the password directly in Firebase Authentication
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

    // Generate the reset link via Firebase Admin
    // Note: In a production app, you'd send this link via an email service (NodeMailer/SendGrid)
    const link = await admin.auth().generatePasswordResetLink(email);

    // For now, we return success. In a real scenario, you'd send the 'link' to the user's email.
    console.log(`Password reset link for ${email}: ${link}`);

    res.status(200).json({ 
      success: true,
      message: "Reset link sent" 
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    // We often return 200 even if email doesn't exist for security (preventing email harvesting)
    res.status(500).json({ message: "Error processing request", error: error.message });
  }
};

