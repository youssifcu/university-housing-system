const admin = require('../config/firebase');
const { User } = require('../models/User');

/**
 * Middleware to verify Firebase ID token and attach user data to request.
 * - Verifies token from Authorization header.
 * - Fetches corresponding user document from MongoDB (if exists).
 * - Sets req.user, req.userDoc, and req.userRole for downstream use.
 */
const verifyFirebaseToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // 1. Check if token exists
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: No token provided'
        });
    }

    const token = authHeader.split('Bearer ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access Denied: Invalid token format'
        });
    }

    try {
        // 2. Verify token with Firebase
        const decodedToken = await admin.auth().verifyIdToken(token);

        // 3. Attempt to fetch user from MongoDB (using .lean() for performance)
        const userDoc = await User.findOne({ firebaseUid: decodedToken.uid })
            .select('-__v') // Exclude version key
            .lean(); // Returns plain JS object, faster for read-only

        if (!userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Authenticated Firebase user not found in application database. Please register first.'
            });
        }

        // 4. Attach data to request object
        req.user = decodedToken;                // Full Firebase user object
        req.userDoc = userDoc;                  // MongoDB user object
        req.userRole = userDoc.role;            // Role string (useful for checks)

        next();
    } catch (error) {
        console.error('🔥 Firebase Token Verification Error:', error.message);
        
        // Handle specific Firebase errors
        let message = 'Invalid or expired token';
        if (error.code === 'auth/id-token-expired') {
            message = 'Token expired. Please login again.';
        } else if (error.code === 'auth/argument-error') {
            message = 'Malformed token provided.';
        }

        return res.status(403).json({
            success: false,
            message
        });
    }
};

module.exports = verifyFirebaseToken;