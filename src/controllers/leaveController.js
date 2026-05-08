const mongoose = require('mongoose');
const { User } = require('../models/User');
const StudentRequest = require('../models/StudentRequest');
const Attendance = require('../models/Attendance');

// ==========================================
// Helpers 
// ==========================================
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data })
    });
};

const sendError = (res, statusCode, message, errorDetails = null) => {
    const response = { success: false, message };
    if (errorDetails && process.env.NODE_ENV === 'development') {
        response.error = errorDetails;
    }
    return res.status(statusCode).json(response);
};

// ==========================================
// POST /api/students/leave (Student)
// ==========================================
exports.requestLeave = async (req, res) => {
    try {
        const { leaveStartDate, leaveEndDate, leaveReason } = req.body;
        const studentId = req.userDoc._id;

        if (!leaveStartDate || !leaveEndDate) {
            return sendError(res, 400, 'Start date and end date are required');
        }
        if (!leaveReason || leaveReason.trim().length === 0) {
            return sendError(res, 400, 'Leave reason is required');
        }

        const start = new Date(leaveStartDate);
        const end = new Date(leaveEndDate);

        if (isNaN(start) || isNaN(end)) {
            return sendError(res, 400, 'Invalid date format');
        }
        if (start >= end) {
            return sendError(res, 400, 'End date must be after start date');
        }

        const existingRequest = await StudentRequest.findOne({
            studentId,
            requestType: 'leave_request',
            status: { $in: ['submitted', 'in_review'] }
        }).select('_id').lean();

        if (existingRequest) {
            return sendError(res, 400, 'You already have a pending leave request');
        }

        const leaveRequest = new StudentRequest({
            studentId,
            requestType: 'leave_request',
            title: `Leave Request: ${leaveStartDate} to ${leaveEndDate}`,
            description: leaveReason.trim(),
            requestedAdminRole: 'supervisor',
            priority: 'high',
            status: 'submitted',
            startDate: start,
            endDate: end
        });

        await leaveRequest.save();

        return sendSuccess(res, 201, 'Leave request submitted successfully', {
            requestId: leaveRequest._id
        });

    } catch (error) {
        console.error('Request Leave Error:', error);
        return sendError(res, 500, 'Failed to request leave', error.message);
    }
};

// ==========================================
// PATCH /api/students/leave/:requestId/approve (Admin)
// ==========================================
exports.approveLeave = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { requestId } = req.params;
        const supervisorId = req.userDoc._id;

        if (!mongoose.Types.ObjectId.isValid(requestId)) {
            return sendError(res, 400, 'Invalid request ID format');
        }

        const leaveRequest = await StudentRequest.findById(requestId).session(session);
        if (!leaveRequest) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Leave request not found');
        }

        if (leaveRequest.status !== 'submitted' && leaveRequest.status !== 'in_review') {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, `Request is already ${leaveRequest.status}`);
        }

        const startDate = leaveRequest.startDate;
        const endDate = leaveRequest.endDate;

        if (!startDate || !endDate) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Leave request is missing start or end date');
        }

        const student = await User.findOneAndUpdate(
            { _id: leaveRequest.studentId, role: 'student' },
            {
                $set: {
                    'leaveStatus.isOnLeave': true,
                    'leaveStatus.leaveStartDate': startDate,
                    'leaveStatus.leaveEndDate': endDate,
                    'leaveStatus.leaveReason': leaveRequest.description,
                    'leaveStatus.approvedBy': supervisorId,
                    housingStatus: 'suspended'
                }
            },
            { new: true, session }
        );

        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student not found');
        }

        leaveRequest.status = 'approved';
        leaveRequest.reviewedBy = supervisorId;
        leaveRequest.reviewedAt = new Date();
        await leaveRequest.save({ session });

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, 'Leave approved successfully', {
            studentId: student._id,
            studentName: student.name,
            leavePeriod: {
                start: startDate,
                end: endDate
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Approve Leave Error:', error);
        return sendError(res, 500, 'Failed to approve leave', error.message);
    }
};

// ==========================================
// PATCH /api/students/:studentId/end-leave (Admin)
// ==========================================
exports.endLeave = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { studentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(studentId)) {
            return sendError(res, 400, 'Invalid student ID format');
        }

        const student = await User.findOneAndUpdate(
            { _id: studentId, role: 'student' },
            {
                $set: {
                    'leaveStatus.isOnLeave': false,
                    'leaveStatus.leaveStartDate': null,
                    'leaveStatus.leaveEndDate': null,
                    'leaveStatus.leaveReason': '',
                    'leaveStatus.approvedBy': null,
                    housingStatus: 'active'
                }
            },
            { new: true, session }
        );

        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student not found');
        }

        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, 'Leave ended successfully', {
            studentId: student._id,
            studentName: student.name
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('End Leave Error:', error);
        return sendError(res, 500, 'Failed to end leave', error.message);
    }
};

// ==========================================
// GET /api/students/attendance/report
// ==========================================
exports.getAttendanceReport = async (req, res) => {
    try {
        const targetStudentId = req.params.studentId || req.userDoc._id;
        const isAdmin = req.userDoc.role === 'admin';

        if (!isAdmin && targetStudentId !== req.userDoc._id.toString()) {
            return sendError(res, 403, 'You are not authorized to view this report');
        }

        if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
            return sendError(res, 400, 'Invalid student ID format');
        }

        const { startDate, endDate } = req.query;
        const query = { studentId: targetStudentId };

        if (startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (isNaN(start) || isNaN(end)) {
                return sendError(res, 400, 'Invalid date format');
            }
            query.date = { $gte: start, $lte: end };
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const [records, totalRecords] = await Promise.all([
            Attendance.find(query)
                .select('date status')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(query)
        ]);

        const summary = {
            total: totalRecords,
            present: records.filter(r => r.status === 'present').length,
            absent: records.filter(r => r.status === 'absent').length,
            excused: records.filter(r => r.status === 'excused').length
        };

        return sendSuccess(res, 200, 'Attendance report fetched successfully', {
            summary,
            records,
            pagination: {
                page,
                limit,
                total: totalRecords,
                pages: Math.ceil(totalRecords / limit)
            }
        });

    } catch (error) {
        console.error('Get Attendance Report Error:', error);
        return sendError(res, 500, 'Failed to fetch attendance report', error.message);
    }
};