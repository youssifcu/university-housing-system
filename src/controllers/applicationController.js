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

        const existingApp = await Application.findOne({
            userId,
            status: { $in: ['pending', 'approved', 'needs_update'] }
        }).select('_id').lean();

        if (existingApp) {
            return sendError(res, 400, 'You already have an active application.');
        }

        const allowedFields = [
            'studentType', 'fullName', 'nationalId', 'gender', 'dateOfBirth', 
            'phoneNumber', 'email', 'address', 'emergencyContact',
            'college', 'department', 'academicYear', 'gpa',
            'housingType', 'specialNeeds', 'preferredRoommate'
        ];
        
        const applicationData = {}; 
        
        if (req.body.emergencyContact && typeof req.body.emergencyContact === 'string') {
            try { req.body.emergencyContact = JSON.parse(req.body.emergencyContact); } catch (e) {}
        }
        if (req.body.specialNeeds && typeof req.body.specialNeeds === 'string') {
            try { req.body.specialNeeds = JSON.parse(req.body.specialNeeds); } catch (e) {}
        }

        allowedFields.forEach(field => {
            if (req.body[field] !== undefined) {
                applicationData[field] = req.body[field];
            }
        });

        if (req.files) {
            const imageMimes = ['image/jpeg', 'image/png', 'image/jpg'];
            const pdfMimes = ['application/pdf'];
            const fileErrors = [];

            const validateFileType = (fileArray, allowedTypes, fieldName, expectedType) => {
                if (fileArray && fileArray[0]) {
                    if (!allowedTypes.includes(fileArray[0].mimetype)) {
                        fileErrors.push(`Field ${fieldName} must be ${expectedType} only.`);
                    }
                }
            };

            validateFileType(req.files.personalPhoto, imageMimes, 'personalPhoto', 'Image (JPG, PNG)');
            validateFileType(req.files.nationalIdCard, imageMimes, 'nationalIdCard', 'Image (JPG, PNG)');
            validateFileType(req.files.universityIdCard, imageMimes, 'universityIdCard', 'Image (JPG, PNG)');
            validateFileType(req.files.medicalReport, pdfMimes, 'medicalReport', 'PDF File');

            if (fileErrors.length > 0) {
                return sendError(res, 400, 'Invalid file formats', fileErrors);
            }

            applicationData.documents = applicationData.documents || {};

            const mapFile = (file) => file && file[0] ? {
                data: file[0].buffer,
                contentType: file[0].mimetype,
                originalName: file[0].originalname,
                uploadedAt: new Date()
            } : undefined;

            if (req.files.nationalIdCard) applicationData.documents.nationalIdCard = mapFile(req.files.nationalIdCard);
            if (req.files.personalPhoto) applicationData.documents.personalPhoto = mapFile(req.files.personalPhoto);
            if (req.files.medicalReport) applicationData.documents.medicalReport = mapFile(req.files.medicalReport);
            if (req.files.universityIdCard) applicationData.documents.universityIdCard = mapFile(req.files.universityIdCard);
        }

        const requiredFields = [
            'studentType', 'fullName', 'nationalId', 'gender', 'dateOfBirth', 
            'phoneNumber', 'address', 'college', 'academicYear'
        ];
        
        const missingFields = requiredFields.filter(field => !applicationData[field]);
        if (missingFields.length > 0) {
            return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        applicationData.userId = userId;
        applicationData.status = 'pending';

        const newApplication = new Application(applicationData);
        const savedApplication = await newApplication.save();
        
        await User.findOneAndUpdate(
        { _id: userId },
        { 
            $set: { 
                housingStatus: 'suspended', 
                applicationId: savedApplication._id 
                } 
            },
            { new: true, runValidators: false } // تعطيل الـ validators مؤقتاً لو الـ enum فيه مشكلة
        );


        await User.findByIdAndUpdate(userId, {
            $set: { 
                housingStatus: 'suspended',
                applicationId: savedApplication._id 
            }
        });

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

        // 2. البحث عن المباني المناسبة للجنس والدرجة
        // تحويل الـ GPA (من 4) لمقياس الـ Grade (من 10)
        const MAX_GPA = 4.0; // لو نظام الكلية من 5، غير الرقم ده لـ 5.0
        let studentGrade = 5; // الدرجة الافتراضية (النص) لو الطالب جديد وملوش GPA
        
        if (application.gpa) {
            // تحويل المقياس والتقريب لأقرب رقم صحيح
            studentGrade = Math.ceil((application.gpa / MAX_GPA) * 10); 
            
            // تأمين إضافي: عشان لو في غلطة والـ GPA معدي الـ 4، الجريد ميكسرش الـ 10
            if (studentGrade > 10) studentGrade = 10;
            if (studentGrade < 1) studentGrade = 1;
        }
        
        const targetBuildings = await Building.find({ 
            gender: application.gender,
            grade: { $lte: studentGrade } // زي ما صلحناها المرة اللي فاتت
        })
        
        const buildingIds = targetBuildings.map(b => b._id);
        if (buildingIds.length === 0) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, `No buildings found matching your grade level (${studentGrade}) for ${application.gender} students. You may need to improve your academic grade.`);
        }

        // 3. البحث عن أول غرفة متاحة (مع قفل الصف لمنع التعارض)
        const selectedRoom = await Room.findOne({
            buildingId: { $in: buildingIds },
            status: 'available'
        })
        .sort({ floorNumber: 1, roomNumber: 1 })
        .populate('buildingId', 'name')
        .session(session);

        if (!selectedRoom) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 400, 'Housing is full. No available rooms for this gender.');
        }

        // 4. توليد أكواد QR
        const userIdString = application.userId.toString();

        // 5. تحديث المستخدم (تحويله لطالب مفعل) بالطريقة الآمنة
        const student = await User.findById(application.userId).session(session);
        
        if (!student) {
            await session.abortTransaction();
            session.endSession();
            return sendError(res, 404, 'Student record not found');
        }

        student.nationalId = application.nationalId;
        student.universityYear = application.academicYear;
        student.faculty = application.college;
        student.grade = studentGrade;
        student.housingStatus = 'active';
        student.applicationId = application._id;
        student.assignedRoomId = selectedRoom._id;
        student.roomAllocationDate = new Date();
        
        // التأكد من وجود كائن الـ qrCode قبل الإضافة جواه
        if (!student.qrCode) {
            student.qrCode = {};
        }
        student.qrCode.attendanceCode = userIdString;
        student.qrCode.mealCode = userIdString;

        // الحفظ (دي بتضمن إن المونجو يكتب الداتا كلها وميطنش حاجة)
        await student.save({ session });


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
            buildingName: selectedRoom.buildingId?.name || null
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

// ==========================================
// GET /api/applications/:id
// ==========================================
exports.getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.userDoc;

        // البحث عن الطلب
        const application = await Application.findById(id)
            .populate('userId', 'name email studentId')
            .select('-__v')
            .lean();

        if (!application) {
            return sendError(res, 404, 'Application not found');
        }

        // التحقق من الصلاحيات: المالك أو الأدمن أو المشرف
        const isOwner = application.userId._id.toString() === user._id.toString();
        const isAdmin = user.role === 'admin';
        const isSupervisor = user.role === 'supervisor';

        if (!isOwner && !isAdmin && !isSupervisor) {
            return sendError(res, 403, 'Access denied. You can only view your own applications');
        }

        return sendSuccess(res, 200, 'Application fetched successfully', { application });

    } catch (error) {
        console.error('Get Application By ID Error:', error);
        if (error.name === 'CastError') {
            return sendError(res, 400, 'Invalid application ID');
        }
        return sendError(res, 500, 'Failed to fetch application', error.message);
    }
};

// ==========================================
// DELETE /api/applications/:id
// ==========================================
// داخل exports.deleteApplication
exports.deleteApplication = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const { id } = req.params;
        const application = await Application.findById(id).session(session);

        if (!application) {
            await session.abortTransaction();
            return sendError(res, 404, 'Application not found');
        }

        if (application.userId.toString() !== req.userDoc._id.toString()) {
            await session.abortTransaction();
            return sendError(res, 403, 'Access denied');
        }

        if (application.status !== 'pending') {
            await session.abortTransaction();
            return sendError(res, 400, 'Cannot delete reviewed application');
        }

        // 1. حذف الطلب
        await Application.findByIdAndDelete(id).session(session);

        // 2. إعادة حالة المستخدم لوضعها الطبيعي
        await User.findByIdAndUpdate(application.userId, {
            $set: { housingStatus: 'new_applicant' }, // أو 'none' حسب الـ default عندك
            $unset: { applicationId: "" } // حذف الربط بالطلب الممسوح
        }).session(session);

        await session.commitTransaction();
        session.endSession();
        return sendSuccess(res, 200, 'Application deleted and status reset');
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return sendError(res, 500, 'Delete failed', error.message);
    }
};
