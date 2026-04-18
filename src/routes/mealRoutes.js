const express = require('express');
const router = express.Router();
const mealController = require('../controllers/mealController');
const verifyToken = require('../middlewares/verifyFirebaseToken');
const { isAdmin, isMealAdmin, isAdminOrMealAdmin, isStudent, isAdminOrSupervisor } = require('../middlewares/roleMiddleware');

// ==========================================
// مسارات عامة (للمستخدمين المسجلين)
// ==========================================
// عرض قائمة الوجبات (مع Pagination وفلترة)
router.get(
    '/',
    verifyToken,
    mealController.getMeals
);

// عرض وجبات اليوم
router.get(
    '/today',
    verifyToken,
    mealController.getMeals // مع فلترة التاريخ
);

// عرض وجبات الأسبوع (يمكن تنفيذها في الكنترولر)
router.get(
    '/week',
    verifyToken,
    mealController.getWeeklyMenu // تأكد من وجودها
);

// ==========================================
// مسارات الطالب (Student Only)
// ==========================================
// حجز وجبة
router.post(
    '/book',
    verifyToken,
    isStudent,
    mealController.bookMeal
);

// عرض حجوزاتي
router.get(
    '/my-bookings',
    verifyToken,
    isStudent,
    mealController.getMyBookings
);

// إلغاء حجز
router.delete(
    '/book/:bookingId',
    verifyToken,
    isStudent,
    mealController.cancelBooking
);

// ==========================================
// مسارات مسؤولي الوجبات (Meal Admin)
// ==========================================
// مسح QR لصرف وجبة
router.post(
    '/scan',
    verifyToken,
    isAdminOrMealAdmin,
    mealController.scanMeal
);

// إنشاء وجبة جديدة (Meal Admin أو Admin)
router.post(
    '/',
    verifyToken,
    isAdminOrMealAdmin,
    mealController.createMeal
);

// تحديث وجبة
router.put(
    '/:id',
    verifyToken,
    isAdminOrMealAdmin,
    mealController.updateMeal
);

// حذف وجبة
router.delete(
    '/:id',
    verifyToken,
    isAdminOrMealAdmin,
    mealController.deleteMeal
);

module.exports = router;