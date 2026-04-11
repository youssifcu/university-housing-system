# 🚀 Swagger API Testing Guide - University Housing System

## 📋 Quick Start

### Access Swagger UI
After starting your server, access the interactive Swagger documentation at:

- **Full Documentation**: [http://localhost:5000/api-docs-complete](http://localhost:5000/api-docs-complete)
- **Standard Documentation**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)
- **JSON Spec**: [http://localhost:5000/api-docs/swagger.json](http://localhost:5000/api-docs/swagger.json)

---

## 🔐 Authentication

Most endpoints require a **Bearer Token** (Firebase ID Token).

### To Test Protected Endpoints:
1. First, call `/api/auth/register` or `/api/auth/login` to get a token
2. Copy the token from the response
3. Click the **🔓 Authorize** button in Swagger UI
4. Paste: `Bearer YOUR_TOKEN_HERE`
5. All subsequent requests will include this token

---

## 📚 Complete Endpoint Categories

### 1️⃣ Authentication & Profile (No Token Required for Register/Login)

#### Register New User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!",
  "name": "Ahmed Mohamed",
  "phoneNumber": "+201000000000",
  "gender": "male"
}
```

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "student@university.edu",
  "password": "SecurePass123!"
}
```

#### Get Profile
```bash
GET /api/auth/profile
Authorization: Bearer {token}
```

#### Update Profile
```bash
PUT /api/auth/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Ahmed Mohamed Ali",
  "phoneNumber": "+201000000001"
}
```

#### Change Password
```bash
PATCH /api/auth/password
Authorization: Bearer {token}
Content-Type: application/json

{
  "oldPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!"
}
```

---

### 2️⃣ Applications (Housing Applications)

#### Submit Housing Application (Student)
```bash
POST /api/applications
Authorization: Bearer {student_token}
Content-Type: multipart/form-data

{
  "fullName": "Ahmed Mohamed",
  "nationalId": "30001011234567",
  "gender": "male",
  "college": "Engineering",
  "academicYear": 1,
  "gpa": 3.8,
  "dateOfBirth": "2003-01-01",
  "phoneNumber": "+201000000000",
  "email": "student@university.edu",
  "address": "Cairo, Egypt",
  
  // Upload files:
  "nationalIdCard": <file>,
  "personalPhoto": <file>,
  "medicalReport": <file>,
  "universityIdCard": <file>
}
```

#### Get My Application
```bash
GET /api/applications/my
Authorization: Bearer {student_token}
```

#### Get All Applications (Admin/Supervisor)
```bash
GET /api/applications?page=1&limit=20&status=pending
Authorization: Bearer {admin_token}
```

#### Get Application by ID
```bash
GET /api/applications/{applicationId}
Authorization: Bearer {token}
```

#### Approve Application (Admin)
```bash
PATCH /api/applications/{applicationId}/approve
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "assignedRoomId": "60d5ec49c1234567890abcde",
  "adminComment": "Application approved - assigned to room 101"
}
```

#### Reject Application (Admin)
```bash
PATCH /api/applications/{applicationId}/reject
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "reason": "Incomplete documentation"
}
```

#### Delete Application
```bash
DELETE /api/applications/{applicationId}
Authorization: Bearer {student_token}
```

---

### 3️⃣ Users Management (Admin Only)

#### Get All Users
```bash
GET /api/users?page=1&limit=20&role=student
Authorization: Bearer {admin_token}
```

#### Get User by ID
```bash
GET /api/users/{userId}
Authorization: Bearer {token}
```

#### Update User (Admin)
```bash
PUT /api/users/{userId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "New Name",
  "phoneNumber": "+201000000000",
  "role": "supervisor",
  "housingStatus": "active"
}
```

#### Delete User (Admin)
```bash
DELETE /api/users/{userId}
Authorization: Bearer {admin_token}
```

---

### 4️⃣ Buildings Management

#### Get All Buildings
```bash
GET /api/buildings?page=1&limit=20
Authorization: Bearer {token}
```

#### Get Building by ID
```bash
GET /api/buildings/{buildingId}
Authorization: Bearer {token}
```

#### Create Building (Admin)
```bash
POST /api/buildings
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Building A - Male",
  "gender": "male",
  "location": "Campus North Wing",
  "floorCount": 6
}
```

#### Update Building (Admin)
```bash
PUT /api/buildings/{buildingId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Building A - Male (Updated)",
  "location": "Campus North Wing - Wing 1"
}
```

#### Delete Building (Admin)
```bash
DELETE /api/buildings/{buildingId}
Authorization: Bearer {admin_token}
```

---

### 5️⃣ Rooms Management

#### Get All Rooms
```bash
GET /api/rooms?page=1&limit=20&buildingId={buildingId}&status=available
Authorization: Bearer {token}
```

#### Get Available Rooms for Students
```bash
GET /api/rooms/available?buildingId={buildingId}
Authorization: Bearer {student_token}
```

#### Get Room by ID
```bash
GET /api/rooms/{roomId}
Authorization: Bearer {token}
```

#### Create Room (Admin)
```bash
POST /api/rooms
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "roomNumber": "101",
  "buildingId": "60d5ec49c1234567890abcde",
  "floorNumber": 1,
  "capacity": 4,
  "amenities": [
    { "name": "Air Conditioner", "isWorking": true },
    { "name": "WiFi", "isWorking": true }
  ]
}
```

#### Update Room (Admin)
```bash
PUT /api/rooms/{roomId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "capacity": 2,
  "status": "maintenance",
  "amenities": [
    { "name": "Air Conditioner", "isWorking": false }
  ]
}
```

---

### 6️⃣ Housing Requests (Transfer, Leave, Vacate, Maintenance)

#### Submit Housing Request (Student)
```bash
POST /api/housing-requests
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "type": "transfer",
  "toRoomId": "60d5ec49c1234567890abcde",
  "reason": "Dust allergy - needs better AC"
}
```

**Request Types:**
- `transfer`: Move to another room (requires `toRoomId`)
- `leave`: Takes a leave/vacation (requires `startDate` & `endDate`)
- `vacate`: Quit housing (requires `startDate` & `endDate`)
- `maintenance`: Report maintenance issue (no additional fields)

#### Get All Requests (Admin)
```bash
GET /api/housing-requests?page=1&limit=20&status=pending&type=transfer
Authorization: Bearer {admin_token}
```

#### Get Request by ID
```bash
GET /api/housing-requests/{requestId}
Authorization: Bearer {token}
```

#### Update Request Status (Admin)
```bash
PATCH /api/housing-requests/{requestId}/status
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "approved",
  "adminComment": "Request approved - room transfer scheduled"
}
```

**Status Options:** `approved`, `rejected`, `cancelled`

---

### 7️⃣ Meals Management & Booking

#### Get Meals
```bash
GET /api/meals?date=2024-04-12&type=breakfast&page=1&limit=20
Authorization: Bearer {token}
```

#### Create Meal (Admin/Meal Admin)
```bash
POST /api/meals
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "name": "Grilled Chicken with Rice",
  "type": "lunch",
  "date": "2024-04-12",
  "description": "Delicious grilled chicken with seasoned rice",
  "nutritionInfo": {
    "calories": 650,
    "protein": "35g",
    "carbs": "45g"
  }
}
```

#### Book Meal (Student)
```bash
POST /api/meals/book
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "mealId": "60d5ec49c1234567890abcde"
}
```

#### Cancel Meal Booking
```bash
POST /api/meals/{mealId}/cancel
Authorization: Bearer {student_token}
```

---

### 8️⃣ Attendance & QR Codes

#### Check In (Student)
```bash
POST /api/attendance/checkin
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "qrData": "QR_CODE_DATA_FROM_MOBILE"
}
```

#### Check Out (Student)
```bash
POST /api/attendance/checkout
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "qrData": "QR_CODE_DATA_FROM_MOBILE"
}
```

#### Get My Attendance Records
```bash
GET /api/attendance/my?page=1&limit=50
Authorization: Bearer {student_token}
```

#### Get Student QR Code
```bash
GET /api/students/{studentId}/qr
Authorization: Bearer {token}
```

---

### 9️⃣ Reports (Complaints & Maintenance)

#### Submit Report (Student)
```bash
POST /api/reports
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "type": "maintenance",
  "title": "AC Not Working",
  "description": "The air conditioner in room 101 is not functioning",
  "priority": "high"
}
```

**Report Types:** `complaint`, `maintenance`, `other`
**Priorities:** `low`, `medium`, `high`

#### Get All Reports
```bash
GET /api/reports?page=1&limit=20&type=maintenance&status=pending
Authorization: Bearer {admin_token}
```

#### Get Report by ID
```bash
GET /api/reports/{reportId}
Authorization: Bearer {token}
```

---

### 🔟 Payments

#### Create Payment (Student) - Only for Active Housing Students
```bash
POST /api/payments
Authorization: Bearer {student_token}
Content-Type: application/json

{
  "amount": 500,
  "paymentMethod": "card",
  "description": "Housing Payment for Semester 1",
  "dueDate": "2024-06-30"
}
```

**Payment Methods:** `cash`, `card`, `bank_transfer`, `online`

#### Get My Payments
```bash
GET /api/payments/my?page=1&limit=20
Authorization: Bearer {student_token}
```

#### Get All Payments (Admin)
```bash
GET /api/payments?page=1&limit=20&status=pending
Authorization: Bearer {admin_token}
```

#### Get Payment by ID
```bash
GET /api/payments/{paymentId}
Authorization: Bearer {token}
```

#### Update Payment (Admin)
```bash
PUT /api/payments/{paymentId}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "status": "completed",
  "amount": 500
}
```

---

### 1️⃣1️⃣ Statistics & Dashboard

#### Get Dashboard Stats (Admin/Supervisor)
```bash
GET /api/stats/dashboard
Authorization: Bearer {admin_token}
```
**Returns:** Total students, rooms, available rooms, pending applications, today's meals, pending payments

#### Get Students by College
```bash
GET /api/stats/students-by-college
Authorization: Bearer {admin_token}
```

#### Get Students by Grade/Year
```bash
GET /api/stats/students-by-grade
Authorization: Bearer {admin_token}
```

#### Get Room Statistics
```bash
GET /api/stats/rooms
Authorization: Bearer {admin_token}
```

#### Get Buildings Availability
```bash
GET /api/stats/buildings-availability
Authorization: Bearer {admin_token}
```

#### Get Meals Statistics
```bash
GET /api/stats/meals
Authorization: Bearer {admin_token}
```

#### Get Payments Statistics (Admin Only)
```bash
GET /api/stats/payments
Authorization: Bearer {admin_token}
```

---

### 1️⃣2️⃣ Announcements

#### Get Announcements
```bash
GET /api/announcements?page=1&limit=20
Authorization: Bearer {token}
```

#### Create Announcement (Admin)
```bash
POST /api/announcements
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "title": "Maintenance Notice - Building A",
  "content": "Building A will undergo maintenance on April 20-21",
  "priority": "high"
}
```

---

### 1️⃣3️⃣ Notifications

#### Get My Notifications
```bash
GET /api/notifications
Authorization: Bearer {token}
```

---

## 🧪 Testing Workflow

### Step-by-Step Testing Example

**1. Register a new student:**
```bash
POST /api/auth/register
{
  "email": "testuser@university.edu",
  "password": "Test@123456",
  "name": "Test User",
  "gender": "male"
}
```

**Copy the token from response** ⬅️ This is important!

**2. Get the registered user's profile:**
```bash
GET /api/auth/profile
Authorization: Bearer {token_from_step_1}
```

**3. Submit a housing application:**
```bash
POST /api/applications
Authorization: Bearer {token_from_step_1}
(Upload files and fill in details)
```

**4. As Admin, approve the application:**
```bash
PATCH /api/applications/{applicationId}/approve
Authorization: Bearer {admin_token}
{
  "assignedRoomId": "room-id-here"
}
```

**5. Student checks their new room:**
```bash
GET /api/rooms/{roomId}
Authorization: Bearer {student_token}
```

---

## 💡 Tips & Tricks

### ✅ Required Headers
- **Authorization**: `Bearer {firebase_token}` (for protected endpoints)
- **Content-Type**: `application/json` (for JSON payloads)

### ✅ Common Parameters
- **page**: Page number (default: 1)
- **limit**: Items per page (default: 20)
- **sort**: Sort field (e.g., `createdAt: -1`)

### ✅ Try It Out in Swagger UI
- Click any endpoint
- Click **Try it out**
- Fill in the parameters/body
- Click **Execute**
- See the response!

### ✅ Import to Postman
1. Go to [http://localhost:5000/api-docs/swagger.json](http://localhost:5000/api-docs/swagger.json)
2. Copy all the JSON
3. In Postman: **Import** → **Paste Raw Text** → **Continue**
4. Create a collection with all endpoints

---

## 🔗 Useful Links

| Resource | URL |
|----------|-----|
| **Swagger UI (Complete)** | http://localhost:5000/api-docs-complete |
| **Swagger UI (Standard)** | http://localhost:5000/api-docs |
| **JSON Spec** | http://localhost:5000/api-docs/swagger.json |
| **Main API** | http://localhost:5000 |

---

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error (only in development)"
}
```

---

## 🔒 Authorization Levels

| Endpoint | Role Required |
|----------|--------------|
| `/api/auth/register`, `/login` | None |
| `/api/users`, Admin operations | `admin` |
| `/api/stats/*` | `admin`, `supervisor`, `floor_admin` |
| `/api/applications/approve` | `admin` |
| `/api/meals` (Create) | `admin`, `meal_admin` |
| `/api/payments` (Create) | `student` (with active housing) |
| `/api/housing-requests` (Create) | `student` |

---

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check your token is valid and included in Authorization header |
| 403 Forbidden | Check your user role has permission for this endpoint |
| 400 Bad Request | Validate your request body matches the schema |
| 404 Not Found | Check the resource ID exists |
| Validation Error | Check required fields are provided |

---

## 🚀 Start Testing!

1. **Open Swagger UI**: [http://localhost:5000/api-docs-complete](http://localhost:5000/api-docs-complete)
2. **Click Authorize** and paste your token
3. **Click any endpoint** to expand it
4. **Click "Try it out"**
5. **Fill in parameters** as needed
6. **Click Execute** and see results!

Happy Testing! 🎉
