const isSupervisorOrAdmin = (req, res, next) => {
    const user = req.userDoc || req.user;

    if (!user) {
        return res.status(401).json({
            success: false,
            message: 'Authentication required'
        });
    }

    const allowedRoles = ['admin', 'supervisor', 'floor_admin'];

    if (allowedRoles.includes(user.role)) {
        next();
    } else {
        return res.status(403).json({
            success: false,
            message: 'Access Denied: Supervisor or Admin privileges required'
        });
    }
};

module.exports = isSupervisorOrAdmin;