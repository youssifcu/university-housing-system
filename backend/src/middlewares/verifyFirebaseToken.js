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
    
    // FIX: Match the field name from your User model (firebaseUID)
    const userDoc = await User.findOne({ firebaseUID: decodedToken.uid });
    
    req.user = {
      ...decodedToken,
      // Pass the MongoDB _id as well, it's very useful for your controllers
      mongoId: userDoc ? userDoc._id : null,
      role: userDoc ? userDoc.roles : 'user' // Note: your model used 'roles' (plural)
    };
    
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyFirebaseToken;
