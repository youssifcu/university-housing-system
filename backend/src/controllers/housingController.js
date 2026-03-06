const HousingApplication = require("../models/HousingApplication");
const fs = require('fs');

exports.applyHousing = async (req, res) => {
  try {
    const filesData = {};
    if (req.files) {
      Object.keys(req.files).forEach((key) => {
        const file = req.files[key][0];
        filesData[key] = {
          data: fs.readFileSync(file.path),
          contentType: file.mimetype
        };
        if (fs.existsSync(file.path)) fs.unlinkSync(file.path);
      });
    }

    const existingApp = await HousingApplication.findOne({ userId: req.user.uid });

    if (existingApp) {
      if (existingApp.status === "pending") {
        return res.status(403).json({ 
          success: false, 
          message: "Application is currently under review and locked." 
        });
      }

      const isEditable = ["needs_update", "rejected"].includes(existingApp.status);
      if (isEditable) {
        const updateData = {
          ...req.body,
          status: "pending",
          rejectionReason: ""
        };

        if (Object.keys(filesData).length > 0) {
          updateData.files = { ...existingApp.files, ...filesData };
        }

        await HousingApplication.findOneAndUpdate(
          { userId: req.user.uid },
          { $set: updateData }
        );
        return res.status(200).json({ success: true, message: "Updated" });
      }
      return res.status(400).json({ success: false, message: "Action not allowed" });
    }

    const application = new HousingApplication({
      ...req.body,
      files: filesData,
      userId: req.user.uid,
      status: "pending"
    });

    await application.save();
    res.status(201).json({ success: true, message: "Saved" });

  } catch (err) {
    if (req.files) {
      Object.keys(req.files).forEach(key => {
        const filePath = req.files[key][0].path;
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      });
    }
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getUserApplications = async (req, res) => {
  try {
    const applications = await HousingApplication.find({ userId: req.user.uid })
      .select("-files")
      .sort({ createdAt: -1 });
    res.status(200).json(applications);
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.getOptions = async (req, res) => {
  res.status(200).json({
    faculties: ["Engineering", "Medicine", "Commerce", "Science", "Arts", "Law"],
    levels: ["First Year", "Second Year", "Third Year", "Fourth Year", "Fifth Year"],
    departments: ["Computer Science", "Information Systems", "Civil Engineering", "Mechanical Engineering", "Electrical Engineering"],
    housingTypes: ["Normal", "Special"],
    grades: ["Excellent", "Very Good", "Good", "Pass"],
    previousHousing: ["Stayed Before", "Never Stayed"],
    parentStatuses: ["Alive", "Deceased", "Divorced"],
    governorates: {
      "Cairo": { "Nasr City": ["Zone 1", "Zone 2"], "Helwan": ["Helwan Area"] },
      "Giza": { "Dokki": ["Area 1"], "6 October": ["District 1", "District 2"] }
    }
  });
};