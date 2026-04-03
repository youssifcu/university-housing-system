const isSupervisorOrAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'floor_supervisor')) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'Access Denied: Supervisor or Admin required' });
};

module.exports = isSupervisorOrAdmin;
