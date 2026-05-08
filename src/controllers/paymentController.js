const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const { User } = require('../models/User');

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

const ALLOWED_STATUSES = ['pending', 'completed', 'failed', 'refunded'];
const ALLOWED_METHODS = ['cash', 'card', 'bank_transfer', 'online'];

// ==========================================
// GET /api/payments (Admin Only)
// ==========================================
exports.getAllPayments = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = {};
        if (req.query.status) filter.status = req.query.status;
        if (req.query.paymentMethod) filter.paymentMethod = req.query.paymentMethod;
        if (req.query.studentId) {
            if (!mongoose.Types.ObjectId.isValid(req.query.studentId)) {
                return sendError(res, 400, 'Invalid student ID format');
            }
            filter.studentId = req.query.studentId;
        }

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .populate('studentId', 'name email studentId')
                .sort({ paymentDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Payments fetched successfully', {
            payments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get All Payments Error:', error);
        return sendError(res, 500, 'Failed to fetch payments', error.message);
    }
};

// ==========================================
// GET /api/payments/my (Student)
// ==========================================
exports.getMyPayments = async (req, res) => {
    try {
        const studentId = req.userDoc._id;

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const filter = { studentId };

        const [payments, total] = await Promise.all([
            Payment.find(filter)
                .sort({ paymentDate: -1, createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Payment.countDocuments(filter)
        ]);

        return sendSuccess(res, 200, 'Your payments fetched successfully', {
            payments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get My Payments Error:', error);
        return sendError(res, 500, 'Failed to fetch your payments', error.message);
    }
};

// ==========================================
// POST /api/payments (Student)
// ==========================================
exports.createPayment = async (req, res) => {
    try {
        const studentId = req.userDoc._id;
        const { amount, paymentMethod, description, dueDate } = req.body;

        if (!amount || amount <= 0) {
            return sendError(res, 400, 'Valid amount is required');
        }
        if (!paymentMethod || !ALLOWED_METHODS.includes(paymentMethod)) {
            return sendError(res, 400, `Invalid payment method. Allowed: ${ALLOWED_METHODS.join(', ')}`);
        }

        if (req.userDoc.housingStatus !== 'active') {
            return sendError(res, 403, 'Only active housing students can create payments');
        }

        const paymentData = {
            studentId,
            amount,
            paymentMethod,
            description: description?.trim() || 'Housing Payment',
            status: 'pending',
            paymentDate: new Date(),
            ...(dueDate && { dueDate: new Date(dueDate) })
        };

        const payment = new Payment(paymentData);
        await payment.save();

        return sendSuccess(res, 201, 'Payment created successfully', {
            payment: {
                id: payment._id,
                amount: payment.amount,
                status: payment.status
            }
        });

    } catch (error) {
        console.error('Create Payment Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to create payment', error.message);
    }
};

// ==========================================
// GET /api/payments/:id
// ==========================================
exports.getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid payment ID format');
        }

        const payment = await Payment.findById(id)
            .populate('studentId', 'name email studentId')
            .lean();

        if (!payment) {
            return sendError(res, 404, 'Payment not found');
        }

        const isAdmin = req.userDoc.role === 'admin';
        const isOwner = payment.studentId._id.toString() === req.userDoc._id.toString();

        if (!isAdmin && !isOwner) {
            return sendError(res, 403, 'You are not authorized to view this payment');
        }

        return sendSuccess(res, 200, 'Payment fetched successfully', { payment });

    } catch (error) {
        console.error('Get Payment By ID Error:', error);
        return sendError(res, 500, 'Failed to fetch payment', error.message);
    }
};

// ==========================================
// PUT /api/payments/:id (Admin Only)
// ==========================================
exports.updatePayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid payment ID format');
        }

        const allowedUpdates = ['amount', 'paymentMethod', 'status', 'description', 'dueDate', 'paymentDate'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        if (updates.status && !ALLOWED_STATUSES.includes(updates.status)) {
            return sendError(res, 400, `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`);
        }

        if (updates.paymentMethod && !ALLOWED_METHODS.includes(updates.paymentMethod)) {
            return sendError(res, 400, `Invalid payment method. Allowed: ${ALLOWED_METHODS.join(', ')}`);
        }

        const updatedPayment = await Payment.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('_id amount status paymentMethod');

        if (!updatedPayment) {
            return sendError(res, 404, 'Payment not found');
        }

        return sendSuccess(res, 200, 'Payment updated successfully', {
            payment: updatedPayment
        });

    } catch (error) {
        console.error('Update Payment Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to update payment', error.message);
    }
};

// ==========================================
// DELETE /api/payments/:id (Admin Only)
// ==========================================
exports.deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid payment ID format');
        }

        const payment = await Payment.findByIdAndDelete(id).select('_id amount');

        if (!payment) {
            return sendError(res, 404, 'Payment not found');
        }

        return sendSuccess(res, 200, 'Payment deleted successfully', {
            id: payment._id
        });

    } catch (error) {
        console.error('Delete Payment Error:', error);
        return sendError(res, 500, 'Failed to delete payment', error.message);
    }
};