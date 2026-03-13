const Student = require('../models/Student');
const Application = require('../models/Application');
const crypto = require('crypto'); // Built-in Node tool to generate QR strings

/**
 * @desc    Submit a new housing application
 * @route   POST /api/applications
 * @access  Private (User/Student)
 */
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.user.mongoId;

    // 1. Check if user already has a pending or approved application
    const existingApp = await Application.findOne({ userId });
    if (existingApp) {
      return res.status(400).json({ 
        message: "You have already submitted an application. Current status: " + existingApp.status 
      });
    }

    // 2. Create the application with data from req.body and the userId from the token
    const newApplication = new Application({
      ...req.body,
      userId: userId,
      status: 'pending' // Default status
    });

    const savedApplication = await savedApplication.save();

    res.status(201).json({
      message: "Application submitted successfully",
      id: savedApplication._id,
      status: savedApplication.status,
      submittedAt: savedApplication.createdAt
    });
  } catch (error) {
    console.error("Application Submission Error:", error);
    res.status(500).json({ 
      message: "Failed to submit application", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get all applications submitted by the logged-in user
 * @route   GET /api/applications/my
 * @access  Private (User/Student)
 */
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.mongoId;

    // Find applications belonging to this user
    // We sort by createdAt: -1 to show the newest one first
    const applications = await Application.find({ userId }).sort({ createdAt: -1 });

    // Format the response to match your documentation
    const formattedApps = applications.map(app => ({
      id: app._id,
      status: app.status,
      submittedAt: app.createdAt
    }));

    res.status(200).json(formattedApps);
  } catch (error) {
    console.error("Fetch My Applications Error:", error);
    res.status(500).json({ 
      message: "Failed to retrieve your applications", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get all applications (Admin only)
 * @route   GET /api/applications
 * @access  Private (Admin)
 */
exports.getAllApplications = async (req, res) => {
  try {
    // Fetch all applications from the database
    // .select() allows us to only send the fields the admin needs for the list view
    const applications = await Application.find()
      .select('fullName status createdAt')
      .sort({ createdAt: -1 });

    const formattedApps = applications.map(app => ({
      id: app._id,
      fullName: app.fullName,
      status: app.status
    }));

    res.status(200).json(formattedApps);
  } catch (error) {
    console.error("Fetch All Applications Error:", error);
    res.status(500).json({ 
      success: false,
      message: "Failed to retrieve applications", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get details of a specific application
 * @route   GET /api/applications/:id
 * @access  Private (Admin or Owner)
 */
exports.getApplicationById = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Security Check: Only an admin OR the student who created it can view the details
    const isOwner = application.userId.toString() === req.user.mongoId;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access Denied: You cannot view this application" });
    }

    // Return the specific fields mentioned in your requirement
    res.status(200).json({
      id: application._id,
      fullName: application.fullName,
      college: application.college,
      status: application.status
      // You can add more fields here like nationalId, etc., if needed
    });
  } catch (error) {
    console.error("Fetch Application Details Error:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

/**
 * @desc    Update an application before it is reviewed
 * @route   PATCH /api/applications/:id
 * @access  Private (Owner only)
 */
exports.updateApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.mongoId;

    // 1. Find the application
    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // 2. Security: Only the owner can update their own application
    if (application.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to edit this application" });
    }

    // 3. Business Logic: Prevent edits if it's already approved or rejected
    if (application.status !== 'pending') {
      return res.status(400).json({ 
        message: "Application cannot be edited once it has been " + application.status 
      });
    }

    // 4. Update the fields provided in the request body
    // Using { new: true, runValidators: true } ensures we get the updated doc back
    const updatedApp = await Application.findByIdAndUpdate(
      id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Application updated",
      application: updatedApp
    });
  } catch (error) {
    console.error("Update Application Error:", error);
    res.status(500).json({ message: "Failed to update application", error: error.message });
  }
};


/**
 * @desc    Approve application and auto-create a Student record (Admin only)
 * @route   PATCH /api/applications/:id/approve
 */
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the application
    const application = await Application.findById(id);
    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    if (application.status === 'approved') {
      return res.status(400).json({ message: "Application is already approved" });
    }

    // 2. Update Application status
    application.status = 'approved';
    await application.save();

    // 3. Create a unique QR Code string
    // This string can be converted to a QR image on the frontend
    const qrCodeString = `STU-${application.nationalId}-${crypto.randomBytes(4).toString('hex')}`;

    // 4. Map Application data to the Student model
    const newStudent = new Student({
      userId: application.userId,
      fullName: application.fullName,
      nationalId: application.nationalId,
      college: application.college,
      academicYear: application.academicYear,
      qrCode: qrCodeString,
      status: 'active'
    });

    await newStudent.save();

    res.status(200).json({
      message: "Application approved",
      studentId: newStudent._id
    });
  } catch (error) {
    console.error("Approval Error:", error);
    res.status(500).json({ message: "Failed to approve application", error: error.message });
  }
};

/**
 * @desc    Reject an application with a reason (Admin only)
 * @route   PATCH /api/applications/:id/reject
 */
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ message: "A rejection reason is required." });
    }

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Business Logic: Don't reject if already approved
    if (application.status === 'approved') {
      return res.status(400).json({ 
        message: "Cannot reject an application that has already been approved." 
      });
    }

    // Update the application
    application.status = 'rejected';
    application.rejectionReason = rejectionReason; // Save the reason for the student to see
    
    await application.save();

    res.status(200).json({
      message: "Application rejected"
    });
  } catch (error) {
    console.error("Rejection Error:", error);
    res.status(500).json({ message: "Failed to reject application", error: error.message });
  }
};

/**
 * @desc    Delete an application
 * @route   DELETE /api/applications/:id
 * @access  Private (Owner or Admin)
 */
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.mongoId;
    const isAdmin = req.user.role === 'admin';

    const application = await Application.findById(id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Security: Only the owner or an admin can delete
    if (application.userId.toString() !== userId && !isAdmin) {
      return res.status(403).json({ message: "Not authorized to delete this application" });
    }

    // Logic: Prevent deletion of approved applications (unless admin)
    if (application.status === 'approved' && !isAdmin) {
      return res.status(400).json({ 
        message: "You cannot delete an approved application. Please contact support." 
      });
    }

    await Application.findByIdAndDelete(id);

    res.status(200).json({
      message: "Application deleted"
    });
  } catch (error) {
    console.error("Delete Application Error:", error);
    res.status(500).json({ message: "Failed to delete application", error: error.message });
  }
};