
# 🏢 University Housing Management System (Monorepo)



> Comprehensive Full-Stack Monorepo solution for **Cairo University Housing Management System**. Built to oversee massive scale student dormitory processing, building management, real-time analytics, automated room allocation, meals, and attendance tracking.



---



## 🌟 Features Overview



- **Role-Based Access Control (RBAC):** Distinct roles for Students, Admins, Supervisors, Floor Admins, Meal Admins, and Security.

- **Cross-Platform Access:** A dedicated React Native mobile app for students and on-ground staff, coupled with a lightning-fast React + Vite web dashboard for higher management.

- **Automated Room Allocation:** Smart logic that assigns rooms based on student gender, academic grade, and building constraints.

- **QR Code Integration:** Secure attendance tracking and meal redemption using dynamically generated QR codes.

- **Real-time Notifications:** Web-Socket (Socket.io) integration for instant alerts, announcements, and report updates.

- **Comprehensive Meal Planning:** Weekly menus, booking systems, and serving limits.

- **Leave & Attendance Management:** Students can request leaves, which temporarily suspend their housing status and pause meal/attendance requirements.

- **Payment Processing:** Tracking for dorm fees and financial obligations.

- **Maintenance & Reports:** Ticketing system for students to report damages or file complaints, tracked by admins.



---



## 🏗️ Core Architecture & Tech Stack



### 💻 Web Application (Admin Dashboard)

- **Build Tool:** Vite (For ultra-fast HMR and optimized builds)

- **Framework:** React.js

- **Language/Config:** TypeScript (`vite.config.ts`) / JavaScript

- ** Routing:** React Router



### 📱 Mobile Application (Student App)

- **Framework:** React Native (Expo)

- **Routing:** Expo Router (File-based routing via `/app`)

- **API Client:** Custom Hooks / Axios / Fetch API



### ⚙️ Backend API & Real-time Engine

- **Runtime Environment:** Node.js

- **Framework:** Express.js (v5)

- **Database:** MongoDB via Mongoose (v9.x)

- **Authentication:** Firebase Admin SDK (Stateless JWT verification)

- **File Uploads:** Multer (Buffers stored in MongoDB)

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

2. **Review:** Admins/Supervisors review the application via the web dashboard.

3. **Auto-Allocation:** Upon approval, the system's algorithm finds matching active buildings (isolating by gender and required academic grade) and assigns an optimal room, automatically updating capacities.



### 🏨 Buildings & Rooms

- Administrators manage entire building assets, mapping out limitations (grades, gender matching, supervisors) and maximum floor densities.

- The system prevents capacity overflow and mixed-gender allocations natively.



### 🍔 Meal Planning Ecosystem

- Meal operators publish rotating weekly Menus (Breakfast, Lunch, Dinner) with specific capacities.

- Students book meals in advance via the mobile app.

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



## 📂 Project Structure (Monorepo)



```text

university-housing-system/

├── backend/                        # Node.js + Express API & Socket.io

│   ├── src/                        # Source code (controllers, models, routes)

│   ├── tests/                      # Jest & Supertest suites

│   ├── .gitignore

│   ├── API_QUICK_START.md          # Quickstart documentation

│   ├── ENDPOINT_CHECKLIST.md       # API tracking checklist

│   ├── postman-collection.json     # Ready-to-use Postman requests

│   ├── railway.json                # Deployment configuration for Railway

│   ├── SWAGGER_TESTING_GUIDE.md    # Swagger docs guide

│   ├── TESTING_GUIDE.md            # Testing protocols

│   ├── package.json

│   └── server.js                   # Application entry point

│

├── mobile/                         # React Native (Expo) Mobile App

│   ├── .vscode/                    # Editor configurations

│   ├── app/                        # Expo Router file-based routing

│   ├── assets/images/              # Static image assets & icons

│   ├── components/                 # Reusable React Native UI components

│   ├── config/                     # Application configurations

│   ├── constants/                  # Theming, colors, and global constants

│   ├── data/                       # Static data or context

│   ├── hooks/                      # Custom React hooks

│   └── scripts/                    # Build and utility scripts

│

└── web/                            # React + Vite Admin Dashboard

    ├── lib/                        # Utility libraries

    ├── public/                     # Public static assets

    ├── src/

    │   ├── assets/                 # Web specific assets

    │   ├── components/             # Reusable UI components

    │   ├── config/                 # Dashboard configurations

    │   ├── context/                # React Context API providers

    │   ├── hooks/                  # Custom React hooks

    │   ├── pages/                  # Page-level components/views

    │   ├── services/               # API service layers

    │   └── styles/                 # Global styling

    ├── .env                        # Environment variables

    ├── eslint.config.js            # Linter configuration

    ├── index.html                  # Vite HTML entry

    ├── package.json

    └── vite.config.ts              # Vite bundler configuration



```



---



## 🔌 API Documentation (Swagger)



The entire backend API is comprehensively documented using Swagger. Once the server is running, you can access the interactive documentation and test endpoints directly at:



👉 **`http://localhost:<PORT>/api-docs`**



*See `backend/SWAGGER_TESTING_GUIDE.md` and `backend/API_QUICK_START.md` for specific endpoint testing workflows.*



---



## 🛠️ Environmental Setup & Boot Protocol



### 1. Prerequisites



* **Node.js** (v18+ recommended)

* **MongoDB** (Local instance or Atlas cluster)

* **Firebase Project** (For Authentication)



---



### 2. Backend Setup



Create a `.env` file in the `backend` directory with the following parameters:



```env

PORT=5000

MONGO_URI=mongodb://localhost:27017/university-housing

NODE_ENV=development



```



*(Note: You must securely place your Firebase Admin SDK credentials JSON file as required by your Firebase initialization config.)*



```bash

cd backend

npm install

npm run dev      # Auto-restarts via Nodemon

# OR

npm start        # Production mode

npm run test     # Run the test suite (Jest)



```



---



### 3. Web Dashboard (Vite) Setup



Create a `.env` file in the `web` directory. *(Since Vite is used, environment variables usually require the `VITE_` prefix)*:



```env

VITE_API_URL=http://localhost:5000/api



```



```bash

cd web

npm install

npm run dev      # Starts the lightning-fast Vite development server



```



---



### 4. Mobile App (Expo) Setup



Ensure your API connections in `mobile/config/` point to your local backend IP (e.g., `http://192.168.1.x:5000/api`).



```bash

cd mobile

npm install

npx expo start   # Starts Metro Bundler (Press 'a' for Android, 'i' for iOS)



```



---



## 👩‍💻 Contributors



Engineered by the **Cairo University Backend Dev Unit & Full-Stack Team**:



* **Youssif**

* **shehab**

* **usry**

* **ismail**

* **karim**

* **Eslam**

* **Farouk**



```



```  
