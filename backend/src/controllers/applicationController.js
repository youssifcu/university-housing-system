const mongoose = require('mongoose');
const { User } = require('../models/User');
const Application = require('../models/Application');
const Building = require('../models/Building');
const Room = require('../models/Room');
const crypto = require('crypto');

// ==========================================
// Helpers للتنسيق الموحد للاستجابة
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
// POST /api/applications (تقديم طلب جديد)
// ==========================================
exports.submitApplication = async (req, res) => {
    try {
        const userId = req.userDoc._id;

        // 1. التحقق من وجود طلب نشط
        const existingApp = await Application.findOne({
            userId,
            status: { $in: ['pending', 'approved', 'needs_update'] }
        }).select('_id').lean();

        if (existingApp) {
            return sendError(res, 400, 'You already have an active application.');
        }

        // 2. قائمة الحقول المسموح بها في الطلب (منع الـ Mass Assignment)
        const allowedFields = [
            'fullName', 'nationalId', 'gender', 'dateOfBirth', 
            'phoneNumber', 'email', 'academicYear', 'college', 
            'department', 'gpa', 'address', 'emergencyContact'
        ];
        
        const applicationData = {};
        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                applicationData[field] = req.body[field];
            }
        });

        // 3. التحقق من وجود الحقول المطلوبة
        const requiredFields = ['fullName', 'nationalId', 'gender', 'academicYear', 'college'];
        const missingFields = requiredFields.filter(field => !applicationData[field]);
        if (missingFields.length > 0) {
            return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        // 4. إنشاء الطلب
        applicationData.userId = userId;
        applicationData.status = 'pending';

        const newApplication = new Application(applicationData);
        const savedApplication = await newApplication.save();

        return sendSuccess(res, 201, 'Application submitted successfully', {
            applicationId: savedApplication._id
        });

    } catch (error) {
        console.error('Submit Application Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to submit application', error.message);
    }
};

// ==========================================
// PATCH /api/applications/:id/approve (Admin Only)
// ==========================================
exports.approveApplication = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const reviewerId = req.userDoc._id;

        // 1. جلب الطلب
        const application = await Application.findById(id).session(session);
        if (!application) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Application not found');
        }

        if (application.status === 'approved') {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'This application is already approved');
        }

        // 2. البحث عن المباني المناسبة للجنس
        const targetBuildings = await Building.find({ gender: application.gender })
            .select('_id')
            .lean()
            .session(session);
        
        const buildingIds = targetBuildings.map(b => b._id);
        if (buildingIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, `No buildings found for ${application.gender} students`);
        }

        // 3. البحث عن أول غرفة متاحة (مع قفل الصف لمنع التعارض)
        const selectedRoom = await Room.findOne({
            buildingId: { $in: buildingIds },
            status: 'available'
        })
        .sort({ floorNumber: 1, roomNumber: 1 })
        .session(session);

        if (!selectedRoom) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Housing is full. No available rooms for this gender.');
        }

        // 4. توليد أكواد QR
        const uniqueHash = crypto.randomBytes(3).toString('hex').toUpperCase();
        const attendanceCode = `ATT-${application.nationalId.slice(-4)}-${uniqueHash}`;
        const mealCode = `MEAL-${application.nationalId.slice(-4)}-${uniqueHash}`;

        // 5. تحديث المستخدم (تحويله لطالب مفعل)
        const userUpdateResult = await User.findByIdAndUpdate(
            application.userId,
            {
                $set: {
                    nationalId: application.nationalId,
                    universityYear: application.academicYear,
                    faculty: application.college,
                    housingStatus: 'active',
                    applicationId: application._id,
                    assignedRoomId: selectedRoom._id,
                    roomAllocationDate: new Date(),
                    'qrCode.attendanceCode': attendanceCode,
                    'qrCode.mealCode': mealCode
                }
            },
            { new: true, session }
        );

        if (!userUpdateResult) {
            throw new Error('Failed to update user record');
        }

        // 6. تحديث الغرفة (إضافة الطالب)
        selectedRoom.currentOccupants.push(application.userId);
        await selectedRoom.save({ session });

        // 7. تحديث الطلب
        application.status = 'approved';
        application.reviewedBy = reviewerId;
        await application.save({ session });

        // تم كل شيء بنجاح -> commit
        await session.commitTransaction();
        session.endSession();

        return sendSuccess(res, 200, 'Application approved and student assigned', {
            roomNumber: selectedRoom.roomNumber,
            floor: selectedRoom.floorNumber,
            buildingName: targetBuildings.find(b => b._id.equals(selectedRoom.buildingId))?.name
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error('Approve Application Error:', error);
        return sendError(res, 500, 'Failed to approve application', error.message);
    }
};

// ==========================================
// PATCH /api/applications/:id/reject (Admin Only)
// ==========================================
exports.rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0) {
            return sendError(res, 400, 'Rejection reason is required');
        }

        const application = await Application.findByIdAndUpdate(
            id,
            {
                status: 'rejected',
                rejectionReason: reason.trim(),
                reviewedBy: req.userDoc._id
            },
            { new: true, runValidators: true }
        ).select('_id status');

        if (!application) {
            return sendError(res, 404, 'Application not found');
        }

        return sendSuccess(res, 200, 'Application rejected successfully');

    } catch (error) {
        console.error('Reject Application Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid application ID format');
        }
        return sendError(res, 500, 'Failed to reject application', error.message);
    }
};

// ==========================================
// GET /api/applications (Admin Only)
// ==========================================
exports.getAllApplications = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Filtering
        const filter = {};
        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.gender) {
            filter.gender = req.query.gender;
        }

        const [applications, total] = await Promise.all([
            Application.find(filter)
                .populate('userId', 'name email phoneNumber')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Application.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Applications fetched successfully', {
            applications,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get All Applications Error:', error);
        return sendError(res, 500, 'Failed to fetch applications', error.message);
    }
};

// ==========================================
// GET /api/applications/me (Student Only)
// ==========================================
exports.getMyApplication = async (req, res) => {
    try {
        const application = await Application.findOne({ userId: req.userDoc._id })
            .sort({ createdAt: -1 })
            .select('-__v') // نخفي الحقول الداخلية غير المهمة
            .lean();

        if (!application) {
            return sendError(res, 404, 'No application found');
        }

        return sendSuccess(res, 200, 'Application fetched successfully', { application });

    } catch (error) {
        console.error('Get My Application Error:', error);
        return sendError(res, 500, 'Failed to fetch application', error.message);
    }
};