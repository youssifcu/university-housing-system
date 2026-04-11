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
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = getDatedFolder();
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        // توليد اسم فريد: time_random.ext
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const cleanName = path.basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9\u0600-\u06FF]/g, '_') // يدعم العربية
            .substring(0, 50);
        cb(null, `${cleanName}-${uniqueSuffix}${ext}`);
    }
});

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