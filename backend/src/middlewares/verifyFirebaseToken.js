const admin = require('../config/firebase');
const User = require('../models/User');

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access Denied: Token missing" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const userDoc = await User.findOne({ firebaseUid: decodedToken.uid });
    
    if (userDoc) {
      req.user = decodedToken;
      req.userRole = userDoc.role;
      req.userDoc = userDoc;
    } else {
      req.user = decodedToken;
      req.userRole = 'guest';
    }
    
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyFirebaseToken;