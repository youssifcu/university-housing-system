const Notification = require('../models/Notification');

// ================= إنشاء إشعار جديد (Admin/System) =================
exports.createNotification = async (req, res) => {
  try {
    const { title, message, targetUser, targetRole, type } = req.body;

    const notification = new Notification({
      title,
      message,
      targetUser, // لو لواحد معين
      targetRole, // لو لكل الطلاب مثلاً
      type,       // 'info', 'warning', 'meal', 'attendance'
      sender: req.userDoc._id
    });

    await notification.save();

    // إرسال تنبيه لحظي (Socket.io)
    const io = req.app.get('io');
    if (io) {
      // إرسال للكل أو لغرفة معينة (Role-based rooms)
      if (targetUser) {
        io.to(targetUser.toString()).emit('notification:new', notification);
      } else {
        io.emit(`notification:${targetRole}`, notification);
      }
    }

    res.status(201).json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= الحصول على إشعاراتي (للطالب أو المشرف) =================
exports.getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { targetUser: req.userDoc._id },
        { targetRole: req.userDoc.role }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.status(200).json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= تحديد الإشعار كمقروء =================
exports.markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.status(200).json({ success: true, message: "Marked as read" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};