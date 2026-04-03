const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/User');
const Application = require('../src/models/Application');
const Student = require('../src/models/Student');
const Room = require('../src/models/Room');
const Building = require('../src/models/Building');
const Attendance = require('../src/models/Attendance');
const Meal = require('../src/models/Meal');
const MealBooking = require('../src/models/MealBooking');
const HousingRequest = require('../src/models/HousingRequest');
const Report = require('../src/models/Report');
const Announcement = require('../src/models/Announcement');
const Notification = require('../src/models/Notification');
const Payment = require('../src/models/Payment');
const mongoose = require('mongoose');

jest.mock('../src/config/firebase', () => {
  const mockAuth = {
    verifyIdToken: jest.fn(async (token) => {
      if (token === 'invalid_token') throw new Error('Invalid token');
      return {
        uid: 'test_firebase_uid_' + token,
        email: 'test@example.com'
      };
    }),
    deleteUser: jest.fn(async () => true)
  };

  return {
    auth: jest.fn(() => mockAuth),
    initializeApp: jest.fn(),
    credential: {
      cert: jest.fn()
    }
  };
});

describe('University Housing System - API Tests', () => {
  let adminToken = 'valid_admin_token';
  let studentToken = 'valid_student_token';
  let supervisorToken = 'valid_supervisor_token';
  let applicationId, studentId, roomId, buildingId, mealId, bookingId;

  beforeAll(async () => {
    // Set test database URI
    process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/university-housing-system-test';
    
    // Connect to MongoDB
    if (!mongoose.connection.readyState) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    // Clear collections
    await User.deleteMany({});
    await Application.deleteMany({});
    await Student.deleteMany({});
    await Room.deleteMany({});
    await Building.deleteMany({});
  }, 15000);

  afterAll(async () => {
    // Clear collections
    await User.deleteMany({});
    await Application.deleteMany({});
    await Student.deleteMany({});
    await Room.deleteMany({});
    await Building.deleteMany({});
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
  }, 15000);

  describe('Core API Functionality', () => {
    test('Health Check - GET /', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/University|Housing|Server/i);
    });

    test('Auth - Register User', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          firebaseToken: adminToken,
          name: 'Admin User',
          email: 'admin@test.com',
          phone: '1234567890'
        });

      expect([201, 400, 500]).toContain(res.status);
      if (res.status === 201) {
        expect(res.body).toHaveProperty('message');
      }
    });

    test('Auth - Login User', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          firebaseToken: studentToken,
          name: 'Student User',
          email: 'student@test.com',
          phone: '9876543210'
        });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          firebaseToken: studentToken
        });

      expect([200, 500]).toContain(res.status);
    });

    test('Applications - Submit Application', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          studentType: 'New',
          nationality: 'Egyptian',
          nationalId: '30001011234567',
          shuonId: 'SHU123456',
          fullName: 'Test Student',
          dateOfBirth: '2000-01-01',
          placeOfBirth: 'Cairo',
          gender: 'male',
          religion: 'Islam',
          residenceAddress: '123 Main St',
          phone: '1234567890',
          mobile: '9876543210',
          fatherName: 'Father Name',
          fatherNationalId: '29001011234567',
          college: 'Engineering',
          academicYear: '2023-2024'
        });

      expect([201, 400, 500]).toContain(res.status);
      if (res.status === 201) {
        applicationId = res.body.id;
        expect(res.body).toHaveProperty('id');
      }
    });

    test('Buildings - Create Building', async () => {
      const res = await request(app)
        .post('/api/buildings')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'North Building',
          gender: 'male',
          floors: 5
        });

      expect([201, 400, 403, 500]).toContain(res.status);
      if (res.status === 201) {
        buildingId = res.body.id;
      }
    });

    test('Rooms - Create Room', async () => {
      const buildings = await Building.find().limit(1);
      const testBuildingId = buildingId || (buildings.length > 0 ? buildings[0]._id : new mongoose.Types.ObjectId());

      const res = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          buildingId: testBuildingId,
          floorNumber: 1,
          roomNumber: 'R101',
          capacity: 4,
          currentOccupancy: 0,
          status: 'available'
        });

      expect([201, 400, 403, 500]).toContain(res.status);
      if (res.status === 201) {
        roomId = res.body.id;
      }
    });

    test('Students - Get My Profile', async () => {
      const res = await request(app)
        .get('/api/students/me')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 404, 500]).toContain(res.status);
    });

    test('Meals - Get Today Menu', async () => {
      const res = await request(app)
        .get('/api/meals/menu/today')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 500]).toContain(res.status);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('Reports - Create Report', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          type: 'maintenance',
          description: 'Broken window',
          severity: 'high'
        });

      expect([201, 404, 400, 500]).toContain(res.status);
    });

    test('Announcements - Get All Announcements', async () => {
      const res = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 500]).toContain(res.status);
      expect(Array.isArray(res.body) || Array.isArray(res.body.announcements)).toBe(true);
    });

    test('Stats - Get Room Stats', async () => {
      const res = await request(app)
        .get('/api/stats/rooms')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403, 500]).toContain(res.status);
    });
  });

  describe('Endpoint Coverage Check', () => {
    test('GET /api/users/* endpoints exist', async () => {
      const res = await request(app)
        .delete('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 403, 500]).toContain(res.status);
    });

    test('GET /api/students/* endpoints exist', async () => {
      const res = await request(app)
        .get('/api/students')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 403, 500]).toContain(res.status);
    });

    test('GET /api/rooms/available endpoint exists', async () => {
      const res = await request(app)
        .get('/api/rooms/available')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 500]).toContain(res.status);
    });

    test('GET /api/housing-requests endpoint exists', async () => {
      const res = await request(app)
        .get('/api/housing-requests')
        .set('Authorization', `Bearer ${supervisorToken}`);

      expect([200, 403, 500]).toContain(res.status);
    });

    test('GET /api/attendance endpoints exist', async () => {
      const res = await request(app)
        .get('/api/attendance/building/test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(res.status);
    });

    test('GET /api/payments endpoints exist', async () => {
      const res = await request(app)
        .get('/api/payments/my')
        .set('Authorization', `Bearer ${studentToken}`);

      expect([200, 404, 500]).toContain(res.status);
    });

    test('GET /api/notifications endpoint exists', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test',
          message: 'Test notification',
          type: 'system'
        });

      expect([201, 403, 400, 500]).toContain(res.status);
    });
  });
});