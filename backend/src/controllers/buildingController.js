const Building = require('../models/Building');

/**
 * @desc    Get all buildings
 * @route   GET /api/buildings
 * @access  Private (Student/Admin)
 */
exports.getAllBuildings = async (req, res) => {
  try {
    // Fetch buildings from the database
    const buildings = await Building.find();

    // Mapping to match your exact expected response format
    const formattedBuildings = buildings.map(b => ({
      id: b._id,
      name: b.name,
      gender: b.gender, // e.g., 'male' or 'female'
      floors: b.floors
    }));

    res.status(200).json(formattedBuildings);
  } catch (error) {
    console.error("Fetch Buildings Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to retrieve buildings", 
      error: error.message 
    });
  }
};

/**
 * @desc    Get a specific building by ID
 * @route   GET /api/buildings/:id
 * @access  Private (Student/Admin)
 */
exports.getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const building = await Building.findById(id);

    if (!building) {
      return res.status(404).json({ 
        success: false, 
        message: "Building not found" 
      });
    }

    // Matching the expected response format from your image
    res.status(200).json({
      id: building._id,
      name: building.name,
      gender: building.gender
    });
  } catch (error) {
    console.error("Fetch Building Detail Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server Error", 
      error: error.message 
    });
  }
};

/**
 * @desc    Add a new building (Admin only)
 * @route   POST /api/buildings
 * @access  Private (Admin)
 */
exports.createBuilding = async (req, res) => {
  try {
    const { name, gender, floors } = req.body;

    // Basic validation
    if (!name || !gender || !floors) {
      return res.status(400).json({ message: "Please provide name, gender, and floor count." });
    }

    // Check if building already exists
    const existingBuilding = await Building.findOne({ name });
    if (existingBuilding) {
      return res.status(400).json({ message: "A building with this name already exists." });
    }

    const newBuilding = new Building({
      name,
      gender,
      floors
    });

    await newBuilding.save();

    res.status(201).json({
      id: newBuilding._id,
      message: "Building created"
    });
  } catch (error) {
    console.error("Create Building Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to create building", 
      error: error.message 
    });
  }
};

/**
 * @desc    Update a building (Admin only)
 * @route   PUT /api/buildings/:id
 * @access  Private (Admin)
 */
exports.updateBuilding = async (req, res) => {
  try {
    const updatedBuilding = await Building.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedBuilding) {
      return res.status(404).json({ success: false, message: "Building not found" });
    }

    res.status(200).json({ 
      success: true,
      message: "Building updated successfully",
      data: updatedBuilding 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Update failed", error: error.message });
  }
};