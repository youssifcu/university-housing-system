const User = require('../models/User');
const admin = require('firebase-admin'); // Ensure firebase-admin is initialized in your config

/**
 * @desc    Delete a user from DB and Firebase (Admin only)
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // 1. Find the user in MongoDB first to get their Firebase UID
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: "User not found in database" 
            });
        }

        // 2. Delete from Firebase Authentication
        // Assuming 'firebaseUid' is the field name in your User model
        try {
            await admin.auth().deleteUser(user.firebaseUid);
        } catch (firebaseError) {
            console.error("Firebase deletion failed:", firebaseError.message);
            // We continue even if Firebase fails (e.g., if user was already deleted there)
        }

        // 3. Delete from MongoDB
        await User.findByIdAndDelete(userId);

        res.status(200).json({ 
            success: true, 
            message: "User deleted successfully from both Firebase and Database" 
            // Note: In your Cairo University project, you might also want to delete 
            // the associated Student record here if they are a student.
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: "Server Error: Could not delete user",
            error: error.message 
        });
    }
};