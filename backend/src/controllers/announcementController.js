const Announcement = require('../models/Announcement');

// POST /api/announcements
exports.createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, targetRole } = req.body;

    if (!title || !content) {
      return res.status(400).json({ message: 'title and content are required' });
    }

    const announcement = await Announcement.create({
      title,
      content,
      priority,
      targetRole,
      createdBy: req.user.mongoId
    });

    return res.status(201).json({ id: announcement._id });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to create announcement', error: error.message });
  }
};

// GET /api/announcements
exports.getAllAnnouncements = async (req, res) => {
  try {
    const filter = req.user.role === 'admin'
      ? {}
      : { $or: [{ targetRole: 'all' }, { targetRole: req.user.role }], status: 'active' };

    const announcements = await Announcement.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(
      announcements.map((announcement) => ({
        id: announcement._id,
        title: announcement.title,
        status: announcement.status
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch announcements', error: error.message });
  }
};

// GET /api/announcements/:id
exports.getAnnouncementById = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    if (req.user.role !== 'admin') {
      const canAccess =
        announcement.status === 'active' &&
        (announcement.targetRole === 'all' || announcement.targetRole === req.user.role);
      if (!canAccess) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    return res.status(200).json({
      id: announcement._id,
      title: announcement.title,
      content: announcement.content
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch announcement', error: error.message });
  }
};

// PUT /api/announcements/:id
exports.updateAnnouncement = async (req, res) => {
  try {
    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.status(200).json({ message: 'Announcement updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update announcement', error: error.message });
  }
};

// PATCH /api/announcements/:id/status
exports.updateAnnouncementStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const updated = await Announcement.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update status', error: error.message });
  }
};

// DELETE /api/announcements/:id
exports.deleteAnnouncement = async (req, res) => {
  try {
    const deleted = await Announcement.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    return res.status(200).json({ message: 'Announcement deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete announcement', error: error.message });
  }
};
