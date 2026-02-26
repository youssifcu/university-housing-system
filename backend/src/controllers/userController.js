const User = require('../models/User');
const Booking = require('../models/Booking');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Profile retrieved', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findOneAndUpdate(
      { firebaseUID: req.user.uid },
      updates,
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'Profile updated', data: user });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const user = await User.findOne({ firebaseUID: req.user.uid });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const bookings = await Booking.find({ user: user._id }).populate('housing');
    res.status(200).json({ message: 'Bookings retrieved', data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
