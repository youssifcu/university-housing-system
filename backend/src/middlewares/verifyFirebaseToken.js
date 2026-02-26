const admin = require('../config/firebase');

const User = require('../models/User');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "غير مسموح بالدخول: الـ Token مفقود" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // attach firebase data
    req.user = decodedToken;

    // enrich with database record if exists (to get role, university info, etc.)
    const userDoc = await User.findOne({ firebaseUID: decodedToken.uid });
    if (userDoc) {
      req.user.role = userDoc.role;
      req.user.dbId = userDoc._id;
    }
    
    next();
  } catch (error) {
    console.error("خطأ في التحقق من الـ Token:", error);
    return res.status(403).json({ message: "الـ Token غير صالح أو منتهي الصلاحية" });
  }
};

module.exports = verifyFirebaseToken;
