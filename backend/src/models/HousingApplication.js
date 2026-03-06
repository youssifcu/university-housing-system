const mongoose = require("mongoose");

const HousingApplicationSchema = new mongoose.Schema({
  name: String,
  nationalId: String,
  studentAffairsNumber: String,
  gender: String,
  religion: String,
  birthDate: String,
  birthPlace: String,
  faculty: String,
  academicLevel: String,
  department: String,
  gov: String,
  city: String,
  village: String,
  addressDetails: String,
  email: String,
  mobile: String,
  fatherName: String,
  fatherNationalId: String,
  fatherJob: String,
  fatherPhone: String,
  fatherAddress: String,
  guardianName: String,
  guardianRelation: String,
  guardianMobile: String,
  parentStatus: String,
  lastYearGrade: String,
  gpa: String,
  previousHousing: String,
  housingType: String,
  noFood: { type: Boolean, default: false },
  specialNeeds: { type: Boolean, default: false },
  chronicIllness: { type: Boolean, default: false },
  familyAbroad: { type: Boolean, default: false },
  files: {
    studentId: { data: Buffer, contentType: String },
    fatherId: { data: Buffer, contentType: String },
    utilityBill: { data: Buffer, contentType: String },
    criminalRecord: { data: Buffer, contentType: String },
    clearance: { data: Buffer, contentType: String },
    medicalReport: { data: Buffer, contentType: String }
  },
  userId: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "accepted", "rejected", "needs_update"],
    default: "pending"
  },
  rejectionReason: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("HousingApplication", HousingApplicationSchema);