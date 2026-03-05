const admin = require('../config/firebase');
const User = require('../models/User'); // Import your User model

const verifyFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access Denied: Token missing" });
  }

  const token = authHeader.split('Bearer ')[1];

  try {
    // 1. Verify the token with Firebase
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // 2. Fetch the user's role from your MongoDB
    const userDoc = await User.findOne({ firebaseUid: decodedToken.uid });
    
    // 3. Attach both Firebase data and MongoDB role to the request object
    req.user = {
      ...decodedToken,
      role: userDoc ? userDoc.role : 'student' // Default to student if not found
    };
    
    next();
  } catch (error) {
    console.error("Token Verification Error:", error);
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

module.exports = verifyFirebaseToken;
