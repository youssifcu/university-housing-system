const Payment = require('../models/Payment');
const Student = require('../models/Student');

/**
 * @desc    Get all payments (Admin only)
 * @route   GET /api/payments
 */
exports.getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find().populate('studentId', 'userId').sort({ paymentDate: -1 });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get payments for current student
 * @route   GET /api/payments/my
 */
exports.getMyPayments = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const payments = await Payment.find({ studentId: student._id }).sort({ paymentDate: -1 });
    res.status(200).json({ payments });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Create payment (Student)
 * @route   POST /api/payments
 */
exports.createPayment = async (req, res) => {
  try {
    const student = await Student.findOne({ userId: req.user.mongoId });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const payment = new Payment({
      ...req.body,
      studentId: student._id
    });
    await payment.save();
    res.status(201).json({ payment });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Get payment by ID
 * @route   GET /api/payments/:id
 */
exports.getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ payment });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Update payment (Admin)
 * @route   PUT /api/payments/:id
 */
exports.updatePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ payment });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Delete payment (Admin)
 * @route   DELETE /api/payments/:id
 */
exports.deletePayment = async (req, res) => {
  try {
    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: "Payment not found" });
    res.status(200).json({ message: "Payment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};