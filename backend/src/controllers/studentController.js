const mongoose = require('mongoose');
const Student = require('../models/Student');
const { User } = require('../models/User');
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

        const filter = {};
        if (req.query.housingStatus) filter.housingStatus = req.query.housingStatus;
        if (req.query.faculty) filter.faculty = req.query.faculty;
        if (req.query.roomId) filter.roomId = req.query.roomId;

        const [students, total] = await Promise.all([
            Student.find(filter)
                .populate('userId', 'name email')
                .populate('roomId', 'roomNumber floorNumber buildingId')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Student.countDocuments(filter)
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

        const student = await Student.findById(id)
            .populate('userId', 'name email')
            .populate({
                path: 'roomId',
                populate: { path: 'buildingId', select: 'name gender' }
            })
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
        const student = await Student.findOne({ userId: req.userDoc._id })
            .populate({
                path: 'roomId',
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
            const leaveEnded = await HousingRequest.exists({
                studentId: student._id,
                type: 'leave',
                status: 'approved',
                endDate: { $lt: new Date() }
            });
            if (leaveEnded) {
                await Student.findByIdAndUpdate(student._id, { housingStatus: 'active' });
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
            building: student.roomId?.buildingId || null,
            room: student.roomId,
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
        const student = await Student.findOne({ userId: req.userDoc._id }).select('qrCode').lean();
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
            'housingStatus', 'roomId', 'leaveStatus'
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

        const student = await Student.findByIdAndUpdate(
            id,
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
        const student = await Student.findOne({ userId: req.userDoc._id });
        if (!student) {
            return sendError(res, 404, 'Student record not found');
        }

        // إنشاء سلسلة فريدة للـ QR
        const uniqueId = student.universityId || student.nationalId || student._id.toString();
        const timestamp = Date.now().toString(36);
        const random = Math.floor(Math.random() * 100000);
        const qrString = `STU-${uniqueId}-${timestamp}-${random}`;

        student.qrCode = qrString;
        await student.save();

        // اختياري: توليد صورة QR كـ DataURL وتخزينها
        const qrImage = await QRCode.toDataURL(qrString);

        return sendSuccess(res, 200, 'QR code generated successfully', {
            qrCode: qrString,
            qrImage
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

        const student = await Student.findOne({ qrCode: qrCode.trim() })
            .select('_id userId housingStatus')
            .lean();

        if (!student) {
            return sendSuccess(res, 200, 'QR code invalid', {
                valid: false,
                status: 'pending'
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