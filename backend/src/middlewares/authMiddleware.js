const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    // اليوزر مش موجود في الداتا بيز أصلاً
    if (!req.userDoc) {
      return res.status(401).json({ success: false, message: 'User profile not found in database' });
    }

    // التأكد من الـ Role
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        success: false,
        message: `Access denied. Required roles: ${allowedRoles.join(', ')}` 
      });
    }
    next();
  };
};

// تشيك على حالة القبول للطلاب
const checkStudentApproval = (req, res, next) => {
  if (req.userRole === 'student') {
    if (req.userDoc.registrationStatus !== 'approved') {
      return res.status(403).json({ 
        success: false,
        message: 'Your account is pending approval. Please wait for admin confirmation.'
      });
    }
  }
  next();
};

module.exports = {
  verifyRole,
  isStudent: verifyRole(['student']),
  isAdmin: verifyRole(['computer_admin', 'floor_admin', 'meal_admin', 'supervisor']),
  isSupervisor: verifyRole(['supervisor']),
  isFloorAdmin: verifyRole(['floor_admin']),
  checkStudentApproval,
  // اختصار لأي رول مستقبلاً
  isComputerAdmin: verifyRole(['computer_admin']),
  isMealAdmin: verifyRole(['meal_admin'])
};