const HousingRequest = require('../models/HousingRequest');

// POST /api/housing-requests (Student role)
exports.submitRequest = async (req, res) => {
  try {
    const newRequest = new HousingRequest({
      ...req.body,
      // Pulled from your verifyToken middleware
      studentId: req.user.studentId 
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

// PATCH /api/housing-requests/:id/approve (Admin only)
exports.approveRequest = async (req, res) => {
  try {
    const request = await HousingRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'approved',
        reviewedBy: req.user.uid // The Admin's ID from token
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Request approved' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH /api/housing-requests/:id/reject (Admin only)
exports.rejectRequest = async (req, res) => {
  try {
    const { reason } = req.body;
    const request = await HousingRequest.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'rejected',
        reviewedBy: req.user.uid
        // Note: 'reason' will be accepted if you add it to your schema later, 
        // currently it just returns the message below.
      },
      { new: true }
    );
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Request rejected' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};