const { User, Student } = require('../models/User');
const Application = require('../models/Application');

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
// POST /api/auth/register
// ==========================================
exports.registerUser = async (req, res) => {
    try {
        const { 
            firebaseUid, email, name, phoneNumber, 
            studentId, nationalId, universityYear, faculty 
        } = req.body;

        // 1. التحقق من الحقول المطلوبة
        const requiredFields = ['firebaseUid', 'email', 'name', 'phoneNumber'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        // التحقق من صيغة الإيميل بشكل بسيط
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) {
            return sendError(res, 400, 'Invalid email format');
        }

        // 2. التأكد من عدم وجود المستخدم مسبقاً
        const existingUser = await User.findOne({ 
            $or: [{ email }, { firebaseUid }] 
        }).select('_id').lean();

        if (existingUser) {
            return sendError(res, 400, 'User already exists with this email or Firebase UID');
        }

        // 3. إنشاء الطالب
        const studentData = {
            firebaseUid,
            email,
            name,
            phoneNumber,
            role: 'student',
            ...(studentId && { studentId }),
            ...(nationalId && { nationalId }),
            ...(universityYear && { universityYear }),
            ...(faculty && { faculty })
        };

        const newStudent = new Student(studentData);
        await newStudent.save();

        return sendSuccess(res, 201, 'Registration successful. Please submit your housing application.', {
            userId: newStudent._id
        });

    } catch (error) {
        console.error('Register Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        if (error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return sendError(res, 400, `${field} already exists`);
        }
        return sendError(res, 500, 'Registration failed', error.message);
    }
};

// ==========================================
// POST /api/auth/login
// ==========================================
exports.loginUser = async (req, res) => {
    try {
        const { firebaseUid } = req.body;

        if (!firebaseUid) {
            return sendError(res, 400, 'Firebase UID is required');
        }

        // 1. البحث عن المستخدم
        const user = await User.findOne({ firebaseUid })
            .select('_id role name email housingStatus lastLogin')
            .exec();

        if (!user) {
            return sendError(res, 404, 'User not found. Please register first.');
        }

        // 2. التحقق من صلاحية الدخول للطلاب
        if (user.role === 'student') {
            const blockedStatuses = ['new_applicant', 'banned', 'suspended'];
            if (blockedStatuses.includes(user.housingStatus)) {
                const messages = {
                    'new_applicant': 'Your application is still pending approval.',
                    'banned': 'This account has been banned.',
                    'suspended': 'Your account is currently suspended.'
                };
                return sendError(res, 403, messages[user.housingStatus] || 'Login denied');
            }
        }

        // 3. تحديث آخر دخول
        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

        // 4. بناء بيانات المستخدم الآمنة للإرسال
        const userData = {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email
        };

        if (user.role === 'student') {
            userData.housingStatus = user.housingStatus;
        }

        return sendSuccess(res, 200, 'Login successful', { user: userData });

    } catch (error) {
        console.error('Login Error:', error);
        return sendError(res, 500, 'Login failed', error.message);
    }
};

// ==========================================
// GET /api/auth/profile
// ==========================================
exports.getProfile = async (req, res) => {
    try {
        // req.userDoc موجود من middleware
        const user = req.userDoc;

        // الحقول الآمنة للإرسال حسب الدور
        let profileData = {
            id: user._id,
            role: user.role,
            name: user.name,
            email: user.email,
            phoneNumber: user.phoneNumber,
            createdAt: user.createdAt
        };

        if (user.role === 'student') {
            profileData = {
                ...profileData,
                studentId: user.studentId,
                nationalId: user.nationalId,
                universityYear: user.universityYear,
                faculty: user.faculty,
                housingStatus: user.housingStatus,
                assignedRoomId: user.assignedRoomId,
                qrCode: user.qrCode,
                applicationId: user.applicationId
            };
        }

        return sendSuccess(res, 200, 'Profile fetched successfully', { user: profileData });

    } catch (error) {
        console.error('Get Profile Error:', error);
        return sendError(res, 500, 'Failed to fetch profile', error.message);
    }
};