const Meal = require('../models/Meal');
const MealBooking = require('../models/MealBooking');
const Student = require('../models/Student');
const User = require('../models/User');

const getDayRange = (dateInput) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

const parseDateOrNull = (value) => {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const canManageMeals = (role) => role === 'admin' || role === 'restaurant_supervisor';
const canScanMeals = (role) => role === 'admin' || role === 'restaurant_supervisor';

// GET /api/meals/menu/today
exports.getTodayMenu = async (req, res) => {
  try {
    const { start, end } = getDayRange();
    const meals = await Meal.find({ date: { $gte: start, $lte: end } }).sort({ mealType: 1, createdAt: 1 });

    return res.status(200).json(
      meals.map((meal) => ({
        id: meal._id,
        name: meal.name,
        mealType: meal.mealType,
        price: meal.price
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching today menu', error: error.message });
  }
};

// GET /api/meals/menu/week
exports.getWeeklyMenu = async (req, res) => {
  try {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);

    const meals = await Meal.find({ date: { $gte: start, $lte: end } }).sort({ date: 1, mealType: 1 });

    return res.status(200).json(
      meals.map((meal) => ({
        id: meal._id,
        name: meal.name,
        date: meal.date.toISOString().slice(0, 10)
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching weekly menu', error: error.message });
  }
};

// POST /api/meals
exports.createMeal = async (req, res) => {
  try {
    if (!canManageMeals(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { name, mealType, price, date } = req.body;
    const parsedDate = parseDateOrNull(date);

    if (!name || !mealType || price === undefined || !parsedDate) {
      return res.status(400).json({ message: 'name, mealType, price, and valid date are required' });
    }

    const createdMeal = await Meal.create({
      name,
      mealType,
      price,
      date: parsedDate
    });

    return res.status(201).json({ id: createdMeal._id, message: 'Meal added' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to add meal', error: error.message });
  }
};

// PUT /api/meals/:id
exports.updateMeal = async (req, res) => {
  try {
    if (!canManageMeals(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = { ...req.body };
    if (updates.date) {
      const parsedDate = parseDateOrNull(updates.date);
      if (!parsedDate) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
      updates.date = parsedDate;
    }

    const updatedMeal = await Meal.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updatedMeal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    return res.status(200).json({ message: 'Meal updated' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to update meal', error: error.message });
  }
};

// DELETE /api/meals/:id
exports.deleteMeal = async (req, res) => {
  try {
    if (!canManageMeals(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const deletedMeal = await Meal.findByIdAndDelete(req.params.id);
    if (!deletedMeal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    return res.status(200).json({ message: 'Meal deleted' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to delete meal', error: error.message });
  }
};

// POST /api/meals/book
exports.bookMeal = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied: student only' });
    }

    const { mealId, date } = req.body;
    const parsedDate = parseDateOrNull(date);
    if (!mealId || !parsedDate) {
      return res.status(400).json({ message: 'mealId and valid date are required' });
    }

    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const meal = await Meal.findById(mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }

    const mealDateRange = getDayRange(meal.date);
    if (parsedDate < mealDateRange.start || parsedDate > mealDateRange.end) {
      return res.status(400).json({ message: 'Booking date does not match meal date' });
    }

    const booking = await MealBooking.create({
      studentId: student._id,
      mealId,
      date: parsedDate,
      status: 'booked'
    });

    return res.status(201).json({ id: booking._id, status: booking.status });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Meal already booked by this student' });
    }
    return res.status(500).json({ message: 'Failed to book meal', error: error.message });
  }
};

// DELETE /api/meals/book/:id
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await MealBooking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (req.user.role === 'student') {
      const student = await Student.findOne({ userId: req.user.mongoId });
      if (!student || booking.studentId.toString() !== student._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
    } else if (!canManageMeals(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({ message: 'Booking cancelled' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to cancel booking', error: error.message });
  }
};

// GET /api/meals/bookings/my
exports.getMyBookings = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied: student only' });
    }

    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) {
      return res.status(404).json({ message: 'Student record not found' });
    }

    const bookings = await MealBooking.find({ studentId: student._id }).sort({ createdAt: -1 });

    return res.status(200).json(
      bookings.map((booking) => ({
        id: booking._id,
        mealId: booking.mealId,
        status: booking.status,
        isServed: booking.isServed
      }))
    );
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch bookings', error: error.message });
  }
};

// POST /api/meals/scan
exports.scanMeal = async (req, res) => {
  try {
    if (!canScanMeals(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { qrCode, mealId } = req.body;
    if (!qrCode || !mealId) {
      return res.status(400).json({ message: 'qrCode and mealId are required' });
    }

    const student = await Student.findOne({ qrCode });
    if (!student) {
      return res.status(404).json({ message: 'Student not found for QR code' });
    }

    const booking = await MealBooking.findOne({
      studentId: student._id,
      mealId,
      status: 'booked'
    });

    if (!booking) {
      return res.status(404).json({ message: 'Active booking not found for this meal' });
    }

    booking.isServed = true;
    booking.servedAt = new Date();
    booking.servedBy = req.user.mongoId;
    await booking.save();

    let studentName = student.fullName;
    if (!studentName && student.userId) {
      const user = await User.findById(student.userId).select('name');
      studentName = user ? user.name : 'Unknown';
    }

    // Emit real-time event
    const io = req.app.get('io');
    if (io) {
      io.emit('meal:served', { bookingId: booking._id, studentId: student._id });
    }

    return res.status(200).json({ message: 'Meal served', studentName: studentName || 'Unknown' });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to serve meal', error: error.message });
  }
};
