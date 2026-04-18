const {
    verifyRole,
    isStudent,
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isAdminOrMealAdmin,
    isAdminOrSupervisor,
    isAdminOrSupervisorOrFloorAdmin,
    checkStudentApproval
} = require('./authMiddleware');

module.exports = {
    verifyRole,
    isStudent,
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isAdminOrMealAdmin,
    isAdminOrSupervisor,
    isAdminOrSupervisorOrFloorAdmin,
    checkStudentApproval
};

