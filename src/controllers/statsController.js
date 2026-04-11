const { User } = require('../models/User');
const Application = require('../models/Application');
const Room = require('../models/Room');
const MealBooking = require('../models/MealBooking');
const Payment = require('../models/Payment');

// ==========================================
// Helpers للتنسيق الموحد
// ==========================================
const sendSuccess = (res, statusCode, message, data = null) => {
    return res.status(statusCode).json({
        success: true,
        message,
        ...(data && { data })
    });
};

const sendError = (res, statusCode, message, errorDetails = null) => {
    const response = { success: false, message };
    if (errorDetails && process.env.NODE_ENV === 'development') {
        response.error = errorDetails;
    }
    return res.status(statusCode).json(response);
};

// ==========================================
// GET /api/stats/students-by-college
// ==========================================
exports.getStudentsByCollege = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { 
                $match: { 
                    role: 'student', 
                    housingStatus: 'active',
                    faculty: { $ne: null, $ne: '' } 
                } 
            },
            { 
                $group: { 
                    _id: '$faculty', 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { count: -1 } }
        ]);

        return sendSuccess(res, 200, 'Students by college statistics', { stats });
    } catch (error) {
        console.error('Get Students By College Error:', error);
        return sendError(res, 500, 'Failed to fetch statistics', error.message);
    }
};

// ==========================================
// GET /api/stats/students-by-grade
// ==========================================
exports.getStudentsByGrade = async (req, res) => {
    try {
        const stats = await User.aggregate([
            { 
                $match: { 
                    role: 'student', 
                    housingStatus: 'active',
                    universityYear: { $ne: null } 
                } 
            },
            { 
                $group: { 
                    _id: '$universityYear', 
                    count: { $sum: 1 } 
                } 
            },
            { $sort: { _id: 1 } }
        ]);

        return sendSuccess(res, 200, 'Students by grade statistics', { stats });
    } catch (error) {
        console.error('Get Students By Grade Error:', error);
        return sendError(res, 500, 'Failed to fetch statistics', error.message);
    }
};

// ==========================================
// GET /api/stats/buildings-availability
// ==========================================
exports.getBuildingsAvailability = async (req, res) => {
    try {
        const stats = await Room.aggregate([
            {
                $group: {
                    _id: '$buildingId',
                    totalCapacity: { $sum: '$capacity' },
                    currentOccupancy: { $sum: { $size: '$currentOccupants' } }
                }
            },
            {
                $lookup: {
                    from: 'buildings',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'buildingInfo'
                }
            },
            { $unwind: { path: '$buildingInfo', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    buildingId: '$_id',
                    buildingName: { $ifNull: ['$buildingInfo.name', 'Unknown'] },
                    gender: '$buildingInfo.gender',
                    totalCapacity: 1,
                    currentOccupancy: 1,
                    available: { $subtract: ['$totalCapacity', '$currentOccupancy'] },
                    occupancyRate: {
                        $cond: [
                            { $eq: ['$totalCapacity', 0] },
                            0,
                            { $multiply: [{ $divide: ['$currentOccupancy', '$totalCapacity'] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { buildingName: 1 } }
        ]);

        return sendSuccess(res, 200, 'Buildings availability statistics', { stats });
    } catch (error) {
        console.error('Get Buildings Availability Error:', error);
        return sendError(res, 500, 'Failed to fetch availability', error.message);
    }
};

// ==========================================
// GET /api/stats/meals-preparation
// ==========================================
exports.getMealsPreparationStats = async (req, res) => {
    try {
        let targetDate = new Date();
        if (req.query.date) {
            targetDate = new Date(req.query.date);
            if (isNaN(targetDate)) {
                return sendError(res, 400, 'Invalid date format');
            }
        }
        targetDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(targetDate);
        nextDate.setDate(nextDate.getDate() + 1);

        const stats = await MealBooking.aggregate([
            { 
                $match: { 
                    date: { $gte: targetDate, $lt: nextDate }, 
                    status: 'booked' 
                } 
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'studentId',
                    foreignField: '_id',
                    as: 'student'
                }
            },
            { $unwind: '$student' },
            { 
                $match: { 
                    'student.housingStatus': { $nin: ['suspended', 'banned'] } 
                } 
            },
            {
                $lookup: {
                    from: 'meals',
                    localField: 'mealId',
                    foreignField: '_id',
                    as: 'mealInfo'
                }
            },
            { $unwind: '$mealInfo' },
            {
                $group: {
                    _id: '$mealId',
                    mealName: { $first: '$mealInfo.name' },
                    mealType: { $first: '$mealInfo.type' },
                    requiredCount: { $sum: 1 },
                    servedCount: { 
                        $sum: { $cond: [{ $eq: ['$isServed', true] }, 1, 0] } 
                    }
                }
            },
            { $sort: { mealType: 1 } }
        ]);

        return sendSuccess(res, 200, 'Meals preparation statistics', { 
            date: targetDate,
            stats 
        });
    } catch (error) {
        console.error('Get Meals Preparation Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch meal stats', error.message);
    }
};

// ==========================================
// GET /api/stats/payments
// ==========================================
exports.getPaymentsStats = async (req, res) => {
    try {
        const result = await Payment.aggregate([
            {
                $facet: {
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalAmount: { $sum: '$amount' },
                                totalPayments: { $sum: 1 }
                            }
                        }
                    ],
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 },
                                amount: { $sum: '$amount' }
                            }
                        }
                    ],
                    byMethod: [
                        {
                            $group: {
                                _id: '$paymentMethod',
                                count: { $sum: 1 },
                                amount: { $sum: '$amount' }
                            }
                        }
                    ]
                }
            }
        ]);

        const stats = {
            summary: result[0].summary[0] || { totalAmount: 0, totalPayments: 0 },
            byStatus: result[0].byStatus,
            byMethod: result[0].byMethod
        };

        return sendSuccess(res, 200, 'Payment statistics', { stats });
    } catch (error) {
        console.error('Get Payments Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch payment stats', error.message);
    }
};

// ==========================================
// GET /api/stats/dashboard
// ==========================================
exports.getDashboardStats = async (req, res) => {
    try {
        const [
            totalStudents,
            totalRooms,
            availableRooms,
            pendingApplications,
            todayMeals,
            pendingPayments
        ] = await Promise.all([
            User.countDocuments({ role: 'student', housingStatus: 'active' }),
            Room.countDocuments(),
            Room.countDocuments({ status: 'available' }),
            Application.countDocuments({ status: 'pending' }),
            (() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);
                return MealBooking.countDocuments({ date: { $gte: today, $lt: tomorrow } });
            })(),
            Payment.countDocuments({ status: 'pending' })
        ]);

        return sendSuccess(res, 200, 'Dashboard statistics', {
            stats: {
                totalStudents,
                totalRooms,
                availableRooms,
                pendingApplications,
                todayMeals,
                pendingPayments
            }
        });
    } catch (error) {
        console.error('Get Dashboard Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch dashboard stats', error.message);
    }
};

// ==========================================
// GET /api/stats/rooms
// ==========================================
exports.getRoomsStats = async (req, res) => {
    try {
        const stats = await Room.aggregate([
            {
                $facet: {
                    byStatus: [
                        {
                            $group: {
                                _id: '$status',
                                count: { $sum: 1 },
                                totalCapacity: { $sum: '$capacity' },
                                currentOccupancy: { $sum: { $size: '$currentOccupants' } }
                            }
                        }
                    ],
                    byBuilding: [
                        {
                            $group: {
                                _id: '$buildingId',
                                roomCount: { $sum: 1 },
                                totalCapacity: { $sum: '$capacity' },
                                currentOccupancy: { $sum: { $size: '$currentOccupants' } }
                            }
                        },
                        {
                            $lookup: {
                                from: 'buildings',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'buildingInfo'
                            }
                        },
                        { $unwind: { path: '$buildingInfo', preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                buildingName: { $ifNull: ['$buildingInfo.name', 'Unknown'] },
                                roomCount: 1,
                                totalCapacity: 1,
                                currentOccupancy: 1,
                                occupancyRate: {
                                    $cond: [
                                        { $eq: ['$totalCapacity', 0] },
                                        0,
                                        { $multiply: [{ $divide: ['$currentOccupancy', '$totalCapacity'] }, 100] }
                                    ]
                                }
                            }
                        },
                        { $sort: { buildingName: 1 } }
                    ],
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalRooms: { $sum: 1 },
                                totalCapacity: { $sum: '$capacity' },
                                totalOccupancy: { $sum: { $size: '$currentOccupants' } }
                            }
                        },
                        {
                            $project: {
                                totalRooms: 1,
                                totalCapacity: 1,
                                totalOccupancy: 1,
                                overallOccupancyRate: {
                                    $cond: [
                                        { $eq: ['$totalCapacity', 0] },
                                        0,
                                        { $multiply: [{ $divide: ['$totalOccupancy', '$totalCapacity'] }, 100] }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        const result = {
            summary: stats[0].summary[0] || { totalRooms: 0, totalCapacity: 0, totalOccupancy: 0, overallOccupancyRate: 0 },
            byStatus: stats[0].byStatus,
            byBuilding: stats[0].byBuilding
        };

        return sendSuccess(res, 200, 'Room statistics', { stats: result });
    } catch (error) {
        console.error('Get Rooms Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch room stats', error.message);
    }
};

// ==========================================
// GET /api/stats/meals
// ==========================================
exports.getMealsStats = async (req, res) => {
    try {
        const result = await MealBooking.aggregate([
            {
                $facet: {
                    byDate: [
                        {
                            $group: {
                                _id: {
                                    $dateToString: { format: '%Y-%m-%d', date: '$date' }
                                },
                                totalBookings: { $sum: 1 },
                                servedCount: { $sum: { $cond: [{ $eq: ['$isServed', true] }, 1, 0] } },
                                cancelledCount: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                            }
                        },
                        { $sort: { '_id': -1 } },
                        { $limit: 30 } // Last 30 days
                    ],
                    byMealType: [
                        {
                            $lookup: {
                                from: 'meals',
                                localField: 'mealId',
                                foreignField: '_id',
                                as: 'mealInfo'
                            }
                        },
                        { $unwind: { path: '$mealInfo', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: { $ifNull: ['$mealInfo.mealType', 'unknown'] },
                                totalBookings: { $sum: 1 },
                                servedCount: { $sum: { $cond: [{ $eq: ['$isServed', true] }, 1, 0] } }
                            }
                        },
                        { $sort: { totalBookings: -1 } }
                    ],
                    summary: [
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                totalServed: { $sum: { $cond: [{ $eq: ['$isServed', true] }, 1, 0] } },
                                totalCancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } }
                            }
                        },
                        {
                            $project: {
                                totalBookings: 1,
                                totalServed: 1,
                                totalCancelled: 1,
                                serviceRate: {
                                    $cond: [
                                        { $eq: ['$totalBookings', 0] },
                                        0,
                                        { $multiply: [{ $divide: ['$totalServed', '$totalBookings'] }, 100] }
                                    ]
                                }
                            }
                        }
                    ]
                }
            }
        ]);

        const stats = {
            summary: result[0].summary[0] || { totalBookings: 0, totalServed: 0, totalCancelled: 0, serviceRate: 0 },
            byDate: result[0].byDate,
            byMealType: result[0].byMealType
        };

        return sendSuccess(res, 200, 'Meal statistics', { stats });
    } catch (error) {
        console.error('Get Meals Stats Error:', error);
        return sendError(res, 500, 'Failed to fetch meal stats', error.message);
    }
};