const StudentRequest = require('../models/StudentRequest');
const { User, Student } = require('../models/User');
const admin = require('../config/firebase');


exports.submitRequest = async (req, res) => {
  try {
    const { requestType, title, description, priority } = req.body;
    const studentId = req.userDoc._id;

    const validTypes = ['room_change', 'complaint', 'leave_request', 'meal_exception', 'maintenance'];
    if (!validTypes.includes(requestType)) {
      return res.status(400).json({ message: 'Invalid request type' });
    }

    let requestedAdminRole;
    switch (requestType) {
      case 'room_change':
        requestedAdminRole = 'supervisor';
        break;
      case 'complaint':
        requestedAdminRole = 'supervisor';
        break;
      case 'leave_request':
        requestedAdminRole = 'supervisor';
        break;
      case 'meal_exception':
        requestedAdminRole = 'meal_admin';
        break;
      case 'maintenance':
        requestedAdminRole = 'floor_admin';
        break;
    }

    const newRequest = new StudentRequest({
      studentId,
      requestType,
      title,
      description,
      requestedAdminRole,
      priority: priority || 'medium',
      status: 'submitted'
    });

    await newRequest.save();

    res.status(201).json({
      message: 'Request submitted successfully',
      request: newRequest
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit request', error: error.message });
  }
};


exports.getRequestsForAdmin = async (req, res) => {
  try {
    const userRole = req.userDoc.role;
    
    // Get all requests assigned to this admin's role
    const requests = await StudentRequest.find({ requestedAdminRole: userRole })
      .populate('studentId', 'name studentId email')
      .populate('assignedToUserId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch requests', error: error.message });
  }
};


exports.assignRequestToSelf = async (req, res) => {
  try {
    const { requestId } = req.params;
    const adminId = req.userDoc._id;

    const request = await StudentRequest.findByIdAndUpdate(
      requestId,
      {
        assignedToUserId: adminId,
        status: 'in_review'
      },
      { new: true }
    ).populate('studentId', 'name email');

    res.status(200).json({
      message: 'Request assigned to you',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to assign request', error: error.message });
  }
};


exports.addRequestMessage = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;
    const adminId = req.userDoc._id;

    const request = await StudentRequest.findByIdAndUpdate(
      requestId,
      {
        $push: {
          messages: {
            userId: adminId,
            userRole: req.userDoc.role,
            message,
            timestamp: new Date()
          }
        },
        updatedAt: new Date()
      },
      { new: true }
    ).populate('messages.userId', 'name email');

    res.status(200).json({
      message: 'Message added',
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to add message', error: error.message });
  }
};


exports.respondToRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, statusReason } = req.body;
    const adminId = req.userDoc._id;

    if (!['approved', 'rejected', 'needs_revision'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const request = await StudentRequest.findByIdAndUpdate(
      requestId,
      {
        status,
        statusReason: statusReason || '',
        reviewedBy: adminId,
        reviewedAt: new Date()
      },
      { new: true }
    ).populate('studentId', 'name email firebaseUid');

    try {
      await admin.auth().getUserByEmail(request.studentId.email);
    } catch (error) {
      console.error('Email notification failed:', error);
    }

    res.status(200).json({
      message: `Request ${status}`,
      request
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to respond to request', error: error.message });
  }
};


exports.getRequestDetails = async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await StudentRequest.findById(requestId)
      .populate('studentId', 'name studentId email')
      .populate('assignedToUserId', 'name email')
      .populate('messages.userId', 'name role');

    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    res.status(200).json(request);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch request', error: error.message });
  }
};