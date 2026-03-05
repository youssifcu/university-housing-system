const User = require('../models/User');

/**
 * @desc    Delete a user from the database (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Find and delete the user
        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found" 
            });
        }

        res.status(200).json({ 
            success: true, 
            message: "User deleted successfully from the database" 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server Error: Could not delete user",
            error: error.message 
        });
    }
};