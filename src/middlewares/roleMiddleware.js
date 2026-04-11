const {
    verifyRole,
    isStudent,
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isAdminOrSupervisor,
    checkStudentApproval
} = require('./authMiddleware');

module.exports = {
    verifyRole,
    isStudent,
    isAdmin,
    isSupervisor,
    isFloorAdmin,
    isMealAdmin,
    isAdminOrSupervisor,
    checkStudentApproval
};