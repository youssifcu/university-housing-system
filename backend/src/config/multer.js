const multer = require('multer');
const path = require('path');

// 1. Set storage engine (where to save files)
const storage = multer.diskStorage({
  destination: './uploads/applications/',
  filename: (req, file, cb) => {
    // Rename file: studentID-timestamp.pdf
    cb(null, `${req.user.uid}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// 2. Check file type (Allow only PDFs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
  fileFilter: fileFilter
});

module.exports = upload;