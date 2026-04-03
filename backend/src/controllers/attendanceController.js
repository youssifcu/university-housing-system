const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Building = require('../models/Building');

const canManageAttendance = (role) =>
  role === 'admin' || role === 'floor_supervisor' || role === 'computer_supervisor';

const parseDateOrNull = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// POST /api/attendance
exports.recordAttendance = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { studentId, buildingId, date, status } = req.body;
    const parsedDate = parseDateOrNull(date);

    if (!studentId || !buildingId || !parsedDate || !status) {
      return res.status(400).json({ message: 'studentId, buildingId, date, and status are required' });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const building = await Building.findById(buildingId);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    const attendance = await Attendance.create({
      studentId,
      buildingId,
      date: parsedDate,
      status,
      recordedBy: req.user.mongoId
    });

    return res.status(201).json({ id: attendance._id, status: attendance.status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already recorded for this student/date' });
    }
    return res.status(500).json({ message: 'Failed to record attendance', error: error.message });
  }
};

// POST /api/attendance/scan
exports.scanAttendance = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { qrCode, buildingId } = req.body;
    if (!qrCode || !buildingId) {
      return res.status(400).json({ message: 'qrCode and buildingId are required' });
    }

    const student = await Student.findOne({ qrCode });
    if (!student) {
      return res.status(404).json({ message: 'Student not found for QR code' });
    }

    const building = await Building.findById(buildingId);
    if (!building) return res.status(404).json({ message: 'Building not found' });

    const attendance = await Attendance.create({
      studentId: student._id,
      buildingId,
      date: new Date(),
      status: 'present',
      recordedBy: req.user.mongoId
    });

    return res.status(201).json({ message: 'Attendance recorded', status: attendance.status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Attendance already recorded for this student/date' });
    }
    return res.status(500).json({ message: 'Failed to scan attendance', error: error.message });
  }
};

// GET /api/attendance/student/:id
exports.getAttendanceByStudent = async (req, res) => {
  try {
    const records = await Attendance.find({ studentId: req.params.id }).sort({ date: -1 });
    return res.status(200).json(
      records.map((record) => ({
        id: record._id,
        date: record.date.toISOString().slice(0, 10),
        status: record.status
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch student attendance', error: error.message });
  }
};

// GET /api/attendance/building/:id
exports.getAttendanceByBuilding = async (req, res) => {
  try {
    const records = await Attendance.find({ buildingId: req.params.id }).sort({ date: -1 });
    return res.status(200).json(
      records.map((record) => ({
        studentId: record.studentId,
        date: record.date.toISOString().slice(0, 10),
        status: record.status
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch building attendance', error: error.message });
  }
};

// PATCH /api/attendance/:id
exports.updateAttendance = async (req, res) => {
  try {
    if (!canManageAttendance(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ message: 'status is required' });
    }

    const updated = await Attendance.findByIdAndUpdate(
      req.params.id,
      { $set: { status } },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    return res.status(200).json({ message: 'Attendance updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update attendance', error: error.message });
  }
};
