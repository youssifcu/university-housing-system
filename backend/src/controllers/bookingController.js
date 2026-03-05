const Booking = require('../models/Booking');

/**
 * @desc    Create a new room booking request (For Students)
 * @route   POST /api/bookings
 * @access  Private (Authenticated Users)
 */
exports.createBooking = async (req, res) => {
    try {
        const { housingId } = req.body;
        
        // userId is retrieved from the decoded Firebase token in the middleware
        const userId = req.user.uid; 

        const newBooking = new Booking({
            user: userId,
            housing: housingId,
            status: 'pending' // Default status for new requests
        });

        await newBooking.save();
        res.status(201).json({ 
            success: true, 
            message: 'Booking request sent successfully. Waiting for admin approval.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Unable to process booking request' 
        });
    }
};

/**
 * @desc    Update booking status (For Admins)
 * @route   PUT /api/bookings/status
 * @access  Private (Admin Only)
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body; // status can be 'approved' or 'rejected'
        
        // Update the booking document in MongoDB
        const updatedBooking = await Booking.findByIdAndUpdate(
            bookingId, 
            { status: status }, 
            { new: true }
        ).populate('user housing');

        if (!updatedBooking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        res.status(200).json({ 
            success: true, 
            message: `Booking status updated to ${status}`, 
            data: updatedBooking 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: 'Server Error: Failed to update status' 
        });
    }
};

/**
 * @desc    Get all bookings (Admin sees all, User sees their own)
 * @route   GET /api/bookings
 * @access  Private
 */
exports.getBookings = async (req, res) => {
    try {
        // Simple logic: If admin, find all. If user, find by user ID.
        const filter = req.user.role === 'admin' ? {} : { user: req.user.uid };
        
        const bookings = await Booking.find(filter)
            .populate('user')
            .populate('housing');
            
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Fetching bookings failed' });
    }
};