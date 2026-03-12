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