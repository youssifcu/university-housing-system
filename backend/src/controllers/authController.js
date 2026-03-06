const { Student, ComputerAdmin, FloorAdmin, RestaurantAdmin, User } = require('../models/User');
const admin = require('../config/firebase');

exports.registerUser = async (req, res) => {
  try {
    const { email, password, name, studentId, universityYear, faculty, phoneNumber } = req.body;

    if (!email || !password || !name || !studentId) {
      return res.status(400).json({ message: 'Core student fields are required' });
    }

    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    let profilePictureBase64 = '';
    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const mimeType = req.file.mimetype;
      profilePictureBase64 = `data:${mimeType};base64,${b64}`;
    }

    const newUser = new Student({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name,
      phoneNumber,
      profilePicture: profilePictureBase64,
      studentId,
      universityYear,
      faculty,
      housingStatus: 'new_applicant',
      role: 'student' 
    });

    await newUser.save();
    res.status(201).json({ message: 'Student registered successfully', user: newUser });

  } catch (error) {
    res.status(500).json({ message: 'Registration failed', detail: error.message });
  }
};

exports.adminCreateUser = async (req, res) => {
  try {
    const currentUser = await User.findOne({ firebaseUid: req.user.uid });
    
    if (!currentUser || currentUser.role !== 'computer_admin') {
      return res.status(403).json({ message: 'Access denied: Only Computer Admin can create staff accounts' });
    }

    const { email, password, name, role, phoneNumber, ...extraData } = req.body;

    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    let TargetModel;
    switch (role) {
      case 'computer_admin': TargetModel = ComputerAdmin; break;
      case 'floor_admin': TargetModel = FloorAdmin; break;
      case 'restaurant_admin': TargetModel = RestaurantAdmin; break;
      default: return res.status(400).json({ message: 'Invalid Admin Role' });
    }

    const newUser = new TargetModel({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name,
      phoneNumber,
      role,
      ...extraData
    });

    await newUser.save();
    res.status(201).json({ message: 'Staff account created successfully', user: newUser });

  } catch (error) {
    res.status(500).json({ message: 'Failed to create staff account', detail: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isActive || (user.role === 'student' && user.housingStatus === 'banned')) {
      return res.status(403).json({ message: 'This account is banned or inactive' });
    }

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.getUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  try {
    const { uid } = req.user;
    const { name, phoneNumber, ...otherData } = req.body;
    
    let updateData = { name, phoneNumber, ...otherData };

    if (req.file) {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const mimeType = req.file.mimetype;
      updateData.profilePicture = `data:${mimeType};base64,${b64}`;
    }

    const updatedUser = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    res.status(200).json({ message: 'Profile updated', user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
  
};
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({ message: 'No account found with this email address' });
    }

    const resetLink = await admin.auth().generatePasswordResetLink(email);

    res.status(200).json({ 
      success: true,
      message: 'Reset link generated',
      link: resetLink 
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Error', error: error.message });
  }
};