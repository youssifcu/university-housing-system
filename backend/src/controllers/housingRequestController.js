const HousingRequest = require('../models/HousingRequest');

// POST /api/housing-requests (Student role)
exports.submitRequest = async (req, res) => {
  try {
    const student = await require('../models/Student').findOne({ userId: req.user.mongoId });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const { type, fromRoomId, toRoomId, reason, startDate, endDate } = req.body;

    if (type === 'vacate' && (!startDate || !endDate)) {
      return res.status(400).json({ message: 'startDate and endDate required for vacate' });
    }

    const newRequest = new HousingRequest({
      studentId: student._id,
      type,
      fromRoomId,
      toRoomId,
      reason,
      startDate,
      endDate
    });
    const savedRequest = await newRequest.save();
    res.status(201).json({
      id: savedRequest._id,
      status: savedRequest.status
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET /api/housing-requests (Admin only)
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await HousingRequest.find()
      .select('type status'); // Matches your "Expected Response" image
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/housing-requests/:id
exports.getRequestById = async (req, res) => {
  try {
    const request = await HousingRequest.findById(req.params.id)
      .select('type fromRoomId status'); // Matches your "Expected Response" image
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PATCH /api/housing-requests/:id/status (Admin only)
exports.updateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await HousingRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        reviewedBy: req.user.mongoId
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });

    if (status === 'approved' && request.type === 'vacate') {
      // Set student status to suspended
      await require('../models/Student').findByIdAndUpdate(request.studentId, { housingStatus: 'suspended' });

      // Cancel meal bookings during leave
      const MealBooking = require('../models/MealBooking');
      await MealBooking.updateMany(
        {
          studentId: request.studentId,
          date: { $gte: request.startDate, $lte: request.endDate },
          status: 'booked'
        },
        { status: 'cancelled' }
      );
    }

    res.status(200).json({ message: 'Status updated' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};