const HousingRequest = require('../models/HousingRequest');
const { User } = require('../models/User');
const Room = require('../models/Room');

// ================= تقديم طلب جديد (Student Only) =================
exports.submitRequest = async (req, res) => {
  try {
    const studentId = req.userDoc._id;
    const { type, toRoomId, reason, startDate, endDate } = req.body;

    // التأكد من التواريخ للطلبات الزمنية (إجازة أو إخلاء مؤقت)
    if ((type === 'vacate' || type === 'leave') && (!startDate || !endDate)) {
      return res.status(400).json({ success: false, message: 'startDate and endDate are required for this type' });
    }

    const newRequest = new HousingRequest({
      studentId,
      type, // 'transfer', 'leave', 'vacate', 'maintenance'
      fromRoomId: req.userDoc.assignedRoomId, // بناخد غرفته الحالية أوتوماتيك
      toRoomId, // في حالة طلب نقل لغرفة معينة
      reason,
      startDate,
      endDate
    });

    await newRequest.save();

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      id: newRequest._id,
      status: newRequest.status
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= الحصول على كل الطلبات (Admin Only) =================
exports.getAllRequests = async (req, res) => {
  try {
    const requests = await HousingRequest.find()
      .populate('studentId', 'name studentId profilePicture')
      .populate('fromRoomId', 'roomNumber')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= تفاصيل طلب محدد (Admin or Student Owner) =================
exports.getRequestById = async (req, res) => {
  try {
    const request = await HousingRequest.findById(req.params.id)
      .populate('studentId', 'name email phoneNumber faculty studentId')
      .populate('fromRoomId', 'roomNumber floorNumber')
      .populate('toRoomId', 'roomNumber floorNumber')
      .populate('reviewedBy', 'name role');

    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    // حماية: الطالب م يشوفش طلبات زمايله
    if (req.userDoc.role === 'student' && request.studentId._id.toString() !== req.userDoc._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized access' });
    }

    res.status(200).json({ success: true, request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ================= الرد وتحديث الحالة + تنفيذ الأكشن (Admin Only) =================
exports.updateStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    const requestId = req.params.id;

    const request = await HousingRequest.findById(requestId);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });

    if (status === 'approved') {
      const student = await User.findById(request.studentId);
      
      // 1. منطق تبديل الغرفة (Transfer)
      if (request.type === 'transfer' && request.toRoomId) {
        const newRoom = await Room.findById(request.toRoomId);
        if (newRoom && newRoom.status === 'available') {
          // إزالة من الغرفة القديمة
          await Room.findByIdAndUpdate(request.fromRoomId, { $pull: { currentOccupants: student._id } });
          // إضافة للغرفة الجديدة
          newRoom.currentOccupants.push(student._id);
          await newRoom.save();
          // تحديث بيانات الطالب
          student.assignedRoomId = newRoom._id;
        }
      }

      // 2. منطق الإجازة (Leave)
      if (request.type === 'leave') {
        student.housingStatus = 'suspended'; // الطالب في إجازة حالياً
      }

      // 3. منطق الإخلاء النهائي (Vacate)
      if (request.type === 'vacate') {
        student.housingStatus = 'inactive';
        student.assignedRoomId = null;
        await Room.findByIdAndUpdate(request.fromRoomId, { $pull: { currentOccupants: student._id } });
      }

      await student.save();
    }

    // تحديث بيانات الطلب نفسه
    request.status = status;
    request.reviewedBy = req.userDoc._id;
    request.reviewedAt = new Date();
    if (adminComment) request.comments = adminComment;

    await request.save();

    res.status(200).json({ 
        success: true, 
        message: `Request marked as ${status}`,
        comment: adminComment 
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ================= عرض طلباتي أنا (Student Only - Mobile) =================
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await HousingRequest.find({ studentId: req.userDoc._id })
      .populate('fromRoomId', 'roomNumber')
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};