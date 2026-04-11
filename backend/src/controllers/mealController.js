const Meal = require('../models/Meal');
const MealBooking = require('../models/MealBooking');
const { User } = require('../models/User');

// ================= حجز وجبة (للطالب) =================
exports.bookMeal = async (req, res) => {
  try {
    const { mealId } = req.body;
    
    if (req.userDoc.housingStatus === 'suspended') {
      return res.status(403).json({ success: false, message: "Cannot book meals while on leave" });
    }

    const meal = await Meal.findById(mealId);
    if (!meal) return res.status(404).json({ message: "Meal not found" });

    const booking = await MealBooking.create({
      studentId: req.userDoc._id,
      mealId,
      date: meal.date,
      status: 'booked'
    });

    res.status(201).json({ success: true, bookingId: booking._id });
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: "Already booked this meal" });
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= مسح الـ QR وصرف الوجبة (لمشرف المطعم) =================
exports.scanMeal = async (req, res) => {
  try {
    const { qrCodeString, mealId } = req.body;

    // التعديل: البحث بـ mealCode مش attendanceCode
    const student = await User.findOne({ "qrCode.mealCode": qrCodeString, role: 'student' });
    if (!student) return res.status(404).json({ message: "Invalid Meal QR Code" });

    const booking = await MealBooking.findOne({
      studentId: student._id,
      mealId,
      status: 'booked'
    });

    if (!booking) return res.status(404).json({ message: "No booking found for this meal today" });
    if (booking.isServed) return res.status(400).json({ message: "Meal already served" });

    booking.isServed = true;
    booking.servedAt = new Date();
    booking.servedBy = req.userDoc._id;
    await booking.save();

    res.status(200).json({ 
      success: true, 
      message: `Meal served to ${student.name}`,
      studentId: student.studentId 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};