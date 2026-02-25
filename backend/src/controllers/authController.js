const User = require('../models/User');

exports.loginUser = async (req, res) => {
  try {
    const { firebaseUID } = req.body;

    // بنبحث عن اليوزر بس
    let user = await User.findOne({ firebaseUID });

    if (!user) {
      // لو مش موجود، مش هنكريت، هنرفض الدخول
      return res.status(404).json({ 
        message: "هذا الحساب غير موجود، برجاء التسجيل أولاً" 
      });
    }

    res.status(200).json({ message: "تم تسجيل الدخول بنجاح", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

exports.registerUser = async (req, res) => {
  try {
    const { uid, email, name } = req.user; // جاية من التوكن (أمان 100%)
    const { universityID, phoneNumber, faculty } = req.body;

    let user = await User.findOne({ firebaseUID: uid });
    if (user) {
      return res.status(400).json({ message: "أنت مسجل بالفعل في النظام" });
    }

    user = new User({
      firebaseUID: uid,
      email,
      name,
      universityID,
      phoneNumber,
      faculty
    });

    await user.save();
    res.status(201).json({ message: "تم إنشاء الحساب بنجاح", user });
  } catch (error) {
    res.status(500).json({ message: "فشل في عملية التسجيل", error: error.message });
  }
};
