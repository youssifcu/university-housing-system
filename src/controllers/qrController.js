const QRCode = require('qrcode');
const { User } = require('../models/User');
const crypto = require('crypto');

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

// إعدادات QR Code الموصى بها
const QR_OPTIONS = {
    errorCorrectionLevel: 'M', // مستوى تصحيح الأخطاء متوسط (مناسب للطباعة)
    type: 'image/png',
    margin: 2,                // هامش أبيض حول الكود
    scale: 8,                 // جودة عالية
    color: {
        dark: '#000000',      // لون الكود
        light: '#FFFFFF'      // لون الخلفية
    }
};

// ==========================================
// POST /api/qr/generate (Student)
// ==========================================
exports.generateStudentQRCodes = async (req, res) => {
    try {
        const studentId = req.userDoc._id;

        // التحقق من أن المستخدم طالب
        if (req.userDoc.role !== 'student') {
            return sendError(res, 403, 'Only students can generate QR codes');
        }

        // توليد أكواد عشوائية فريدة (12 بايت = 24 حرف)
        const attendanceCode = crypto.randomBytes(12).toString('hex');
        const mealCode = crypto.randomBytes(12).toString('hex');

        // توليد صور Base64 بالتوازي لتحسين الأداء
        const [attendanceQR, mealQR] = await Promise.all([
            QRCode.toDataURL(attendanceCode, QR_OPTIONS),
            QRCode.toDataURL(mealCode, QR_OPTIONS)
        ]);

        // تحديث الطالب
        const updatedUser = await User.findByIdAndUpdate(
            studentId,
            {
                $set: {
                    'qrCode.attendanceCode': attendanceCode,
                    'qrCode.attendanceQR': attendanceQR,
                    'qrCode.mealCode': mealCode,
                    'qrCode.mealQR': mealQR,
                    'qrCode.generatedAt': new Date()
                }
            },
            { new: true }
        ).select('qrCode');

        return sendSuccess(res, 200, 'QR codes generated successfully', {
            qrCodes: {
                attendance: {
                    code: attendanceCode,
                    qrImage: attendanceQR
                },
                meal: {
                    code: mealCode,
                    qrImage: mealQR
                }
            },
            generatedAt: updatedUser.qrCode.generatedAt
        });

    } catch (error) {
        console.error('Generate QR Codes Error:', error);
        return sendError(res, 500, 'Failed to generate QR codes', error.message);
    }
};

// ==========================================
// GET /api/qr/my (Student)
// ==========================================
exports.getStudentQRCodes = async (req, res) => {
    try {
        const student = await User.findById(req.userDoc._id)
            .select('qrCode')
            .lean();

        if (!student) {
            return sendError(res, 404, 'Student not found');
        }

        if (!student.qrCode || !student.qrCode.attendanceCode || !student.qrCode.mealCode) {
            return sendError(res, 404, 'QR codes not found. Please generate them first.');
        }

        return sendSuccess(res, 200, 'QR codes fetched successfully', {
            qrCodes: student.qrCode
        });

    } catch (error) {
        console.error('Get Student QR Codes Error:', error);
        return sendError(res, 500, 'Failed to fetch QR codes', error.message);
    }
};

// ==========================================
// POST /api/qr/refresh (Student - تجديد الأكواد)
// ==========================================
exports.refreshStudentQRCodes = async (req, res) => {
    try {
        const studentId = req.userDoc._id;

        if (req.userDoc.role !== 'student') {
            return sendError(res, 403, 'Only students can refresh QR codes');
        }

        // نفس منطق التوليد لكن مع رسالة مختلفة
        const attendanceCode = crypto.randomBytes(12).toString('hex');
        const mealCode = crypto.randomBytes(12).toString('hex');

        const [attendanceQR, mealQR] = await Promise.all([
            QRCode.toDataURL(attendanceCode, QR_OPTIONS),
            QRCode.toDataURL(mealCode, QR_OPTIONS)
        ]);

        await User.findByIdAndUpdate(studentId, {
            $set: {
                'qrCode.attendanceCode': attendanceCode,
                'qrCode.attendanceQR': attendanceQR,
                'qrCode.mealCode': mealCode,
                'qrCode.mealQR': mealQR,
                'qrCode.generatedAt': new Date()
            }
        });

        return sendSuccess(res, 200, 'QR codes refreshed successfully', {
            qrCodes: {
                attendance: { code: attendanceCode, qrImage: attendanceQR },
                meal: { code: mealCode, qrImage: mealQR }
            }
        });

    } catch (error) {
        console.error('Refresh QR Codes Error:', error);
        return sendError(res, 500, 'Failed to refresh QR codes', error.message);
    }
};

// ==========================================
// GET /api/qr/verify (للاختبار أو التحقق من صحة الكود)
// ==========================================
exports.verifyQRCode = async (req, res) => {
    try {
        const { code, type } = req.query; // type = 'attendance' or 'meal'

        if (!code || !type) {
            return sendError(res, 400, 'Code and type are required');
        }

        if (!['attendance', 'meal'].includes(type)) {
            return sendError(res, 400, 'Type must be "attendance" or "meal"');
        }

        const queryField = type === 'attendance' ? 'qrCode.attendanceCode' : 'qrCode.mealCode';
        const student = await User.findOne({
            [queryField]: code,
            role: 'student'
        }).select('_id name studentId housingStatus').lean();

        if (!student) {
            return sendError(res, 404, 'Invalid QR code or student not found');
        }

        return sendSuccess(res, 200, 'QR code verified', {
            student: {
                id: student._id,
                name: student.name,
                studentId: student.studentId,
                housingStatus: student.housingStatus
            }
        });

    } catch (error) {
        console.error('Verify QR Code Error:', error);
        return sendError(res, 500, 'Failed to verify QR code', error.message);
    }
};