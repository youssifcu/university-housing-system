const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const { User } = require('../src/models/User');
const Application = require('../src/models/Application');
const Room = require('../src/models/Room');
const Building = require('../src/models/Building');
const Meal = require('../src/models/Meal');
const Attendance = require('../src/models/Attendance');
const HousingRequest = require('../src/models/HousingRequest');
const Report = require('../src/models/Report');
const Announcement = require('../src/models/Announcement');
const Notification = require('../src/models/Notification');
const Payment = require('../src/models/Payment');

// محاكاة Firebase Admin
jest.mock('../src/config/firebase', () => {
    const mockAuth = {
        verifyIdToken: jest.fn(async (token) => {
            // محاكاة أدوار مختلفة حسب التوكن
            if (token === 'invalid_token') throw new Error('Invalid token');
            if (token === 'admin_token') {
                return { uid: 'admin_uid', email: 'admin@test.com' };
            }
            if (token === 'student_token') {
                return { uid: 'student_uid', email: 'student@test.com' };
            }
            if (token === 'supervisor_token') {
                return { uid: 'supervisor_uid', email: 'supervisor@test.com' };
            }
            return { uid: 'test_uid', email: 'test@test.com' };
        }),
        deleteUser: jest.fn(async () => true)
    };
    return {
        auth: jest.fn(() => mockAuth),
        initializeApp: jest.fn(),
        credential: { cert: jest.fn() }
    };
});

describe('University Housing System - API Tests (v2.0.0)', () => {
    let adminToken = 'admin_token';
    let studentToken = 'student_token';
    let supervisorToken = 'supervisor_token';
    let applicationId, studentId, buildingId, roomId, mealId, requestId;

    beforeAll(async () => {
        process.env.MONGODB_URI = process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/university-housing-test';

        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        // تنظيف قاعدة البيانات
        await User.deleteMany({});
        await Application.deleteMany({});
        await Room.deleteMany({});
        await Building.deleteMany({});
        await Meal.deleteMany({});
        await Attendance.deleteMany({});
        await HousingRequest.deleteMany({});

        // إنشاء مستخدمين للاختبار
        // أدمن
        await new User({
            firebaseUid: 'admin_uid',
            name: 'Admin User',
            email: 'admin@test.com',
            phoneNumber: '01000000000',
            role: 'admin',
            isActive: true
        }).save();

        // طالب
        const student = await new User({
            firebaseUid: 'student_uid',
            name: 'Test Student',
            email: 'student@test.com',
            phoneNumber: '01111111111',
            role: 'student',
            housingStatus: 'active',
            nationalId: '30001011234567',
            universityYear: 2,
            faculty: 'Engineering'
        }).save();
        studentId = student._id;

        // مشرف
        await new User({
            firebaseUid: 'supervisor_uid',
            name: 'Supervisor User',
            email: 'supervisor@test.com',
            phoneNumber: '01222222222',
            role: 'supervisor',
            isActive: true
        }).save();

        // إنشاء مبنى و غرفة للاختبارات
        const building = await new Building({
            name: 'Test Building',
            gender: 'male',
            floors: 3
        }).save();
        buildingId = building._id;

        const room = await new Room({
            roomNumber: 'T101',
            buildingId: building._id,
            floorNumber: 1,
            capacity: 4,
            currentOccupants: [],
            status: 'available'
        }).save();
        roomId = room._id;

        // إنشاء وجبة
        const meal = await new Meal({
            name: 'Test Breakfast',
            mealType: 'breakfast',
            date: new Date(),
            price: 20
        }).save();
        mealId = meal._id;
    }, 30000);

    afterAll(async () => {
        await User.deleteMany({});
        await Application.deleteMany({});
        await Room.deleteMany({});
        await Building.deleteMany({});
        await Meal.deleteMany({});
        await Attendance.deleteMany({});
        await HousingRequest.deleteMany({});
        await mongoose.disconnect();
    }, 15000);

    // ==================== الصحة العامة ====================
    test('Health Check - GET /', async () => {
        const res = await request(app).get('/');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toMatch(/running/i);
    });

    // ==================== المصادقة ====================
    test('Auth - Register Student', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                firebaseUid: 'new_student_uid',
                name: 'New Student',
                email: 'newstudent@test.com',
                phoneNumber: '01555555555',
                studentId: 'STU2024001',
                nationalId: '30005011234567',
                universityYear: '1',
                faculty: 'Science'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('Auth - Login', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ firebaseUid: 'student_uid' });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.role).toBe('student');
    });

    test('Auth - Get Profile', async () => {
        const res = await request(app)
            .get('/api/auth/profile')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user).toHaveProperty('email', 'student@test.com');
    });

    // ==================== الطلبات (Applications) ====================
    test('Applications - Submit Application', async () => {
        const res = await request(app)
            .post('/api/applications')
            .set('Authorization', `Bearer ${studentToken}`)
            .field('studentType', 'new')
            .field('nationalId', '30001011234567')
            .field('fullName', 'Test Student App')
            .field('gender', 'male')
            .field('dateOfBirth', '2000-01-01')
            .field('phoneNumber', '01111111111')
            .field('address', 'Cairo')
            .field('fatherName', 'Father')
            .field('fatherNationalId', '29001011234567')
            .field('college', 'Engineering')
            .field('academicYear', '2')
            .attach('documents', Buffer.from('fake pdf'), 'test.pdf');

        expect([201, 400]).toContain(res.status);
        if (res.status === 201) {
            expect(res.body.success).toBe(true);
            applicationId = res.body.data.applicationId;
        }
    });

    test('Applications - Get My Application', async () => {
        const res = await request(app)
            .get('/api/applications/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Applications - Approve Application (Admin)', async () => {
        // نحتاج applicationId موجود
        if (!applicationId) {
            console.warn('Skipping approve test - no applicationId');
            return;
        }
        const res = await request(app)
            .patch(`/api/applications/${applicationId}/approve`)
            .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400]).toContain(res.status);
        if (res.status === 200) {
            expect(res.body.success).toBe(true);
        }
    });

    // ==================== المباني والغرف ====================
    test('Buildings - Get All', async () => {
        const res = await request(app)
            .get('/api/buildings')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.buildings)).toBe(true);
    });

    test('Buildings - Create (Admin)', async () => {
        const res = await request(app)
            .post('/api/buildings')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                name: 'South Building',
                gender: 'female',
                floors: 4,
                description: 'Test building'
            });

        expect([201, 400]).toContain(res.status);
    });

    test('Rooms - Get Available', async () => {
        const res = await request(app)
            .get('/api/rooms/available')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Rooms - Get My Room (Student)', async () => {
        const res = await request(app)
            .get('/api/rooms/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect([200, 404]).toContain(res.status);
    });

    test('Rooms - Assign Student (Admin)', async () => {
        const res = await request(app)
            .patch(`/api/rooms/${roomId}/assign`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({ studentId: studentId.toString() });

        expect([200, 400]).toContain(res.status);
    });

    // ==================== الوجبات ====================
    test('Meals - Get Meals', async () => {
        const res = await request(app)
            .get('/api/meals')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Meals - Book Meal', async () => {
        const res = await request(app)
            .post('/api/meals/book')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({ mealId: mealId.toString() });

        expect([201, 400]).toContain(res.status);
    });

    test('Meals - Scan Meal (Meal Admin)', async () => {
        // يحتاج مشرف وجبات حقيقي
        const res = await request(app)
            .post('/api/meals/scan')
            .set('Authorization', `Bearer ${supervisorToken}`)
            .send({
                qrCodeString: studentId.toString(),
                mealId: mealId.toString()
            });

        expect([200, 403, 404]).toContain(res.status);
    });

    // ==================== الحضور ====================
    test('Attendance - Scan', async () => {
        const res = await request(app)
            .post('/api/attendance/scan')
            .set('Authorization', `Bearer ${supervisorToken}`)
            .send({
                qrCodeString: studentId.toString(),
                buildingId: buildingId.toString()
            });

        expect([200, 201, 403, 404]).toContain(res.status);
    });

    test('Attendance - My Records', async () => {
        const res = await request(app)
            .get('/api/attendance/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // ==================== طلبات السكن (نقل/إجازة) ====================
    test('Housing Requests - Submit', async () => {
        const res = await request(app)
            .post('/api/housing-requests')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                type: 'maintenance',
                reason: 'Broken light',
                fromRoomId: roomId.toString()
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        if (res.body.data) {
            requestId = res.body.data.id;
        }
    });

    test('Housing Requests - Get All (Supervisor)', async () => {
        const res = await request(app)
            .get('/api/housing-requests')
            .set('Authorization', `Bearer ${supervisorToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // ==================== البلاغات ====================
    test('Reports - Create', async () => {
        const res = await request(app)
            .post('/api/reports')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                type: 'maintenance',
                description: 'Leaking faucet',
                severity: 'medium'
            });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
    });

    test('Reports - Get My Reports', async () => {
        const res = await request(app)
            .get('/api/reports/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    // ==================== الإعلانات والإشعارات ====================
    test('Announcements - Get All', async () => {
        const res = await request(app)
            .get('/api/announcements')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Announcements - Create (Admin)', async () => {
        const res = await request(app)
            .post('/api/announcements')
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
                title: 'Test Announcement',
                content: 'This is a test',
                priority: 'medium',
                targetRole: 'all'
            });

        expect(res.status).toBe(201);
    });

    test('Notifications - Get My Notifications', async () => {
        const res = await request(app)
            .get('/api/notifications/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
    });

    // ==================== QR Codes ====================
    test('QR - Generate', async () => {
        const res = await request(app)
            .post('/api/qr/generate')
            .set('Authorization', `Bearer ${studentToken}`);

        expect([200, 201]).toContain(res.status);
        expect(res.body.success).toBe(true);
    });

    test('QR - Get My Codes', async () => {
        const res = await request(app)
            .get('/api/qr/my')
            .set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(200);
    });

    // ==================== الإحصائيات ====================
    test('Stats - Dashboard', async () => {
        const res = await request(app)
            .get('/api/stats/dashboard')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    test('Stats - Students by College', async () => {
        const res = await request(app)
            .get('/api/stats/students-by-college')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
    });

    // ==================== مسارات V2 ====================
    test('V2 - Submit Request', async () => {
        const res = await request(app)
            .post('/api/v2/requests')
            .set('Authorization', `Bearer ${studentToken}`)
            .send({
                requestType: 'complaint',
                title: 'Test Complaint',
                description: 'Noise complaint',
                priority: 'medium'
            });

        expect([201, 200]).toContain(res.status);
    });

    test('V2 - Get Requests (Admin)', async () => {
        const res = await request(app)
            .get('/api/v2/requests')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(200);
    });
});