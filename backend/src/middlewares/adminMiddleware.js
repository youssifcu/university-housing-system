const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // User is admin, proceed to the controller
    } else {
        return res.status(403).json({ 
            success: false, 
            message: 'Access Denied: Admin privileges required' 
        });
    }
};

module.exports = isAdmin;