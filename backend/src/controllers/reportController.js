const Report = require('../models/Report');
const Student = require('../models/Student');

const canManageReports = (role) =>
  role === 'admin' || role === 'floor_supervisor' || role === 'computer_supervisor' || role === 'restaurant_supervisor';

// POST /api/reports
exports.createReport = async (req, res) => {
  try {
    const { type, description, severity, imageUrl } = req.body;

    if (!type || !description) {
      return res.status(400).json({ message: 'type and description are required' });
    }

    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const report = await Report.create({
      type,
      description,
      severity,
      imageUrl,
      studentId: student._id,
      reportedBy: req.user.mongoId,
      status: 'open'
    });

    return res.status(201).json({ id: report._id, status: report.status });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to submit report', error: error.message });
  }
};

// GET /api/reports
exports.getAllReports = async (req, res) => {
  try {
    if (!canManageReports(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const reports = await Report.find().sort({ createdAt: -1 });
    return res.status(200).json(
      reports.map((report) => ({
        id: report._id,
        type: report.type,
        severity: report.severity,
        status: report.status
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reports', error: error.message });
  }
};

// GET /api/reports/:id
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (canManageReports(req.user.role)) {
      return res.status(200).json({
        id: report._id,
        description: report.description,
        status: report.status
      });
    }

    const student = await Student.findOne({ userId: req.user.mongoId });
    const isOwner = student && report.studentId.toString() === student._id.toString();
    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.status(200).json({
      id: report._id,
      description: report.description,
      status: report.status
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch report', error: error.message });
  }
};

// PATCH /api/reports/:id/status
exports.updateReportStatus = async (req, res) => {
  try {
    if (!canManageReports(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Save notification record
    const Notification = require('../models/Notification');
    await Notification.create({
      title: `Report status updated to ${status}`,
      message: `Your maintenance report has been updated to ${status}`,
      targetUser: updated.studentId,
      targetRole: 'student',
      type: 'system'
    });

    // Emit Socket.io event
    const io = req.app.get('io');
    if (io) {
      io.emit('notification:new', {
        targetUser: updated.studentId,
        targetRole: 'student',
        type: 'system',
        reportId: updated._id,
        status
      });
    }

    return res.status(200).json({ message: 'Report status updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update report status', error: error.message });
  }
};

// DELETE /api/reports/:id
exports.deleteReport = async (req, res) => {
  try {
    if (!canManageReports(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deleted = await Report.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Report not found' });
    }

    return res.status(200).json({ message: 'Report deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete report', error: error.message });
  }
};
