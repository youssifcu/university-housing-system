const User = require('../models/User');

exports.loginUser = async (req, res) => {
  try {
    const { firebaseUID, email, name } = req.body;

    // 1. Check if user already exists
    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // 2. If not, create a new user profile
      user = new User({
        firebaseUID,
        email,
        name
      });
      await user.save();
      return res.status(201).json({ message: "New user created", user });
    }

    // 3. If they exist, just return the user data
    res.status(200).json({ message: "Login successful", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
