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