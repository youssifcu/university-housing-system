const Booking = require('../models/Booking');
const User = require('../models/User');

// create new booking for logged in user
exports.createBooking = async (req, res) => {
  try {
    const { housing, startDate, endDate } = req.body;
    const userRecord = await User.findOne({ firebaseUID: req.user.uid });
    if (!userRecord) {
      return res.status(404).json({ message: 'User not found' });
    }

    const booking = new Booking({
      user: userRecord._id,
      housing,
      startDate,
      endDate
    });

    await booking.save();
    res.status(201).json({ message: 'Booking created', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get all bookings (own for students, all for admin)
exports.getAllBookings = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      const user = await User.findOne({ firebaseUID: req.user.uid });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      query.user = user._id;
    }
    const bookings = await Booking.find(query).populate('housing user');
    res.status(200).json({ message: 'Bookings fetched', data: bookings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get single booking by id
exports.getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('housing user');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // if not admin, ensure it belongs to current user
    if (req.user.role !== 'admin') {
      const user = await User.findOne({ firebaseUID: req.user.uid });
      if (!user || booking.user._id.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    res.status(200).json({ message: 'Booking retrieved', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// update booking
exports.updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role !== 'admin') {
      const user = await User.findOne({ firebaseUID: req.user.uid });
      if (!user || booking.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    Object.assign(booking, req.body);
    await booking.save();
    res.status(200).json({ message: 'Booking updated', data: booking });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// delete/cancel booking
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role !== 'admin') {
      const user = await User.findOne({ firebaseUID: req.user.uid });
      if (!user || booking.user.toString() !== user._id.toString()) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    await booking.remove();
    res.status(200).json({ message: 'Booking deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
