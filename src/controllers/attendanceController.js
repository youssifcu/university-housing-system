const Attendance = require('../models/Attendance');
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

        // 1. البحث عن الطالب بكود الحضور (نستخدم .lean() لأننا مش هنعدل)
        const student = await User.findOne({
            'qrCode.attendanceCode': qrCodeString.trim(),
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

        // 4. تحديد الـ buildingId: إما المبعوث أو المأخوذ من الغرفة المعينة للطالب
        const effectiveBuildingId = buildingId || student.assignedRoomId;
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