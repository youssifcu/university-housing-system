const Notification = require('../models/Notification');

/**
 * @desc    Create notification
 * @route   POST /api/notifications
 */
exports.createNotification = async (req, res) => {
  try {
    const { title, message, targetUser, targetRole, type } = req.body;

    const notification = new Notification({
      title,
      message,
      targetUser,
      targetRole,
      type
    });

    await notification.save();

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('notification:new', { notificationId: notification._id, targetRole, targetUser });
    }

    res.status(201).json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};