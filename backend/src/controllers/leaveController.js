const { Student } = require('../models/User');
const StudentRequest = require('../models/StudentRequest');
const Attendance = require('../models/Attendance');

exports.requestLeave = async (req, res) => {
  try {
    const { leaveStartDate, leaveEndDate, leaveReason } = req.body;
    const studentId = req.userDoc._id;

    const start = new Date(leaveStartDate);
    const end = new Date(leaveEndDate);

    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leaveRequest = new StudentRequest({
      studentId,
      requestType: 'leave_request',
      title: `Leave Request: ${leaveStartDate} to ${leaveEndDate}`,
      description: leaveReason,
      requestedAdminRole: 'supervisor',
      priority: 'high',
      status: 'submitted'
    });

    await leaveRequest.save();
    res.status(201).json({ message: 'Leave request submitted', requestId: leaveRequest._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to request leave', error: error.message });
  }
};

exports.approveLeave = async (req, res) => {
  try {
    const { requestId } = req.params;
    const supervisorId = req.userDoc._id;

    const leaveRequest = await StudentRequest.findById(requestId);
    if (!leaveRequest) return res.status(404).json({ message: 'Leave request not found' });

    const titleMatch = leaveRequest.title.match(/(\d{4}-\d{2}-\d{2}) to (\d{4}-\d{2}-\d{2})/);
    if (!titleMatch) return res.status(400).json({ message: 'Could not parse dates' });

    const startDate = new Date(titleMatch[1]);
    const endDate = new Date(titleMatch[2]);

    const student = await Student.findByIdAndUpdate(
      leaveRequest.studentId,
      {
        $set: {
          'leaveStatus.isOnLeave': true,
          'leaveStatus.leaveStartDate': startDate,
          'leaveStatus.leaveEndDate': endDate,
          'leaveStatus.approvedBy': supervisorId
        }
      },
      { new: true }
    );

    leaveRequest.status = 'approved';
    leaveRequest.reviewedBy = supervisorId;
    leaveRequest.reviewedAt = new Date();
    await leaveRequest.save();

    res.status(200).json({ message: 'Leave approved', studentName: student.name });
  } catch (error) {
    res.status(500).json({ message: 'Failed to approve leave', error: error.message });
  }
};

exports.endLeave = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findByIdAndUpdate(
      studentId,
      {
        $set: {
          'leaveStatus.isOnLeave': false,
          'leaveStatus.leaveStartDate': null,
          'leaveStatus.leaveEndDate': null,
          'leaveStatus.leaveReason': '',
          'leaveStatus.approvedBy': null
        }
      },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    return res.status(200).json({
      message: 'Leave ended successfully',
      studentId: student._id
    });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to end leave', error: error.message });
  }
};

exports.getAttendanceReport = async (req, res) => {
  try {
    const studentId = req.params.studentId || req.userDoc._id; // لو طالب بيشوف لنفسه
    const { startDate, endDate } = req.query;

    const query = { studentId };
    if (startDate && endDate) {
      query.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      absent: records.filter(r => r.status === 'absent').length,
      excused: records.filter(r => r.status === 'excused').length
    };

    res.status(200).json({ summary, records });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching report', error: error.message });
  }
};