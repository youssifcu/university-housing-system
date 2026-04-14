const Building = require('../models/Building');
const Room = require('../models/Room');
const mongoose = require('mongoose');

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
// GET /api/buildings
// ==========================================
exports.getAllBuildings = async (req, res) => {
    try {
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        // Filter by gender
        const filter = {};
        if (req.query.gender) {
            filter.gender = req.query.gender;
        }

        const [buildings, total] = await Promise.all([
            Building.find(filter)
                .populate('supervisorId', 'name phoneNumber')
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Building.countDocuments(filter)
        ]);

        const isStudent = req.userRole === 'student';

        const formattedBuildings = buildings.map(b => {
            const buildingObj = {
                id: b._id,
                name: b.name,
                gender: b.gender,
                description: b.description
            };
            
            if (!isStudent) {
                buildingObj.floors = b.floors;
                buildingObj.supervisor = b.supervisorId?.name || 'Not Assigned';
            }
            
            return buildingObj;
        });

        return sendSuccess(res, 200, 'Buildings fetched successfully', {
            buildings: formattedBuildings,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('Get All Buildings Error:', error);
        return sendError(res, 500, 'Failed to retrieve buildings', error.message);
    }
};

// ==========================================
// GET /api/buildings/:id
// ==========================================
exports.getBuildingById = async (req, res) => {
    try {
        const { id } = req.params;

        // التحقق من صحة الـ ID
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid building ID format');
        }

        const building = await Building.findById(id)
            .populate('supervisorId', 'name phoneNumber email')
            .lean();

        if (!building) {
            return sendError(res, 404, 'Building not found');
        }

        const isStudent = req.userRole === 'student';
        let buildingStats = null;

        if (!isStudent) {
            // حساب الإحصائيات باستخدام Aggregation Pipeline (أسرع من جلب كل الغرف)
            const stats = await Room.aggregate([
                { $match: { buildingId: building._id } },
                {
                    $group: {
                        _id: null,
                        totalRooms: { $sum: 1 },
                        availableRooms: {
                            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                        },
                        fullRooms: {
                            $sum: { $cond: [{ $eq: ['$status', 'full'] }, 1, 0] }
                        },
                        totalCapacity: { $sum: '$capacity' },
                        currentOccupantsCount: { $sum: { $size: '$currentOccupants' } }
                    }
                }
            ]);

            buildingStats = stats.length > 0 ? stats[0] : {
                totalRooms: 0,
                availableRooms: 0,
                fullRooms: 0,
                totalCapacity: 0,
                currentOccupantsCount: 0
            };

            // حذف _id من الإحصائيات
            delete buildingStats._id;
        }

        const responseData = {
            building: {
                id: building._id,
                name: building.name,
                gender: building.gender,
                description: building.description
            }
        };

        if (!isStudent) {
            responseData.building.floors = building.floors;
            responseData.building.supervisor = building.supervisorId || null;
            responseData.building.createdAt = building.createdAt;
            responseData.building.updatedAt = building.updatedAt;
            responseData.stats = buildingStats;
        }

        return sendSuccess(res, 200, 'Building fetched successfully', responseData);

    } catch (error) {
        console.error('Get Building By ID Error:', error);
        return sendError(res, 500, 'Failed to retrieve building', error.message);
    }
};

// ==========================================
// POST /api/buildings (Admin Only)
// ==========================================
exports.createBuilding = async (req, res) => {
    try {
        // 1. ضفنا الـ grade هنا عشان نستلمه
        const { name, gender, floors, description, supervisorId, grade } = req.body;

        // 2. ضفنا الـ grade في التحقق المبدئي
        if (!name || !gender || !floors || grade === undefined) {
            return sendError(res, 400, 'Name, gender, floors, and grade are required');
        }

        if (!['male', 'female'].includes(gender)) {
            return sendError(res, 400, 'Gender must be either "male" or "female"');
        }

        if (typeof floors !== 'number' || floors < 1) {
            return sendError(res, 400, 'Floors must be a positive number');
        }

        // 3. التحقق من أن الـ grade رقم بين 1 و 10 (زي ما الموديل طالب)
        if (typeof grade !== 'number' || grade < 1 || grade > 10) {
            return sendError(res, 400, 'Grade must be a number between 1 and 10');
        }

        const existingBuilding = await Building.findOne({ 
            name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
        }).select('_id').lean();

        if (existingBuilding) {
            return sendError(res, 400, 'A building with this name already exists');
        }

        // 4. أضفنا الـ grade للبيانات اللي هتتحفظ في الداتابيز ✅
        const buildingData = {
            name: name.trim(),
            gender,
            floors,
            grade, 
            ...(description && { description: description.trim() }),
            ...(supervisorId && mongoose.Types.ObjectId.isValid(supervisorId) && { supervisorId })
        };

        const newBuilding = new Building(buildingData);
        await newBuilding.save();

        return sendSuccess(res, 201, 'Building created successfully', {
            id: newBuilding._id,
            name: newBuilding.name
        });

    } catch (error) {
        console.error('Create Building Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to create building', error.message);
    }
};

// ==========================================
// PUT /api/buildings/:id (Admin Only)
// ==========================================
exports.updateBuilding = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid building ID format');
        }

        // تحديد الحقول المسموح بتحديثها فقط (منع Mass Assignment)
        const allowedUpdates = ['name', 'gender', 'floors', 'grade', 'description', 'supervisorId'];
        const updates = {};

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                let value = req.body[field];
                if (typeof value === 'string') {
                    value = value.trim();
                }
                updates[field] = value;
            }
        });

        // التحقق من صحة gender إذا تم تحديثها
        if (updates.gender && !['male', 'female'].includes(updates.gender)) {
            return sendError(res, 400, 'Gender must be either "male" or "female"');
        }

        // التحقق من floors إذا تم تحديثها
        if (updates.floors !== undefined && (typeof updates.floors !== 'number' || updates.floors < 1)) {
            return sendError(res, 400, 'Floors must be a positive number');
        }

        if (updates.grade !== undefined && (typeof updates.grade !== 'number' || updates.grade < 1 || updates.grade > 10)) {
            return sendError(res, 400, 'Grade must be a number between 1 and 10');
        }

        // التحقق من supervisorId إذا تم إرساله
        if (updates.supervisorId && !mongoose.Types.ObjectId.isValid(updates.supervisorId)) {
            return sendError(res, 400, 'Invalid supervisor ID format');
        }

        if (Object.keys(updates).length === 0) {
            return sendError(res, 400, 'No valid fields provided for update');
        }

        // التحقق من عدم وجود مبنى آخر بنفس الاسم إذا تم تحديث الاسم
        if (updates.name) {
            const existing = await Building.findOne({
                _id: { $ne: id },
                name: { $regex: new RegExp(`^${updates.name}$`, 'i') }
            }).select('_id').lean();

            if (existing) {
                return sendError(res, 400, 'Another building with this name already exists');
            }
        }

        const updatedBuilding = await Building.findByIdAndUpdate(
            id,
            { $set: updates },
            { new: true, runValidators: true }
        ).select('_id name gender floors description supervisorId');

        if (!updatedBuilding) {
            return sendError(res, 404, 'Building not found');
        }

        return sendSuccess(res, 200, 'Building updated successfully', {
            building: updatedBuilding
        });

    } catch (error) {
        console.error('Update Building Error:', error);
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return sendError(res, 400, 'Validation failed', messages);
        }
        return sendError(res, 500, 'Failed to update building', error.message);
    }



};

// ==========================================
// DELETE /api/buildings/:id (Admin Only)
// ==========================================
exports.deleteBuilding = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return sendError(res, 400, 'Invalid building ID format');
        }

        // 🚀 تنفيذ الـ Soft Delete بناءً على الـ Schema بتاعك
        const building = await Building.findByIdAndUpdate(
            id,
            { $set: { status: 'inactive' } }, // 'inactive' موجودة في الـ enum عندك
            { new: true }
        );

        if (!building) {
            return sendError(res, 404, 'Building not found');
        }

        // 🚀 قفل الأوض التابعة للمبنى (تحويلها لصيانة)
        await Room.updateMany(
            { buildingId: id },
            { $set: { status: 'maintenance' } }
        );

        return sendSuccess(res, 200, `Building "${building.name}" deactivated successfully`);
    } catch (error) {
        return sendError(res, 500, 'Failed to deactivate building', error.message);
    }
};