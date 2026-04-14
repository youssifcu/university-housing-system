const mongoose = require('mongoose');
const { User } = require('../models/User');
const admin = require('../config/firebase');

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

const ALLOWED_ROLES = ['student', 'supervisor', 'security', 'admin', 'floor_admin', 'meal_admin'];

exports.getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const filter = {};
        if (req.query.role) filter.role = req.query.role;
        if (req.query.housingStatus) filter.housingStatus = req.query.housingStatus;

        const [users, total] = await Promise.all([
            User.find(filter).select('-qrCode -firebaseUID').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
            User.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Users fetched successfully', {
            users,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch users', error.message);
    }
};

exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return sendError(res, 400, 'Invalid ID format');

        const user = await User.findById(id).select('-qrCode -firebaseUID').lean();
        if (!user) return sendError(res, 404, 'User not found');

        if (req.userDoc.role !== 'admin' && req.userDoc._id.toString() !== id) {
            return sendError(res, 403, 'Access denied');
        }

        return sendSuccess(res, 200, 'User fetched successfully', { user });
    } catch (error) {
        return sendError(res, 500, 'Failed to fetch user', error.message);
    }
};

exports.getProfilePicture = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).send('Invalid ID format');

        const user = await User.findById(id).select('+profilePicture.data +profilePicture.contentType').lean();
        if (!user || !user.profilePicture || !user.profilePicture.data) {
            return res.status(404).send('Not found');
        }

        res.set('Content-Type', user.profilePicture.contentType);
       const buffer = Buffer.isBuffer(user.profilePicture.data)
       ? user.profilePicture.data : Buffer.from(user.profilePicture.data.buffer ?? user.profilePicture.data);
          return res.send(buffer);
    } catch (error) {
        return res.status(500).send('Error');
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = {};
        const fields = ['name', 'email', 'phoneNumber', 'role', 'housingStatus'];

        fields.forEach(f => {
            if (req.body[f] !== undefined) updates[f] = req.body[f];
        });

        if (req.file) {
            updates.profilePicture = { data: req.file.buffer, contentType: req.file.mimetype };
        }

        const updatedUser = await User.findByIdAndUpdate(id, { $set: updates }, { new: true, runValidators: true }).lean();
        return sendSuccess(res, 200, 'Updated', { user: updatedUser });
    } catch (error) {
        return sendError(res, 500, 'Failed', error.message);
    }
};

exports.updateUserProfile = async (req, res) => {
    try {
        const userId = req.userDoc._id;
        const updates = {};
        if (req.body.name) updates.name = req.body.name.trim();
        if (req.body.phoneNumber) updates.phoneNumber = req.body.phoneNumber.trim();

        if (req.file) {
            updates.profilePicture = { data: req.file.buffer, contentType: req.file.mimetype };
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { $set: updates }, { new: true }).select('-qrCode').lean();
        return sendSuccess(res, 200, 'Success', { user: updatedUser });
    } catch (error) {
        return sendError(res, 500, 'Error', error.message);
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);
        if (!user) return sendError(res, 404, 'Not found');

        if (user.firebaseUID) await admin.auth().deleteUser(user.firebaseUID);
        await User.findByIdAndDelete(id);

        return sendSuccess(res, 200, 'Deleted');
    } catch (error) {
        return sendError(res, 500, 'Failed', error.message);
    }
};
