const Housing = require('../models/Housing');

// get all listings (public)
exports.getAllHousings = async (req, res) => {
  try {
    const housings = await Housing.find();
    res.status(200).json({ message: 'Fetched housings successfully', data: housings });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// get single housing by id
exports.getHousingById = async (req, res) => {
  try {
    const housing = await Housing.findById(req.params.id);
    if (!housing) {
      return res.status(404).json({ message: 'Housing not found' });
    }
    res.status(200).json({ message: 'Housing retrieved', data: housing });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// admin only
exports.createHousing = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' });
    }
    const { title, description, address, price, images, available } = req.body;
    const housing = new Housing({ title, description, address, price, images, available });
    await housing.save();
    res.status(201).json({ message: 'Housing created', data: housing });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// admin only
exports.updateHousing = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' });
    }
    const housing = await Housing.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!housing) {
      return res.status(404).json({ message: 'Housing not found' });
    }
    res.status(200).json({ message: 'Housing updated', data: housing });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// admin only
exports.deleteHousing = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: admin only' });
    }
    const housing = await Housing.findByIdAndDelete(req.params.id);
    if (!housing) {
      return res.status(404).json({ message: 'Housing not found' });
    }
    res.status(200).json({ message: 'Housing deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
