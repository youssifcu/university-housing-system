const Report = require('../models/Report');
const { User, Student } = require('../models/User');
const Notification = require('../models/Notification');

// دالة مساعدة للتحقق من صلاحية الإدارة
const canManageReports = (role) => [
  'admin', 
  'floor_admin', 
  'supervisor'
].includes(role);

// ================= تقديم بلاغ/شكوى جديدة (Student Only) =================
exports.createReport = async (req, res) => {
  try {
    const { type, description, severity, imageUrl } = req.body;

    if (!type || !description) {
      return res.status(400).json({ success: false, message: 'Type and description are required' });
    }

    // بما إننا بنستخدم Discriminators، الـ req.userDoc هو الطالب فعلياً
    const studentId = req.userDoc._id;

    const report = await Report.create({
      type, // 'maintenance', 'complaint', 'emergency'
      description,
      severity: severity || 'low',
      imageUrl,
      studentId: studentId,
      reportedBy: studentId,
      status: 'open'
    });

    res.status(201).json({ 
      success: true, 
      id: report._id, 
      status: report.status 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit report', error: error.message });
  }
};

// ================= الحصول على كل البلاغات (Admin & Supervisors Only) =================
exports.getAllReports = async (req, res) => {
  try {
    if (!canManageReports(req.userDoc.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const reports = await Report.find()
      .populate('studentId', 'name studentId assignedRoomId')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports', error: error.message });
  }
};

// ================= تفاصيل بلاغ محدد (Owner or Management) =================
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('studentId', 'name studentId')
      .populate('reportedBy', 'name role');

    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });

    // التأكد من الملكية: لو طالب، لازم يكون هو اللي مقدم البلاغ
    const isOwner = report.studentId._id.toString() === req.userDoc._id.toString();
    const isManagement = canManageReports(req.userDoc.role);

    if (!isOwner && !isManagement) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.status(200).json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch report', error: error.message });
  }
};

// ================= تحديث حالة البلاغ (Admin & Supervisors) =================
exports.updateReportStatus = async (req, res) => {
  try {
    if (!canManageReports(req.userDoc.role)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const { status } = req.body; // 'open', 'in_progress', 'resolved', 'closed'
    if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

    const updated = await Report.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updated) return res.status(404).json({ success: false, message: 'Report not found' });

    // إنشاء إشعار للطالب بتحديث حالة بلاغه
    await Notification.create({
      title: `Update on your ${updated.type} report`,
      message: `The status of your report has been changed to: ${status}`,
      targetUser: updated.studentId,
      targetRole: 'student',
      type: 'info'
    });

    // إرسال تنبيه لحظي عبر Socket.io (لو مفعل)
    const io = req.app.get('io');
    if (io) {
      io.to(updated.studentId.toString()).emit('notification:new', {
        title: "Report Updated",
        status: status
      });
    }

    res.status(200).json({ success: true, message: `Report status updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report', error: error.message });
  }
};

// ================= عرض بلاغاتي (Student Only - Mobile) =================
exports.getMyReports = async (req, res) => {
  try {
    const reports = await Report.find({ studentId: req.userDoc._id })
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};