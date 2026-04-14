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

        return sendSuccess(res, 200, 'Users fetched successfully', {
            users,
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

        return sendSuccess(res, 200, 'User fetched successfully', { user });
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