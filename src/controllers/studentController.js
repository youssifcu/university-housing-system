const mongoose = require('mongoose');
const { User } = require('../models/User');
const Attendance = require('../models/Attendance');
const HousingRequest = require('../models/HousingRequest');
const MealBooking = require('../models/MealBooking');
const QRCode = require('qrcode');

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
