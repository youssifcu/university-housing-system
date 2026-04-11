const isAdmin = (req, res, next) => {
    if (req.userDoc && req.userDoc.role === 'admin') return next();
    return res.status(403).json({ success: false, message: 'Admin access required' });
};

const isAdminOrSupervisor = (req, res, next) => {
    if (req.userDoc && ['admin', 'supervisor'].includes(req.userDoc.role)) return next();
    return res.status(403).json({ success: false, message: 'Admin or Supervisor access required' });
};

module.exports = { isAdmin, isAdminOrSupervisor };