const mongoose = require('mongoose');
const { User } = require('../models/User');
const Attendance = require('../models/Attendance');
const HousingRequest = require('../models/HousingRequest');
const MealBooking = require('../models/MealBooking');
const QRCode = require('qrcode');

// ==========================================
// Helpers للتنسيق الموحد
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
// GET /api/students (Admin Only)
// ==========================================
exports.getAllStudents = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { role: 'student' };
        if (req.query.housingStatus) filter.housingStatus = req.query.housingStatus;
        if (req.query.faculty) filter.faculty = req.query.faculty;
        if (req.query.roomId) filter.assignedRoomId = req.query.roomId;

        const [students, total] = await Promise.all([
            User.find(filter)
                .populate('assignedRoomId', 'roomNumber floorNumber buildingId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Students fetched successfully', {
            students,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get All Students Error:', error);
        return sendError(res, 500, 'Failed to fetch students', error.message);
    }
};

// ==========================================
// GET /api/students/:id (Admin/Staff)
// ==========================================
exports.getStudentById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid student ID format');
        }

        const student = await User.findOne({ _id: id, role: 'student' })
            .populate('assignedRoomId', 'roomNumber floorNumber buildingId')
            .lean();

        if (!student) {
            return sendError(res, 404, 'Student not found');
        }

        return sendSuccess(res, 200, 'Student fetched successfully', { student });
    } catch (error) {
        console.error('Get Student By ID Error:', error);
        return sendError(res, 500, 'Failed to fetch student', error.message);
    }
};

// ==========================================
// GET /api/students/me (Logged-in Student)
// ==========================================
exports.getMyProfile = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.userDoc._id, role: 'student' })
            .populate({
                path: 'assignedRoomId',
                populate: {
                    path: 'buildingId',
                    select: 'name supervisorId'
                }
            })
            .lean();

        if (!student) {
            return sendError(res, 404, 'Student profile not found');
        }

        // التحقق من انتهاء الإجازة تلقائيًا
        if (student.housingStatus === 'suspended') {
            const leaveEnded = await StudentRequest.exists({
                studentId: student._id,
                requestType: 'leave_request',
                status: 'approved',
                endDate: { $lt: new Date() }
            });
            if (leaveEnded) {
                await User.findByIdAndUpdate(student._id, { housingStatus: 'active' });
                student.housingStatus = 'active';
            }
        }

        // حساب رصيد الوجبات الأسبوعي (وجبات محجوزة ولم تُصرف)
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const mealBalance = await MealBooking.countDocuments({
            studentId: student._id,
            date: { $gte: startOfWeek, $lte: endOfWeek },
            status: 'booked',
            isServed: false
        });

        // دمج بيانات المبنى والغرفة بشكل واضح
        const responseData = {
            ...student,
            building: student.assignedRoomId?.buildingId || null,
            room: student.assignedRoomId,
            mealBalance
        };

        return sendSuccess(res, 200, 'Profile fetched successfully', { student: responseData });
    } catch (error) {
        console.error('Get My Profile Error:', error);
        return sendError(res, 500, 'Failed to fetch profile', error.message);
    }
};

// ==========================================
// GET /api/students/me/qr (Logged-in Student)
// ==========================================
exports.getMyQRCode = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.userDoc._id, role: 'student' }).select('qrCode').lean();
        if (!student) {
            return sendError(res, 404, 'Student record not found');
        }

        if (!student.qrCode) {
            return sendError(res, 404, 'No QR code generated yet');
        }

        // يمكن إرجاع الصورة كـ DataURL إذا كانت مخزنة
        return sendSuccess(res, 200, 'QR code fetched', {
            qrCode: student.qrCode,
            status: 'active'
        });
    } catch (error) {
        console.error('Get My QR Code Error:', error);
        return sendError(res, 500, 'Failed to fetch QR code', error.message);
    }
};

// ==========================================
// PATCH /api/students/:id (Admin Only)
// ==========================================
exports.updateStudent = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid student ID format');
        }

        // الحقول المسموح بتحديثها
        const allowedUpdates = [
            'nationalId', 'universityYear', 'faculty', 'department',
            'housingStatus', 'assignedRoomId', 'leaveStatus'
        ];
        const updates = {};
        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        const student = await User.findOneAndUpdate(
            { _id: id, role: 'student' },
            { $set: updates },
            { new: true, runValidators: true }
        ).lean();

        if (!student) {
            return sendError(res, 404, 'Student not found');
        }

        return sendSuccess(res, 200, 'Student updated successfully', { student });
    } catch (error) {
        console.error('Update Student Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to update student', error.message);
    }
};

// ==========================================
// POST /api/students/me/generate-qr
// ==========================================
exports.generateMyQRCode = async (req, res) => {
    try {
        const student = await User.findOne({ _id: req.userDoc._id, role: 'student' });
        if (!student) {
            return sendError(res, 404, 'Student record not found');
        }

        // استخدام ID الطالب ككود QR
        const userIdString = student._id.toString();

        student.qrCode = {
            attendanceCode: userIdString,
            mealCode: userIdString,
            generatedAt: new Date()
        };
        await student.save();

        return sendSuccess(res, 200, 'QR code generated successfully', {
            qrCode: student.qrCode
        });
    } catch (error) {
        console.error('Generate QR Code Error:', error);
        return sendError(res, 500, 'Failed to generate QR code', error.message);
    }
};

// ==========================================
// POST /api/students/validate-qr (Admin/Staff)
// ==========================================
exports.validateQRCode = async (req, res) => {
    try {
        const { qrCode } = req.body;
        if (!qrCode || typeof qrCode !== 'string') {
            return sendError(res, 400, 'QR code string is required');
        }

        // التحقق من صحة ObjectId
        if (!mongoose.Types.ObjectId.isValid(qrCode)) {
            return sendSuccess(res, 200, 'QR code invalid', {
                valid: false,
                status: 'invalid_format'
            });
        }

        const student = await User.findOne({
            _id: qrCode,
            role: 'student'
        })
            .select('_id userId housingStatus')
            .lean();

        if (!student) {
            return sendSuccess(res, 200, 'QR code invalid', {
                valid: false,
                status: 'not_found'
            });
        }

        return sendSuccess(res, 200, 'QR code valid', {
            valid: true,
            studentId: student._id,
            housingStatus: student.housingStatus
        });
    } catch (error) {
        console.error('Validate QR Code Error:', error);
        return sendError(res, 500, 'Failed to validate QR code', error.message);
    }
};

// ==========================================
// POST /api/students/me/leave (Student)
// ==========================================
exports.requestLeave = async (req, res) => {
    try {
        const { leaveStartDate, leaveEndDate, leaveReason } = req.body;
        const studentId = req.userDoc._id;

        // التحقق من المدخلات
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

        // التحقق من عدم وجود طلب إجازة معلق
        const existingRequest = await StudentRequest.findOne({
            studentId,
            requestType: 'leave_request',
            status: { $in: ['submitted', 'in_review'] }
        }).select('_id').lean();

        if (existingRequest) {
            return sendError(res, 400, 'You already have a pending leave request');
        }

        // إنشاء طلب الإجازة
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
// PATCH /api/students/leave/:requestId/approve (Admin/Supervisor)
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

        // 1. جلب طلب الإجازة
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

        // 3. تحديث الطالب (إضافة حالة الإجازة)
        const student = await User.findOneAndUpdate(
            { _id: leaveRequest.studentId, role: 'student' },
            {
                $set: {
                    'leaveStatus.isOnLeave': true,
                    'leaveStatus.leaveStartDate': startDate,
                    'leaveStatus.leaveEndDate': endDate,
                    'leaveStatus.leaveReason': leaveRequest.description,
                    'leaveStatus.approvedBy': supervisorId,
                    housingStatus: 'suspended' // تعليق السكن خلال الإجازة
                }
            },
            { new: true, session }
        );

        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student not found');
        }

        // 4. تحديث الطلب
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
// PATCH /api/students/:studentId/end-leave (Admin/Supervisor)
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
                    housingStatus: 'active' // إعادة تفعيل السكن
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
// GET /api/students/me/attendance (Student) or /api/students/:id/attendance (Admin)
// ==========================================
exports.getAttendanceReport = async (req, res) => {
    try {
        // تحديد الطالب: إما المحدد في الرابط أو الطالب الحالي
        const targetStudentId = req.params.studentId || req.userDoc._id.toString();
        const isAdminOrSupervisor = ['admin', 'supervisor'].includes(req.userDoc.role);

        // صلاحيات: الأدمن/المشرف يقدروا يشوفوا أي طالب، الطالب يشوف نفسه فقط
        if (!isAdminOrSupervisor && targetStudentId !== req.userDoc._id.toString()) {
            return sendError(res, 403, 'You are not authorized to view this report');
        }

        // التحقق من صحة ID الطالب
        if (!mongoose.Types.ObjectId.isValid(targetStudentId)) {
            return sendError(res, 400, 'Invalid student ID format');
        }

        // بناء الفلتر للتاريخ
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

        // Pagination (اختياري)
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        // جلب السجلات والإحصاءات
        const [records, totalRecords] = await Promise.all([
            Attendance.find(query)
                .select('date status')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(query)
        ]);

        // حساب الملخص
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