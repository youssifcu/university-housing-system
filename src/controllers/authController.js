const { User, Student } = require('../models/User');
const Application = require('../models/Application');

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
// POST /api/auth/register
// ==========================================
exports.registerUser = async (req, res) => {
    try {
        const {
            firebaseUid, email, name, phoneNumber,
            studentId, nationalId, universityYear, faculty
        } = req.body;

        const requiredFields = [
            'firebaseUid', 'email', 'name', 'phoneNumber',
            'studentId', 'nationalId', 'universityYear', 'faculty'
        ];

        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { firebaseUid }, { studentId }, { nationalId }]
        }).select('_id').lean();

        if (existingUser) {
            return sendError(res, 400, 'User with this email, ID, or Student ID already exists');
        }

        const studentData = {
            firebaseUid,
            email,
            name,
            phoneNumber,
            role: 'student',
            studentId,
            nationalId,
            universityYear,
            faculty
        };

        if (req.file) {
            studentData.profilePicture = {
                data: req.file.buffer,
                contentType: req.file.mimetype
            };
        }

        const newStudent = new Student(studentData);
        await newStudent.save();

        return sendSuccess(res, 201, 'Registration successful', {
            userId: newStudent._id
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        if (error.code === 11000) {
            return sendError(res, 400, 'Duplicate entry found in database');
        }
        return sendError(res, 500, 'Registration failed', error.message);
    }
};
// ==========================================
// POST /api/auth/login
// ==========================================
exports.loginUser = async (req, res) => {
    try {
        if (!req.body) {
            return sendError(res, 400, 'Request body is missing');
        }
        const { firebaseUid } = req.body;

        if (!firebaseUid) {
            return sendError(res, 400, 'Firebase UID is required');
        }

        const user = await User.findOne({ firebaseUid })
            .select('_id role name email housingStatus lastLogin')
            .exec();

        if (!user) {
            return sendError(res, 404, 'User not found. Please register first.');
        }


        user.lastLogin = new Date();
        await user.save({ validateBeforeSave: false });

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
        const user = req.userDoc;

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
                profilePicture: (user.profilePicture && user.profilePicture.contentType) ? `/api/users/${user._id}/profile-picture` : null,
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

// ==========================================
// PUT /api/auth/profile
// ==========================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.userDoc._id;
        const updates = req.body;

        const allowedFields = ['name', 'phoneNumber'];
        const filteredUpdates = {};

        for (const field of allowedFields) {
            if (updates[field] !== undefined) {
                filteredUpdates[field] = updates[field];
            }
        }

        if (Object.keys(filteredUpdates).length === 0) {
            return sendError(res, 400, 'No valid fields to update');
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            filteredUpdates,
            { new: true, runValidators: true }
        );

        if (!updatedUser) {
            return sendError(res, 404, 'User not found');
        }

        return sendSuccess(res, 200, 'Profile updated successfully', { user: updatedUser });

    } catch (error) {
        console.error('Update Profile Error:', error);
        return sendError(res, 500, 'Failed to update profile', error.message);
    }
};

// ==========================================
// PATCH /api/auth/password
// ==========================================
exports.changePassword = async (req, res) => {
    try {
        const userId = req.userDoc._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return sendError(res, 400, 'Current password and new password are required');
        }

        // Note: Since authentication is handled by Firebase, password change should be done via Firebase Auth
        // This is a placeholder - you might need to implement Firebase password change
        return sendError(res, 501, 'Password change not implemented - use Firebase Auth');

    } catch (error) {
        console.error('Change Password Error:', error);
        return sendError(res, 500, 'Failed to change password', error.message);
    }
};

// ==========================================
// POST /api/auth/register-admin
// ==========================================
exports.registerAdmin = async (req, res) => {
    try {
        const {
            firebaseUid, email, name, phoneNumber, role
        } = req.body;

        const requiredFields = ['firebaseUid', 'email', 'name', 'phoneNumber', 'role'];
        const missingFields = requiredFields.filter(field => !req.body[field]);
        if (missingFields.length > 0) {
            return sendError(res, 400, `Missing required fields: ${missingFields.join(', ')}`);
        }

        const validRoles = ['admin', 'supervisor', 'floor_admin', 'meal_admin', 'security'];
        if (!validRoles.includes(role)) {
            return sendError(res, 400, 'Invalid role. Must be admin, supervisor, floor_admin, meal_admin, or security');
        }

        const existingUser = await User.findOne({
            $or: [{ email }, { firebaseUid }]
        }).select('_id').lean();

        if (existingUser) {
            return sendError(res, 409, 'User already exists with this email or Firebase UID');
        }

        const newUser = new User({
            firebaseUid,
            email,
            name,
            phoneNumber,
            role
        });

        await newUser.save();

        return sendSuccess(res, 201, 'Admin/Supervisor registered successfully', { user: newUser });

    } catch (error) {
        console.error('Register Admin Error:', error);
        return sendError(res, 500, 'Failed to register admin/supervisor', error.message);
    }
};
