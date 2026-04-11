const Building = require('../models/Building');
const Room = require('../models/Room');

// ================= الحصول على كل المباني =================
exports.getAllBuildings = async (req, res) => {
  try {
    const buildings = await Building.find().populate('supervisorId', 'name phoneNumber');
    
    const formattedBuildings = buildings.map(b => ({
      id: b._id,
      name: b.name,
      gender: b.gender,
      floors: b.floors,
      supervisor: b.supervisorId ? b.supervisorId.name : 'Not Assigned'
    }));

    res.status(200).json({ success: true, count: buildings.length, buildings: formattedBuildings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to retrieve buildings", error: error.message });
  }
};

// ================= الحصول على مبنى محدد بإحصائياته =================
exports.getBuildingById = async (req, res) => {
  try {
    const building = await Building.findById(req.params.id).populate('supervisorId', 'name phoneNumber email');
    if (!building) return res.status(404).json({ success: false, message: "Building not found" });

    // حساب إحصائيات الغرف داخل المبنى لـ Sprint 2
    const rooms = await Room.find({ buildingId: building._id });
    const stats = {
      totalRooms: rooms.length,
      availableRooms: rooms.filter(r => r.status === 'available').length,
      fullRooms: rooms.filter(r => r.status === 'full').length,
      totalCapacity: rooms.reduce((acc, curr) => acc + curr.capacity, 0),
      currentOccupantsCount: rooms.reduce((acc, curr) => acc + curr.currentOccupants.length, 0)
    };

    res.status(200).json({ success: true, building, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= إضافة مبنى جديد (Admin Only) =================
exports.createBuilding = async (req, res) => {
  try {
    const { name, gender, floors, description, supervisorId } = req.body;

    const existingBuilding = await Building.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingBuilding) return res.status(400).json({ message: "A building with this name already exists." });

    const newBuilding = new Building({ name, gender, floors, description, supervisorId });
    await newBuilding.save();

    res.status(201).json({ success: true, message: "Building created successfully", id: newBuilding._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= تحديث بيانات مبنى =================
exports.updateBuilding = async (req, res) => {
  try {
    const updatedBuilding = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBuilding) return res.status(404).json({ success: false, message: "Building not found" });

    res.status(200).json({ success: true, message: "Building updated", data: updatedBuilding });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};