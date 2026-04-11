const { User, Student } = require('../models/User');
const Application = require('../models/Application');
const Building = require('../models/Building');
const Room = require('../models/Room');
const crypto = require('crypto');

// ================= تقديم طلب سكن جديد (Student Only) =================
exports.submitApplication = async (req, res) => {
  try {
    const userId = req.userDoc._id;

    // التأكد إن الطالب ملوش طلب حالي شغال
    const existingApp = await Application.findOne({ 
      userId, 
      status: { $in: ['pending', 'approved', 'needs_update'] } 
    });

    if (existingApp) {
      return res.status(400).json({ success: false, message: "You already have an active application." });
    }

    // إنشاء الطلب بكل البيانات اللي جاية من الموبايل/الويب
    const newApplication = new Application({ 
      ...req.body, 
      userId, 
      status: 'pending' 
    });

    const savedApplication = await newApplication.save();

    res.status(201).json({
      success: true,
      message: "Application submitted successfully",
      applicationId: savedApplication._id
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= الموافقة على الطلب والتسكين التلقائي (Admin Only) =================
exports.approveApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findById(id);
    if (!application) return res.status(404).json({ message: "Application not found" });
    
    if (application.status === 'approved') return res.status(400).json({ message: "This application is already approved" });

    // 1. البحث عن المباني اللي تناسب نوع الطالب (ذكر/أنثى)
    const targetBuildings = await Building.find({ gender: application.gender }).select('_id');
    const buildingIds = targetBuildings.map(b => b._id);

    if (buildingIds.length === 0) {
      return res.status(400).json({ message: `No buildings found for ${application.gender} students` });
    }

    // 2. البحث عن أول غرفة متاحة في المباني دي
    const selectedRoom = await Room.findOne({
      buildingId: { $in: buildingIds },
      status: 'available'
    }).sort({ floorNumber: 1, roomNumber: 1 }); // التسكين يبدأ من الأدوار الأولى

    if (!selectedRoom) {
      return res.status(400).json({ message: "Housing is full. No available rooms for this gender." });
    }

    // 3. إنشاء الـ QR Codes (Attendance & Meal) بناءً على الـ Student Schema
    const uniqueHash = crypto.randomBytes(3).toString('hex').toUpperCase();
    const attendanceCode = `ATT-${application.nationalId.slice(-4)}-${uniqueHash}`;
    const mealCode = `MEAL-${application.nationalId.slice(-4)}-${uniqueHash}`;
    
    // 4. تحديث بيانات الـ User ليصبح Student "نشط" ومسكن
    await User.findByIdAndUpdate(application.userId, {
      $set: {
        nationalId: application.nationalId,
        universityYear: application.academicYear,
        faculty: application.college,
        housingStatus: 'active', // عشان الـ Login يفتح
        applicationId: application._id,
        assignedRoomId: selectedRoom._id,
        roomAllocationDate: new Date(),
        'qrCode.attendanceCode': attendanceCode,
        'qrCode.mealCode': mealCode
      }
    });

    // 5. تحديث الغرفة: إضافة الطالب للمصفوفة
    selectedRoom.currentOccupants.push(application.userId);
    // الـ Middleware (pre-save) اللي في الـ Room Model هيغير الحالة لـ Full لو الأوضة كملت
    await selectedRoom.save();

    // 6. تحديث حالة الطلب
    application.status = 'approved';
    application.reviewedBy = req.userDoc._id;
    await application.save();

    res.status(200).json({ 
        success: true, 
        message: `Application approved! Student assigned to Room ${selectedRoom.roomNumber}`,
        roomDetails: {
            roomNumber: selectedRoom.roomNumber,
            floor: selectedRoom.floorNumber
        }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= رفض الطلب (Admin Only) =================
exports.rejectApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const application = await Application.findByIdAndUpdate(id, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: req.userDoc._id
    }, { new: true });

    if (!application) return res.status(404).json({ message: "Application not found" });

    res.status(200).json({ success: true, message: "Application rejected" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= عرض كل الطلبات (Admin Only) =================
exports.getAllApplications = async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('userId', 'name email phoneNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: applications.length, applications });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ================= عرض طلبي الحالي (Student Only) =================
exports.getMyApplication = async (req, res) => {
  try {
    const application = await Application.findOne({ userId: req.userDoc._id })
      .sort({ createdAt: -1 });
    
    if (!application) return res.status(404).json({ success: false, message: "No application found" });

    res.status(200).json({ success: true, application });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};