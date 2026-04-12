const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const Room = require('../models/Room');
const { User } = require('../models/User');

// Helpers للتنسيق الموحد
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
// POST /api/attendance/scan (Supervisor/Admin)
// ==========================================
exports.scanAttendance = async (req, res) => {
    try {
        const { qrCodeString, buildingId } = req.body;

        // التحقق من وجود الكود
        if (!qrCodeString || qrCodeString.trim() === '') {
            return sendError(res, 400, 'QR Code string is required');
        }

        // 1. التحقق من صحة ObjectId
        if (!mongoose.Types.ObjectId.isValid(qrCodeString)) {
            return sendError(res, 400, 'Invalid QR Code format');
        }

        // 2. البحث عن الطالب بالـ ID مباشرة (نستخدم .lean() لأننا مش هنعدل)
        const student = await User.findOne({
            _id: qrCodeString,
            role: 'student'
        })
        .select('_id name studentId housingStatus assignedRoomId')
        .lean();

        if (!student) {
            return sendError(res, 404, 'Invalid QR Code - Student not found');
        }

        // 2. التحقق من حالة الإجازة (suspended)
        if (student.housingStatus === 'suspended') {
            return sendSuccess(res, 200, 'Student is on approved leave. Attendance not required.', {
                onLeave: true,
                studentName: student.name
            });
        }

        // 3. منع تسجيل الحضور مرتين في نفس اليوم
        const today = new Date();
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(today);
        endOfDay.setHours(23, 59, 59, 999);

        const existingRecord = await Attendance.findOne({
            studentId: student._id,
            date: { $gte: startOfDay, $lte: endOfDay }
        }).select('_id').lean();

        if (existingRecord) {
            return sendError(res, 400, 'Attendance already recorded for today');
        }

        // 4. تحديد الـ buildingId: إما المرسَل من المشرف أو المأخوذ من الغرفة المعينة للطالب
        let effectiveBuildingId = null;

        if (buildingId) {
            if (!mongoose.Types.ObjectId.isValid(buildingId)) {
                return sendError(res, 400, 'Invalid building ID format');
            }
            effectiveBuildingId = buildingId;
        } else if (student.assignedRoomId) {
            const room = await Room.findById(student.assignedRoomId)
                .select('buildingId')
                .lean();
            if (!room || !room.buildingId) {
                return sendError(res, 400, 'Assigned room building could not be determined');
            }
            effectiveBuildingId = room.buildingId;
        }

        if (!effectiveBuildingId) {
            return sendError(res, 400, 'Building ID could not be determined. Please provide it.');
        }

        // 5. تسجيل الحضور
        const attendance = await Attendance.create({
            studentId: student._id,
            buildingId: effectiveBuildingId,
            date: today,
            status: 'present',
            recordedBy: req.userDoc._id
        });

        return sendSuccess(res, 201, `Attendance recorded for ${student.name}`, {
            attendanceId: attendance._id,
            studentName: student.name,
            studentId: student.studentId,
            timestamp: attendance.date
        });

    } catch (error) {
        console.error('Scan Attendance Error:', error);
        // لو الخطأ بسبب CastError (بناءً على ID غير صالح مثلاً)
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid ID format in request');
        }
        return sendError(res, 500, 'Failed to record attendance', error.message);
    }
};

// ==========================================
// GET /api/attendance/me (Student)
// ==========================================
exports.getMyAttendance = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30; // عدد معقول لسجل الحضور
        const skip = (page - 1) * limit;

        // جلب السجلات مع Pagination
        const [records, total] = await Promise.all([
            Attendance.find({ studentId: req.userDoc._id })
                .select('date status buildingId') // الحقول المطلوبة فقط
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments({ studentId: req.userDoc._id })
        ]);

        // تنسيق بسيط للتاريخ
        const formattedRecords = records.map(record => ({
            id: record._id,
            date: record.date,
            status: record.status,
            buildingId: record.buildingId
        }));

        return sendSuccess(res, 200, 'Attendance records fetched successfully', {
            records: formattedRecords,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get My Attendance Error:', error);
        return sendError(res, 500, 'Failed to fetch attendance records', error.message);
    }
};

// ==========================================
// GET /api/attendance/student/:studentId (Admin/Supervisor)
// ==========================================
exports.getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 30;
        const skip = (page - 1) * limit;

        // التحقق من صحة الـ studentId
        if (!studentId) {
            return sendError(res, 400, 'Student ID is required');
        }

        // التحقق من وجود الطالب
        const student = await User.findById(studentId).select('name studentId').lean();
        if (!student) {
            return sendError(res, 404, 'Student not found');
        }

        // فلترة حسب التاريخ إذا كان محدد
        const filter = { studentId };
        if (req.query.startDate && req.query.endDate) {
            const startDate = new Date(req.query.startDate);
            const endDate = new Date(req.query.endDate);
            if (!isNaN(startDate) && !isNaN(endDate)) {
                filter.date = { $gte: startDate, $lte: endDate };
            }
        }

        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .select('date status buildingId recordedBy')
                .populate('buildingId', 'name')
                .populate('recordedBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, `Attendance records for ${student.name} fetched successfully`, {
            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId
            },
            records,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Student Attendance Error:', error);
        return sendError(res, 500, 'Failed to fetch student attendance records', error.message);
    }
};

// ==========================================
// GET /api/attendance/building/:buildingId (Admin/Supervisor)
// ==========================================
exports.getAttendanceByBuilding = async (req, res) => {
    try {
        const { buildingId } = req.params;
        const date = req.query.date ? new Date(req.query.date) : new Date();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        if (!buildingId) {
            return sendError(res, 400, 'Building ID is required');
        }

        // تحديد نطاق التاريخ (يوم كامل)
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const filter = {
            buildingId,
            date: { $gte: startOfDay, $lte: endOfDay }
        };

        const [records, total] = await Promise.all([
            Attendance.find(filter)
                .populate('studentId', 'name studentId')
                .populate('recordedBy', 'name')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Attendance.countDocuments(filter)
        ]);

        // إحصائيات سريعة
        const stats = {
            totalRecords: total,
            presentCount: records.filter(r => r.status === 'present').length,
            absentCount: records.filter(r => r.status === 'absent').length,
            lateCount: records.filter(r => r.status === 'late').length
        };

        return sendSuccess(res, 200, 'Building attendance records fetched successfully', {
            date: date.toISOString().split('T')[0],
            buildingId,
            records,
            stats,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get Attendance By Building Error:', error);
        return sendError(res, 500, 'Failed to fetch building attendance records', error.message);
    }
};

// ==========================================
// PATCH /api/attendance/:id (Admin Only)
// ==========================================
exports.updateAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        if (!id) {
            return sendError(res, 400, 'Attendance record ID is required');
        }

        const attendance = await Attendance.findById(id);
        if (!attendance) {
            return sendError(res, 404, 'Attendance record not found');
        }

        // التحقق من صحة الحالة الجديدة
        const validStatuses = ['present', 'absent', 'late', 'excused'];
        if (status && !validStatuses.includes(status)) {
            return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        // تحديث الحقول المسموحة
        if (status) attendance.status = status;
        if (notes !== undefined) attendance.notes = notes;

        await attendance.save();

        return sendSuccess(res, 200, 'Attendance record updated successfully', {
            attendance: {
                id: attendance._id,
                studentId: attendance.studentId,
                date: attendance.date,
                status: attendance.status,
                notes: attendance.notes
            }
        });

    } catch (error) {
        console.error('Update Attendance Error:', error);
        return sendError(res, 500, 'Failed to update attendance record', error.message);
    }
};