const mongoose = require('mongoose');
const Meal = require('../models/Meal');
const MealBooking = require('../models/MealBooking');
const { User } = require('../models/User');

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
// GET /api/meals (الحصول على قائمة الوجبات)
// ==========================================
exports.getMeals = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // فلترة حسب التاريخ
        const filter = {};
        if (req.query.date) {
            const date = new Date(req.query.date);
            if (!isNaN(date)) {
                const start = new Date(date);
                start.setHours(0, 0, 0, 0);
                const end = new Date(date);
                end.setHours(23, 59, 59, 999);
                filter.date = { $gte: start, $lte: end };
            }
        }
        if (req.query.type) {
            filter.type = req.query.type; // breakfast, lunch, dinner
        }

        const [meals, total] = await Promise.all([
            Meal.find(filter)
                .sort({ date: 1, type: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Meal.countDocuments(filter)
        ]);

        // إذا المستخدم طالب، نضيف حالة الحجز له
        if (req.userDoc.role === 'student') {
            const mealIds = meals.map(m => m._id);
            const bookings = await MealBooking.find({
                studentId: req.userDoc._id,
                mealId: { $in: mealIds }
            }).select('mealId status').lean();

            const bookingMap = {};
            bookings.forEach(b => { bookingMap[b.mealId] = b.status; });

            meals.forEach(meal => {
                meal.isBooked = !!bookingMap[meal._id];
                meal.bookingStatus = bookingMap[meal._id] || null;
            });
        }

        return sendSuccess(res, 200, 'Meals fetched successfully', {
            meals,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get Meals Error:', error);
        return sendError(res, 500, 'Failed to fetch meals', error.message);
    }
};

// ==========================================
// POST /api/meals/book (حجز وجبة - طالب)
// ==========================================
exports.bookMeal = async (req, res) => {
    try {
        const { mealId } = req.body;
        const studentId = req.userDoc._id;

        // التحقق من المدخلات
        if (!mealId) {
            return sendError(res, 400, 'Meal ID is required');
        }
        if (!mongoose.Types.ObjectId.isValid(mealId)) {
            return sendError(res, 400, 'Invalid meal ID format');
        }

        // التحقق من حالة الطالب
        if (req.userDoc.housingStatus === 'suspended') {
            return sendError(res, 403, 'Cannot book meals while on leave');
        }
        if (req.userDoc.housingStatus !== 'active') {
            return sendError(res, 403, 'Only active residents can book meals');
        }

        // جلب الوجبة
        const meal = await Meal.findById(mealId).select('date name type').lean();
        if (!meal) {
            return sendError(res, 404, 'Meal not found');
        }

        // التحقق من أن الوجبة لم تنتهي بعد (يمكن الحجز قبلها بـ 24 ساعة مثلاً)
        const mealDate = new Date(meal.date);
        const now = new Date();
        if (mealDate < now) {
            return sendError(res, 400, 'Cannot book past meals');
        }

        // إنشاء الحجز (مع التعامل مع Duplicate Key)
        try {
            const booking = await MealBooking.create({
                studentId,
                mealId,
                date: meal.date,
                status: 'booked'
            });
            return sendSuccess(res, 201, 'Meal booked successfully', {
                bookingId: booking._id
            });
        } catch (err) {
            if (err.code === 11000) {
                return sendError(res, 400, 'You have already booked this meal');
            }
            throw err;
        }

    } catch (error) {
        console.error('Book Meal Error:', error);
        return sendError(res, 500, 'Failed to book meal', error.message);
    }
};

// ==========================================
// POST /api/meals/scan (مسح QR وصرف الوجبة)
// ==========================================
exports.scanMeal = async (req, res) => {
    try {
        const { qrCodeString, mealId } = req.body;

        // التحقق من المدخلات
        if (!qrCodeString || !mealId) {
            return sendError(res, 400, 'QR code string and meal ID are required');
        }
        if (!mongoose.Types.ObjectId.isValid(mealId)) {
            return sendError(res, 400, 'Invalid meal ID format');
        }

        // البحث عن الطالب بكود الوجبات
        const student = await User.findOne({
            'qrCode.mealCode': qrCodeString.trim(),
            role: 'student'
        }).select('_id name studentId housingStatus').lean();

        if (!student) {
            return sendError(res, 404, 'Invalid Meal QR Code - Student not found');
        }

        if (student.housingStatus === 'suspended') {
            return sendError(res, 403, 'Student is on leave and cannot receive meals');
        }

        // البحث عن الحجز
        const booking = await MealBooking.findOne({
            studentId: student._id,
            mealId,
            status: 'booked'
        });

        if (!booking) {
            return sendError(res, 404, 'No booking found for this meal');
        }

        if (booking.isServed) {
            return sendError(res, 400, 'Meal already served to this student');
        }

        // تحديث الحجز
        booking.isServed = true;
        booking.servedAt = new Date();
        booking.servedBy = req.userDoc._id;
        await booking.save();

        return sendSuccess(res, 200, `Meal served to ${student.name}`, {
            studentId: student.studentId,
            studentName: student.name,
            servedAt: booking.servedAt
        });

    } catch (error) {
        console.error('Scan Meal Error:', error);
        return sendError(res, 500, 'Failed to scan meal', error.message);
    }
};

// ==========================================
// GET /api/meals/my-bookings (حجوزات الطالب)
// ==========================================
exports.getMyBookings = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [bookings, total] = await Promise.all([
            MealBooking.find({ studentId: req.userDoc._id })
                .populate('mealId', 'name type date')
                .sort({ date: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            MealBooking.countDocuments({ studentId: req.userDoc._id })
        ]);

        return sendSuccess(res, 200, 'Your bookings fetched successfully', {
            bookings,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) }
        });

    } catch (error) {
        console.error('Get My Bookings Error:', error);
        return sendError(res, 500, 'Failed to fetch bookings', error.message);
    }
};