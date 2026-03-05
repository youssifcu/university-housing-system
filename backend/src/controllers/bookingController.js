const Booking = require('../models/Booking');
const Housing = require('../models/Housing');

/**
 * @desc    Create a new room booking request with Capacity Validation
 * @route   POST /api/bookings
 * @access  Private (Student)
 */
exports.createBooking = async (req, res) => {
    try {
        const { housingId } = req.body;
        const userId = req.user.uid; 

        // 1. Find the room
        const room = await Housing.findById(housingId);
        
        if (!room) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        // 2. Check if there's an empty bed
        if (room.occupiedSeats >= room.capacity || !room.isAvailable) {
            return res.status(400).json({ 
                success: false, 
                message: 'No vacancy! This room is full or manually closed by admin.' 
            });
        }

        // 3. Create the booking request
        const newBooking = new Booking({
            user: userId, // Firebase UID
            housing: housingId,
            status: 'pending'
        });

        await newBooking.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'Booking request sent successfully. Waiting for admin approval.' 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};

/**
 * @desc    Update booking status and manage room residency
 * @route   PUT /api/bookings/status
 * @access  Private (Admin Only)
 */
exports.updateBookingStatus = async (req, res) => {
    try {
        const { bookingId, status } = req.body; // status: 'approved' or 'rejected'
        
        // Find the booking and populate user/housing info
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ success: false, error: 'Booking not found' });
        }

        // If approved, update room occupancy and residents list
        if (status === 'approved' && booking.status !== 'approved') {
            const room = await Housing.findById(booking.housing);
            
            if (room.occupiedSeats >= room.capacity) {
                return res.status(400).json({ success: false, message: 'Room is already full' });
            }

            // Update room data
            room.occupiedSeats += 1;
            room.residents.push(booking.user); // Add user ID to residents array
            
            // Auto-close room if full
            if (room.occupiedSeats >= room.capacity) {
                room.isAvailable = false;
            }
            
            await room.save();
        }

        // Update the booking status itself
        booking.status = status;
        await booking.save();

        res.status(200).json({ 
            success: true, 
            message: `Booking ${status} successfully`, 
            data: booking 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: 'Server Error: Status update failed' });
    }
};

/**
 * @desc    Get all bookings
 * @route   GET /api/bookings
 */
exports.getBookings = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user: req.user.uid };
        const bookings = await Booking.find(filter).populate('user housing');
        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error' });
    }
};