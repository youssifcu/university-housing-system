const multer = require('multer');
const path = require('path');
const fs = require('fs');

// التأكد من وجود المجلد الرئيسي
const baseUploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(baseUploadDir)) {
    fs.mkdirSync(baseUploadDir, { recursive: true });
}

// إنشاء مجلد فرعي حسب السنة/الشهر لتنظيم الملفات
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

// إعدادات التخزين
const storage = multer.memoryStorage();

// فلتر الملفات: PDF فقط
const fileFilter = (req, file, cb) => {
    const allowedMimes = ['application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('مسموح فقط بملفات PDF'), false);
    }
};

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
        files: 5 // أقصى عدد للملفات في الطلب الواحد
    },
    fileFilter: fileFilter
});

module.exports = upload;