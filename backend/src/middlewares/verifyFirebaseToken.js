const admin = require('../config/firebase');
const { User } = require('../models/User'); // تأكد من استدعاء الـ User صح

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: "Access Denied: Token missing" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // بنجيب اليوزر مرة واحدة هنا عشان نوفر الـ Queries قدام
    const userDoc = await User.findOne({ firebaseUid: decodedToken.uid });
    
    req.user = decodedToken; // بيانات الفايربيز
    req.userDoc = userDoc;   // بيانات المونجو (بما فيها الـ role)
    req.userRole = userDoc ? userDoc.role : 'guest';
    
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(403).json({ success: false, message: "Invalid or expired token" });
  }
};

module.exports = verifyFirebaseToken;