/**
 * @desc    Get rooms list (Public/Student sees basics, Admin sees details)
 * @route   GET /api/housing
 */
exports.getAllRooms = async (req, res) => {
    try {
        // req.user logic depends on if they are logged in or not
        const isAdmin = req.user && req.user.role === 'admin';

        let rooms;
        if (isAdmin) {
            // Admin sees EVERYTHING including who is in the room
            rooms = await Housing.find().populate('currentTenant', 'name email');
        } else {
            // Students only see room number, type, price, and availability
            // They DON'T see 'currentTenant' or other private data
            rooms = await Housing.find({ isAvailable: true }).select('roomNumber type price description isAvailable');
        }

        res.status(200).json({ success: true, data: rooms });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error: Fetching rooms failed' });
    }
};

/**
 * @desc    Update room details (Admin only)
 * @route   PUT /api/housing/:id
 */
exports.updateRoom = async (req, res) => {
    try {
        const updatedRoom = await Housing.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json({ success: true, data: updatedRoom });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Failed to update room' });
    }
};