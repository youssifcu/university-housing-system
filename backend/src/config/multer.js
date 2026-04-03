const multer = require('multer');

// Keep uploaded file in memory so we can store it directly in MongoDB.
const storage = multer.memoryStorage();

// 2. Check file type (Allow only PDFs)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit: 5MB
  fileFilter
});

module.exports = upload;