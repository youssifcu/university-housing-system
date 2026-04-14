const mongoose = require('mongoose');
const { User } = require('../models/User');
const admin = require('../config/firebase'); // تأكد من مسار التهيئة الصحيح

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
// Data Shaping Helper
// ==========================================
const shapeUserData = (user) => {
    if (!user) return null;

    const shaped = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phoneNumber: user.phoneNumber,
        isActive: user.isActive,
        profilePicture: (user.profilePicture && user.profilePicture.contentType) ? `/api/users/${user._id}/profile-picture` : null,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
    };

    if (user.role === 'student') {
        shaped.studentDetails = {
            studentId: user.studentId,
            nationalId: user.nationalId,
            universityYear: user.universityYear,
            faculty: user.faculty,
            department: user.department,
            grade: user.grade,
            housingStatus: user.housingStatus,
            applicationId: user.applicationId,
            assignedRoomId: user.assignedRoomId,
            bedNumber: user.bedNumber,
            roomAllocationDate: user.roomAllocationDate,
            leaveStatus: user.leaveStatus
        };
    } else if (user.role === 'supervisor') {
        shaped.supervisorDetails = {
            supervisorType: user.supervisorType,
            department: user.department,
            assignedBuildings: user.assignedBuildings
        };
    } else if (user.role === 'floor_admin') {
        shaped.floorAdminDetails = {
            floorNumber: user.floorNumber,
            buildingId: user.buildingId,
            isNightShift: user.isNightShift
        };
    } else if (user.role === 'meal_admin') {
        shaped.mealAdminDetails = {
            mealAdminType: user.mealAdminType,
            kitchenAssignment: user.kitchenAssignment,
            workShift: user.workShift,
            specialization: user.specialization
        };
    }

    // Clean undefined fields inside details
    for (const key in shaped) {
        if (typeof shaped[key] === 'object' && shaped[key] !== null && !Array.isArray(shaped[key])) {
            Object.keys(shaped[key]).forEach(k => shaped[key][k] === undefined && delete shaped[key][k]);
        }
    }

    return shaped;
};

// الأدوار المسموحة للتحديث عبر الـ API
const ALLOWED_ROLES = ['student', 'supervisor', 'security', 'admin', 'floor_admin', 'meal_admin'];

// ==========================================
// GET /api/users (Admin Only)
// ==========================================
exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.housingStatus) filter.housingStatus = req.query.housingStatus;

        const [users, total] = await Promise.all([
            User.find(filter)
                .select('-qrCode -firebaseUID') // نخفي بيانات حساسة
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            User.countDocuments(filter)
        ]);
        
        const shapedUsers = users.map(shapeUserData);

        return sendSuccess(res, 200, 'Users fetched successfully', {
            users: shapedUsers,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        console.error('Get All Users Error:', error);
        return sendError(res, 500, 'Failed to fetch users', error.message);
    }
};

// ==========================================
// GET /api/users/:id (Admin/Self)
// ==========================================
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid user ID format');
        }

        const user = await User.findById(id)
            .select('-qrCode -firebaseUID')
            .lean();

        if (!user) {
            return sendError(res, 404, 'User not found');
        }

        // المستخدم العادي لا يرى إلا بياناته
        if (req.userDoc.role !== 'admin' && req.userDoc._id.toString() !== id) {
            return sendError(res, 403, 'Access denied');
        }

        const shapedUser = shapeUserData(user);

        return sendSuccess(res, 200, 'User fetched successfully', { user: shapedUser });
    } catch (error) {
        console.error('Get User By ID Error:', error);
        return sendError(res, 500, 'Failed to fetch user', error.message);
    }
};

// ==========================================
// GET /api/users/:id/profile-picture
// ==========================================
exports.getProfilePicture = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send('Invalid user ID format');
        }

        const user = await User.findById(id).select('+profilePicture.data +profilePicture.contentType').lean();
        
        if (!user || !user.profilePicture || !user.profilePicture.data) {
            return res.status(404).send('Profile picture not found');
        }

        res.set('Content-Type', user.profilePicture.contentType);
        return res.send(user.profilePicture.data);
    } catch (error) {
        console.error('Get Profile Picture Error:', error);
        return res.status(500).send('Failed to fetch profile picture');
    }
};

// ==========================================
// PUT /api/users/:id (Admin Only)
// ==========================================
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid user ID format');
        }

        // الحقول المسموح بتحديثها (لا نسمح بتعديل firebaseUID أو كلمات السر)
        const allowedUpdates = ['name', 'email', 'phoneNumber', 'role', 'housingStatus'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                let value = req.body[field];
                if (typeof value === 'string') {
                    value = value.trim();
                }
                updates[field] = value;
            }
        });

        if (updates.role && !ALLOWED_ROLES.includes(updates.role)) {
            return sendError(res, 400, `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}`);
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        const updatedUser = await User.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('-qrCode -firebaseUID').lean();

        if (!updatedUser) {
            return sendError(res, 404, 'User not found');
        }

        return sendSuccess(res, 200, 'User updated successfully', { user: updatedUser });
    } catch (error) {
        console.error('Update User Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to update user', error.message);
    }
};

// ==========================================
// DELETE /api/users/:id (Admin Only)
// ==========================================
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid user ID format');
        }

        // 1. البحث عن المستخدم
        const user = await User.findById(id).select('firebaseUID role _id');
        if (!user) {
            return sendError(res, 404, 'User not found in database');
        }

        // 2. محاولة حذف المستخدم من Firebase (إذا كان لديه firebaseUID)
        if (user.firebaseUID) {
            try {
                await admin.auth().deleteUser(user.firebaseUID);
                console.log(`Firebase user ${user.firebaseUID} deleted`);
            } catch (firebaseError) {
                // قد يكون المستخدم محذوفاً بالفعل من Firebase أو خطأ آخر
                console.warn(`Firebase deletion warning: ${firebaseError.message}`);
                // نكمل العملية ولا نفشل بسبب Firebase
            }
        }

        // 3. حذف المستخدم من MongoDB
        await User.findByIdAndDelete(id);

        return sendSuccess(res, 200, 'User deleted successfully from system', {
            deletedId: id,
            firebaseUid: user.firebaseUID || null
        });

    } catch (error) {
        console.error('Delete User Error:', error);
        return sendError(res, 500, 'Failed to delete user', error.message);
    }
};