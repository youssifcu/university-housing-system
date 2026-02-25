const admin = require('../config/firebase');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "غير مسموح بالدخول: الـ Token مفقود" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    req.user = decodedToken;
    
    next();
  } catch (error) {
    console.error("خطأ في التحقق من الـ Token:", error);
    return res.status(403).json({ message: "الـ Token غير صالح أو منتهي الصلاحية" });
  }
};

module.exports = verifyFirebaseToken;
