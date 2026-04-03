const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const Student = require('../src/models/Student');
const Room = require('../src/models/Room');
const Attendance = require('../src/models/Attendance');
const Meal = require('../src/models/Meal');
const MealBooking = require('../src/models/MealBooking');
const mongoose = require('mongoose');

beforeAll(async () => {
  // Connect to test DB if needed
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('API Tests', () => {
  let adminToken, studentToken, studentId, roomId, mealId, qrCode;

  test('1. Register → login → submit application → admin approves → student created → QR code generated', async () => {
    // Register user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        firebaseToken: 'fakeToken', // In real test, use valid token
        name: 'Test Student',
        email: 'student@test.com',
        phone: '123456789'
      });
    expect(registerRes.status).toBe(201);

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        firebaseToken: 'fakeToken'
      });
    expect(loginRes.status).toBe(200);
    studentToken = loginRes.body.user; // Assume token is returned

    // Submit application
    const appRes = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        studentType: 'New',
        nationality: 'Test',
        nationalId: '123456789',
        shuonId: '123',
        fullName: 'Test Student',
        dateOfBirth: '2000-01-01',
        placeOfBirth: 'Test',
        gender: 'male',
        religion: 'Test',
        residenceAddress: 'Test',
        detailedAddress: 'Test',
        phone: '123',
        mobile: '123',
        fatherName: 'Father',
        fatherNationalId: '123',
        fatherJob: 'Job',
        fatherPhone: '123',
        fatherAddress: 'Addr',
        guardianName: 'Guardian',
        guardianRelation: 'Relation',
        guardianNationalId: '123',
        guardianPhone: '123',
        guardianAddress: 'Addr',
        parentsStatus: 'Married',
        college: 'Engineering',
        academicYear: '2023',
        lastYearGrade: 'A',
        gradePercentage: 90,
        previousHousing: false,
        housingType: 'Normal',
        hasSpecialNeeds: false,
        familyAbroad: false,
        hasMedicalCondition: false
      });
    expect(appRes.status).toBe(201);
    const applicationId = appRes.body.id;

    // Admin approve (need admin token)
    // Assume admin exists or create
    const approveRes = await request(app)
      .patch(`/api/applications/${applicationId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send();
    expect(approveRes.status).toBe(200);

    // Check student created
    const student = await Student.findOne({ applicationId });
    expect(student).toBeTruthy();
    expect(student.qrCode).toBeTruthy();
    qrCode = student.qrCode;
    studentId = student._id;
  });

  test('2. QR scan for attendance', async () => {
    // Create building and room if needed
    const building = await Room.findOne(); // Assume exists
    const scanRes = await request(app)
      .post('/api/attendance/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        qrCode,
        buildingId: building.buildingId
      });
    expect(scanRes.status).toBe(201);

    // Check attendance marked
    const attendance = await Attendance.findOne({ studentId, status: 'present' });
    expect(attendance).toBeTruthy();
  });

  test('3. QR scan for meal', async () => {
    // Create meal and booking
    const meal = await Meal.create({
      name: 'Test Meal',
      mealType: 'lunch',
      price: 10,
      date: new Date()
    });
    mealId = meal._id;

    await MealBooking.create({
      studentId,
      mealId,
      date: new Date(),
      status: 'booked'
    });

    const scanRes = await request(app)
      .post('/api/meals/scan')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        qrCode,
        mealId
      });
    expect(scanRes.status).toBe(200);

    // Check served
    const booking = await MealBooking.findOne({ studentId, mealId, isServed: true });
    expect(booking).toBeTruthy();
  });

  test('4. Room assignment and occupancy update', async () => {
    // Create room
    const room = await Room.create({
      buildingId: mongoose.Types.ObjectId(),
      floorNumber: 1,
      roomNumber: '101',
      capacity: 2,
      currentOccupancy: 0,
      status: 'available'
    });
    roomId = room._id;

    const assignRes = await request(app)
      .patch(`/api/rooms/${roomId}/assign`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        studentId,
        bedNumber: 1
      });
    expect(assignRes.status).toBe(200);

    // Check occupancy
    const updatedRoom = await Room.findById(roomId);
    expect(updatedRoom.currentOccupancy).toBe(1);

    const student = await Student.findById(studentId);
    expect(student.roomId.toString()).toBe(roomId.toString());
    expect(student.bedNumber).toBe(1);
  });
});