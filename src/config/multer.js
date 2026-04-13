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

// 🚀 التعديل هنا: فلتر الملفات يقبل PDF وصور
const fileFilter = (req, file, cb) => {
    // ضفنا صيغ الصور الشائعة جنب الـ PDF
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    
    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        // عدلنا رسالة الخطأ عشان توضح المسموح بيه
        cb(new Error('مسموح فقط بملفات PDF أو الصور (JPG, PNG)'), false); 
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
