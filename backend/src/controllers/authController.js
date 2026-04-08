const User = require('../models/User');
const admin = require('../config/firebase'); 

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

    const { name, phoneNumber, profilePicture ,uid, email } = req.body;

    const existingUser = await User.findOne({ 
      $or: [{ firebaseUID: uid }, { email: email.toLowerCase() }] 
    });

    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists in the system" 
      });
    }

    const user = new User({
      name: name,
      profilePicture: profilePicture,
      email: email.toLowerCase(),
      firebaseUID: uid,
      phone: phoneNumber,
      roles: 'student',
      status: 'active'
    });

    await user.save();

    res.status(201).json({ 
      success: true,
      message: "User registered successfully on server", 
      user 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: "Registration failed on server", 
      error: error.message 
    });
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
        role: user.roles, 
        phoneNumber: user.phone,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};



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


exports.updateProfile = async (req, res) => {
  try {
    const { firebaseUID, name, email, profilePicture } = req.body;

    if (!firebaseUID) {
      return res.status(400).json({ success: false, message: "firebaseUID is required" });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (profilePicture) updateData.profilePicture = profilePicture;


    const user = await User.findOneAndUpdate(
      { firebaseUID: firebaseUID },
      { $set: updateData },
      { 
        returnDocument: 'after', 
        runValidators: true 
      }
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

/**
 * @desc    Register a new admin user (Admin only)
 * @route   POST /api/auth/register-admin
 * @access  Private (Admin)
 */
exports.registerAdmin = async (req, res) => {
  try {
    const { firebaseToken, name, email, phone, role } = req.body;

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(firebaseToken);
    const firebaseUID = decodedToken.uid;

    // Check if user already exists
    let user = await User.findOne({ firebaseUID });
    if (user) {
      return res.status(400).json({ message: "User already registered" });
    }

    // Validate role
    const validRoles = ['admin', 'student', 'restaurant_supervisor', 'floor_supervisor', 'computer_supervisor'];
    const assignedRole = validRoles.includes(role) ? role : 'user';

    // Create new user with specified role
    user = new User({
      name,
      email,
      firebaseUID,
      phone,
      role: assignedRole
    });

    await user.save();
    res.status(201).json({ message: "Admin user registered successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Admin registration failed", error: error.message });
  }
};


