const express = require("express");
const router = express.Router();
const multer = require("multer");
const fs = require("fs");
const { applyHousing, getOptions, getUserApplications } = require("../controllers/housingController");
const verifyAuth = require("../middlewares/verifyFirebaseToken");

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/[^a-zA-Z0-9.]/g, "_"));
  }
});

const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } });

router.get("/options", getOptions);
router.get("/user-applications", verifyAuth, getUserApplications);
router.post("/apply", verifyAuth, upload.fields([
  { name: "studentId", maxCount: 1 },
  { name: "fatherId", maxCount: 1 },
  { name: "utilityBill", maxCount: 1 },
  { name: "criminalRecord", maxCount: 1 },
  { name: "clearance", maxCount: 1 },
  { name: "medicalReport", maxCount: 1 }
]), applyHousing);

module.exports = router;