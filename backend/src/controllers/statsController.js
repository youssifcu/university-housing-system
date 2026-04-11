const { User, Student } = require('../models/User');
const Application = require('../models/Application');
const Room = require('../models/Room');
const Building = require('../models/Building');
const Meal = require('../models/Meal');
const MealBooking = require('../models/MealBooking');
const Payment = require('../models/Payment');

// ================= إحصائيات الطلاب حسب الكلية =================
exports.getStudentsByCollege = async (req, res) => {
  try {
    // الأفضل نجيبها من الـ User (الطالب الفعلي) مش الأبلكيشن
    const stats = await User.aggregate([
      { $match: { role: 'student', housingStatus: 'active' } },
      { $group: { _id: '$faculty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= إحصائيات الطلاب حسب السنة الدراسية =================
exports.getStudentsByGrade = async (req, res) => {
  try {
    const stats = await User.aggregate([
      { $match: { role: 'student', housingStatus: 'active' } },
      { $group: { _id: '$universityYear', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= إحصائيات الغرف والمباني (تحسين الأداء) =================
exports.getBuildingsAvailability = async (req, res) => {
  try {
    //Aggregation واحدة تجيب كل حاجة بدل الـ Loop
    const stats = await Room.aggregate([
      {
        $group: {
          _id: '$buildingId',
          totalCapacity: { $sum: '$capacity' },
          currentOccupancy: { $sum: { $size: '$currentOccupants' } }
        }
      },
      {
        $lookup: {
          from: 'buildings',
          localField: '_id',
          foreignField: '_id',
          as: 'buildingInfo'
        }
      },
      { $unwind: '$buildingInfo' },
      {
        $project: {
          buildingName: '$buildingInfo.name',
          totalCapacity: 1,
          currentOccupancy: 1,
          available: { $subtract: ['$totalCapacity', '$currentOccupancy'] }
        }
      }
    ]);
    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= إحصائيات تحضير الوجبات (تجاهل الطلاب في إجازة) =================
exports.getMealsPreparationStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const stats = await MealBooking.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow }, status: 'booked' } },
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      { $unwind: '$student' },
      // تصفية الطلاب اللي مش في إجازة (housingStatus != suspended)
      { $match: { 'student.housingStatus': { $ne: 'suspended' } } },
      {
        $lookup: {
          from: 'meals',
          localField: 'mealId',
          foreignField: '_id',
          as: 'mealInfo'
        }
      },
      { $unwind: '$mealInfo' },
      {
        $group: {
          _id: '$mealId',
          mealName: { $first: '$mealInfo.name' },
          requiredCount: { $sum: 1 }
        }
      }
    ]);

    res.status(200).json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= إحصائيات المدفوعات =================
exports.getPaymentsStats = async (req, res) => {
  try {
    const stats = await Payment.aggregate([
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          confirmedCount: { $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] } },
          pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } }
        }
      }
    ]);
    
    res.status(200).json({ success: true, stats: stats[0] || {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};