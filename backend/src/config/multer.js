const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Verify that the main folder exists
const baseUploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

// Create a subfolder by year/month to organize files
const getDatedFolder = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const folder = path.join(baseUploadDir, `${year}`, `${month}`);
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
    return folder;
};

// Storage settings
const storage = multer.memoryStorage();

// 🚀 Edit here: File filter accepts PDF and images
const fileFilter = (req, file, cb) => {
    // We added common image formats next to the PDF
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF files or images (JPG, PNG) are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // Maximum number of files in one request
    },
    fileFilter: fileFilter
});

module.exports = upload;
