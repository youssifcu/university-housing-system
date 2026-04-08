const { User } = require('../models/User');

const verifyRole = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = await User.findOne({ firebaseUid: req.user.uid });
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
        });
      }
      req.userDoc = user;
      next();
    } catch (error) {
      res.status(500).json({ message: 'Authorization error', error: error.message });
    }
  };
};

const isStudent = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user || user.role !== 'student') {
      return res.status(403).json({ message: 'Access denied: Student role required' });
    }
    req.userDoc = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

const isAdmin = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    const adminRoles = ['computer_admin', 'floor_admin', 'meal_admin', 'supervisor'];
    if (!user || !adminRoles.includes(user.role)) {
      return res.status(403).json({ message: 'Access denied: Admin role required' });
    }
    req.userDoc = user;
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

const checkStudentApproval = async (req, res, next) => {
  try {
    const user = await User.findOne({ firebaseUid: req.user.uid });
    if (!user) return res.status(401).json({ message: 'User not found' });

    if (user.role === 'student' && user.registrationStatus !== 'approved') {
      return res.status(403).json({ 
        message: 'Your account is pending approval. Please wait for admin confirmation.'
      });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Authorization error', error: error.message });
  }
};

module.exports = {
  verifyRole,
  isStudent,
  isAdmin,
  checkStudentApproval,
  isSupervisor: verifyRole(['supervisor']),
  isFloorSupervisor: verifyRole(['floor_admin']),
  isMealAdmin: verifyRole(['meal_admin']),
  isComputerAdmin: verifyRole(['computer_admin'])
};