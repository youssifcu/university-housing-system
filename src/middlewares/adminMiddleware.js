const isAdmin = (req, res, next) => {
    // استخدام req.userDoc لأن verifyToken يضيفه
    const user = req.userDoc || req.user;
    
    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    if (user.role === 'admin') {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Admin privileges required'
        });
    }
};

module.exports = isAdmin;