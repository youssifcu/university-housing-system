const Student = require('../models/Student');
const Application = require('../models/Application');
const Room = require('../models/Room');
const Building = require('../models/Building');
const Meal = require('../models/Meal');
const MealBooking = require('../models/MealBooking');
const Payment = require('../models/Payment');
const HousingRequest = require('../models/HousingRequest');

/**
 * @desc    Get students by college
 * @route   GET /api/stats/students-by-college
 */
exports.getStudentsByCollege = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$college', count: { $sum: 1 } } }
    ]);
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get students by grade
 * @route   GET /api/stats/students-by-grade
 */
exports.getStudentsByGrade = async (req, res) => {
  try {
    const stats = await Application.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$lastYearGrade', count: { $sum: 1 } } }
    ]);
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get rooms stats
 * @route   GET /api/stats/rooms
 */
exports.getRoomsStats = async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ status: 'available' });
    const fullRooms = await Room.countDocuments({ status: 'full' });
    const maintenanceRooms = await Room.countDocuments({ status: 'maintenance' });
    res.status(200).json({ totalRooms, availableRooms, fullRooms, maintenanceRooms });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get buildings availability
 * @route   GET /api/stats/buildings-availability
 */
exports.getBuildingsAvailability = async (req, res) => {
  try {
    const buildings = await Building.find();
    const stats = await Promise.all(buildings.map(async (building) => {
      const rooms = await Room.find({ buildingId: building._id });
      const totalCapacity = rooms.reduce((sum, room) => sum + room.capacity, 0);
      const currentOccupancy = rooms.reduce((sum, room) => sum + room.currentOccupancy, 0);
      return {
        building: building.name,
        totalCapacity,
        currentOccupancy,
        available: totalCapacity - currentOccupancy
      };
    }));
    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get meals stats
 * @route   GET /api/stats/meals
 */
exports.getMealsStats = async (req, res) => {
  try {
    const totalMeals = await Meal.countDocuments();
    const today = new Date().toISOString().split('T')[0];
    const todayMeals = await Meal.countDocuments({ date: { $gte: new Date(today), $lt: new Date(today + 'T23:59:59') } });
    res.status(200).json({ totalMeals, todayMeals });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get meals preparation stats (active students minus on leave)
 * @route   GET /api/stats/meals/preparation
 */
exports.getMealsPreparationStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const meals = await Meal.find({ date: { $gte: new Date(today), $lt: new Date(today + 'T23:59:59') } });

    const stats = await Promise.all(meals.map(async (meal) => {
      const bookings = await MealBooking.find({ mealId: meal._id, status: 'booked' }).populate('studentId');
      let count = 0;

      for (const booking of bookings) {
        const student = booking.studentId;
        if (!student) continue;

        const onLeave = student.housingStatus === 'suspended'
          ? await checkOnLeave(student._id)
          : false;

        if (!onLeave) {
          count += 1;
        }
      }

      return {
        mealId: meal._id,
        name: meal.name,
        count
      };
    }));

    res.status(200).json({ stats });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get payment stats
 * @route   GET /api/stats/payments
 */
exports.getPaymentsStats = async (req, res) => {
  try {
    const totalPayments = await Payment.countDocuments();
    const confirmedPayments = await Payment.countDocuments({ status: 'confirmed' });
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    const totalAmount = await Payment.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    res.status(200).json({
      totalPayments,
      confirmedPayments,
      pendingPayments,
      totalAmount: totalAmount.length > 0 ? totalAmount[0].total : 0
    });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

async function checkOnLeave(studentId) {
  const leave = await HousingRequest.findOne({
    studentId,
    type: 'vacate',
    status: 'approved',
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() }
  });
  return !!leave;
}