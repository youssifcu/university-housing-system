const QRCode = require('qrcode');
const { User, Student } = require('../models/User');
const crypto = require('crypto');
const mongoose = require('mongoose');

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

const QR_OPTIONS = {
    errorCorrectionLevel: 'M',
    type: 'image/png',
    margin: 2,
    scale: 8,
    color: {
        dark: '#000000',
        light: '#FFFFFF'
    }
};

// ==========================================
// POST /api/qr/generate (Student)
// ==========================================
exports.generateStudentQRCodes = async (req, res) => {
    try {
        const studentId = req.userDoc._id;

        if (req.userDoc.role !== 'student') {
            return sendError(res, 403, 'Only students can generate QR codes');
        }

        const attendanceCode = crypto.randomUUID();
        const mealCode = crypto.randomUUID();

        const [attendanceQR, mealQR] = await Promise.all([
            QRCode.toDataURL(attendanceCode, QR_OPTIONS),
            QRCode.toDataURL(mealCode, QR_OPTIONS)
        ]);

        const updatedUser = await Student.findByIdAndUpdate(
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
            { returnDocument: 'after' }
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
        const student = await Student.findById(req.userDoc._id)
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
// POST /api/qr/refresh 
// ==========================================
exports.refreshStudentQRCodes = async (req, res) => {
    try {
        const studentId = req.userDoc._id;

        if (req.userDoc.role !== 'student') {
            return sendError(res, 403, 'Only students can refresh QR codes');
        }

        const attendanceCode = crypto.randomUUID();
        const mealCode = crypto.randomUUID();

        const [attendanceQR, mealQR] = await Promise.all([
            QRCode.toDataURL(attendanceCode, QR_OPTIONS),
            QRCode.toDataURL(mealCode, QR_OPTIONS)
        ]);

        await Student.findByIdAndUpdate(studentId, {
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
// GET /api/qr/verify  
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

        const query = { role: 'student' };
        if (type === 'attendance') query['qrCode.attendanceCode'] = code;
        else query['qrCode.mealCode'] = code;

        const student = await Student.findOne(query).select('_id name studentId housingStatus').lean();

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