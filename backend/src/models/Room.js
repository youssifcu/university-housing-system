const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    trim: true
  },
  buildingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Building',
    required: [true, 'Room must belong to a building']
  },
  floorNumber: {
    type: Number,
    required: [true, 'Floor number is required']
  },
  capacity: {
    type: Number,
    required: [true, 'Room capacity is required'],
    default: 4
  },
  // تخزين الـ IDs بتاعة الطلاب اللي جوه الأوضة فعلياً
  currentOccupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance'],
    default: 'available'
  }
}, {
  timestamps: true
});

// Middleware: تحديث حالة الغرفة تلقائياً بناءً على عدد الطلاب
roomSchema.pre('save', function (next) {
  if (this.currentOccupants.length >= this.capacity) {
    this.status = 'full';
  } else if (this.status !== 'maintenance') {
    this.status = 'available';
  }
  next();
});

const Room = mongoose.model('Room', roomSchema);

module.exports = Room;