# 🏢 University Housing System Backend

> Comprehensive backend for **Cairo University Housing Management System**. Built to oversee massive scale student dormitory processing, building management, real-time analytics, automated room allocation, meals, and attendance tracking.

---

## 🌟 Features Overview

- **Role-Based Access Control (RBAC):** Distinct roles for Students, Admins, Supervisors, Floor Admins, Meal Admins, and Security.
- **Automated Room Allocation:** Smart logic that assigns rooms based on student gender, academic grade, and building constraints.
- **QR Code Integration:** Secure attendance tracking and meal redemption using dynamically generated QR codes.
- **Real-time Notifications:** Web-Socket (Socket.io) integration for instant alerts, announcements, and report updates.
- **Comprehensive Meal Planning:** Weekly menus, booking systems, and serving limits.
- **Leave & Attendance Management:** Students can request leaves, which temporarily suspend their housing status and pause meal/attendance requirements.
- **Payment Processing:** Tracking for dorm fees and financial obligations.
- **Maintenance & Reports:** Ticketing system for students to report damages or file complaints, tracked by admins.

---

## 🏗️ Core Architecture & Tech Stack

- **Runtime Environment:** Node.js
- **Framework:** Express.js (v5)
- **Database:** MongoDB via Mongoose (v9.x)
- **Authentication:** Firebase Admin SDK (Stateless JWT verification)
- **File Uploads:** Multer (Buffers stored in MongoDB)
- **Real-time Engine:** Socket.io
- **API Documentation:** Swagger UI & Swagger JSDoc
- **Testing:** Jest & Supertest

---

## 👥 User Roles & Permissions

The system utilizes a **Polymorphic Data Architecture** where all users inherit from a base `User` schema.
- **Student:** Can apply for housing, book meals, generate QR codes, submit maintenance reports, request leaves, and view their own data.
- **Admin:** Global access. Can manage buildings, rooms, users, approve applications, and view all statistics.
- **Supervisor:** Can manage housing applications, assign rooms, approve leaves, and manage announcements.
- **Floor Admin:** Localized control over specific buildings/floors. Can view attendance and reports.
- **Meal Admin:** Can create meal menus and scan QR codes to serve meals.
- **Security:** Can scan QR codes to verify student attendance and campus entry/exit.

---

## 🚦 System Modules & Workflows

### 📝 Housing Applications & Room Allocation
1. **Application:** Students apply by submitting necessary documents and parameters (GPA, Gender, College).
2. **Review:** Admins/Supervisors review the application.
3. **Auto-Allocation:** Upon approval, the system's algorithm finds matching active buildings (isolating by gender and required academic grade) and assigns an optimal room, automatically updating capacities.

### 🏨 Buildings & Rooms
- Administrators manage entire building assets, mapping out limitations (grades, gender matching, supervisors) and maximum floor densities.
- The system prevents capacity overflow and mixed-gender allocations natively.

### 🍔 Meal Planning Ecosystem
- Meal operators publish rotating weekly Menus (Breakfast, Lunch, Dinner) with specific capacities.
- Students book meals in advance.
- Redemption is validated physically via **QR Code scanning** by Meal Admins.

### 🛡️ Attendance & Leaves
- **QR Attendance:** Physical presence is verified via unique QR codes scanned by Security or Floor Admins.
- **Leaves:** Students can request formal leaves. Upon approval, their housing status is temporarily `suspended`, exempting them from daily attendance tracking and preventing meal bookings until they return.

### ⚠️ Maintenance & Reports
- Students encountering room damages file reports natively.
- The workflow tracks tickets through `open`, `in_progress`, and `resolved` states.
- Real-time updates notify students when their ticket status changes.

### 💳 Payments
- The system logs and tracks student payments for housing fees.
- Integrated receipt tracking and status updates (`pending`, `completed`, `failed`).

### 📣 Announcements & Notifications
- Global broadcasting system targeting specific channels (e.g., all students, floor admins).
- Triggers active Web-Socket listeners for instant browser/app updates.

---

## 📂 Project Structure

```text
src/
├── config/         # Database, Firebase, Swagger, and Multer configurations
├── controllers/    # Core business logic for each route
├── middlewares/    # Custom middlewares (Firebase verification, Role checking, Error handling)
├── models/         # Mongoose schemas (Polymorphic User, Building, Meal, Report, etc.)
├── routes/         # Express route definitions
├── utils/          # Helper functions and utilities
└── app.js          # Express app setup and middleware pipeline
server.js           # Entry point and server initialization
```

---

## 🔌 API Documentation (Swagger)

The entire API is comprehensively documented using Swagger. Once the server is running, you can access the interactive documentation and test endpoints directly at:

👉 **`http://localhost:<PORT>/api-docs`**

*See `SWAGGER_TESTING_GUIDE.md` and `API_QUICK_START.md` for specific endpoint testing workflows.*

---

## 🛠️ Environmental Setup & Boot Protocol

### 1. Prerequisites
- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or Atlas cluster)
- **Firebase Project** (For Authentication)

### 2. Environment Variables
Create a root `.env` file with the following parameters:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/university-housing
NODE_ENV=development
```
*(Note: You must securely place your Firebase Admin SDK credentials JSON file as required by your Firebase initialization config.)*

### 3. Installation & Execution

```bash
# Install dependencies
npm install

# Start the server in Development mode (Auto-restarts via Nodemon)
npm run dev

# Start the server in Production mode
npm start

# Run the test suite (Jest)
npm run test
```

---

## 👩‍💻 Contributors
Engineered by Youssif & Team - Cairo University Backend Dev Unit.
