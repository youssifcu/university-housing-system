/**
 * Middleware factory to verify user roles
 * @param {string[]} allowedRoles - Array of roles allowed to access the route
 */
const verifyRole = (allowedRoles) => {
    return (req, res, next) => {
        // User must exist in database
        if (!req.userDoc) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. User profile not found.'
            });
        }

        // Check if user's role is in the allowed list
        if (!allowedRoles.includes(req.userDoc.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}`
            });
        }
        next();
    };
};

/**
 * Middleware to check if student is approved/active
 * (Only applies to users with role 'student')
 */
const checkStudentApproval = (req, res, next) => {
    if (req.userDoc?.role === 'student') {
        // Use housingStatus field to determine approval
        if (req.userDoc.housingStatus === 'new_applicant') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending approval. Please wait for admin confirmation.'
            });
        }
        if (req.userDoc.housingStatus === 'banned') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been banned. Please contact administration.'
            });
        }
    }
    next();
};

// Predefined role middlewares
const isStudent = verifyRole(['student']);
const isAdmin = verifyRole(['admin']);
const isSupervisor = verifyRole(['supervisor']);
const isFloorAdmin = verifyRole(['floor_admin']);
const isMealAdmin = verifyRole(['meal_admin']);
const isAdminOrMealAdmin = verifyRole(['admin', 'meal_admin']);
const isAdminOrSupervisor = verifyRole(['admin', 'supervisor']);
const isAdminOrSupervisorOrFloorAdmin = verifyRole(['admin', 'supervisor', 'floor_admin']);

module.exports = {
    verifyRole,
    isStudent,
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isAdminOrMealAdmin,
    isAdminOrSupervisor,
    checkStudentApproval,
    isAdminOrSupervisorOrFloorAdmin 
};