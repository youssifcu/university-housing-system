/**
 * @desc    Get rooms list (Filtered by Role and Availability)
 * @route   GET /api/housing
 * @access  Private (Student/Admin)
 */
exports.getAllRooms = async (req, res) => {
    try {
        // Check admin privileges through the role stored in req.user
        const isAdmin = req.user && req.user.role === 'admin';

        let rooms;
        if (isAdmin) {
            // Admin sees all rooms and can populate residents for more details if needed
            rooms = await Housing.find().populate('residents', 'name email'); 
        } else {
            // Students only see available rooms (isAvailable: true)
            // Fields include 'capacity' and 'occupiedSeats' instead of 'type'
            rooms = await Housing.find({ isAvailable: true })
                .select('roomNumber capacity occupiedSeats price description isAvailable');
        }

        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Fetching rooms failed' });
    }
};

/**
 * @desc    Update room details (Admin only - supports manual room closure/opening)
 * @route   PUT /api/housing/:id
 * @access  Private (Admin Only)
 */
exports.updateRoom = async (req, res) => {
    try {
        // Admin can send { isAvailable: false } in the body to manually close
        // a room even if it has empty seats.
        const updatedRoom = await Housing.findByIdAndUpdate(
            req.params.id, 
            req.body, 
            { new: true }
        );

        if (!updatedRoom) {
            return res.status(404).json({ success: false, error: 'Room not found' });
        }

        res.status(200).json({ 
            success: true, 
            message: 'Room updated successfully', 
            data: updatedRoom 
        });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update room' });
    }
};