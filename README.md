
# 🏢 Cairo University Housing Management System

Welcome to the **Cairo University Housing Management System** repository. This project is a comprehensive, full-stack monorepo solution engineered to oversee massive-scale student dormitory operations, building management, real-time analytics, automated room allocation, meals, and smart attendance tracking.

---

## 🌟 Project Ecosystem

This system is built using a modern, scalable, and cross-platform architecture split across three perfectly integrated components:

### 1. [Backend API Engine](./backend/)
The core brain, database, and business logic of the system.
- **Tech Stack:** Node.js, Express.js (v5), MongoDB (Mongoose v9), Firebase Admin SDK, Socket.io, Nodemailer.
- **Features:**
  - **Polymorphic RBAC:** Advanced Role-Based Access Control handling generic `User` models inheriting into specific roles.
  - **Smart Allocation:** Algorithmic room assignment based on GPA, gender, and live capacity constraints.
  - **Real-time Engine:** Web-Sockets powering instant notifications.
  - **Automated Mailing:** Automated email triggers for password resets and application approvals.
  - **Comprehensive Models:** Full schema integrations for `Application`, `Attendance`, `MealBooking`, `Report`, and `Payment`.

### 2. [Web Frontend (Admin & Member Portal)](./web/)
The primary administrative and student dashboard accessible via modern web browsers.
- **Tech Stack:** React (v19), Vite (v7), Firebase Client, React Router DOM, HuggingFace Inference.
- **Features:**
  - **AI Integration:** Built-in AI Chatbot (`aiService.js` / `AIChatWidget.jsx`) answering student inquiries using Hugging Face models.
  - **Role-Specific Dashboards:** Dedicated `AdminDashboard` and `MemberDashboard` with isolated routing and logic.
  - **Modular Services:** Clean architecture with dedicated API services (`buildingService`, `attendanceService`, `roomService`, etc.) using the native `Fetch API`.
  - **Lightning Fast:** Powered by Vite for instant HMR and minimal bundle sizes.

### 3. [Mobile Application (Student & Staff App)](./mobile/)
A native cross-platform mobile app designed for students and ground staff (Supervisors/Security).
- **Tech Stack:** React Native (Expo SDK 54), Expo Router, Zustand (State Management).
- **Features:**
  - **Route Protection:** File-based routing protecting `(auth)`, `(manager)`, and `(student)` routes.
  - **QR Code Ecosystem:** Dynamic QR generation for students, and integrated `expo-camera` scanning for security to log attendance.
  - **Native Document Uploads:** Utilizing `expo-image-picker` and `expo-document-picker` for housing applications and maintenance proofs.
  - **Native UI:** Granular component architecture (`housing`, `shared`, `ui`) for a seamless UX.

---

## ✨ Core Features & System Workflows

- **🔐 Role-Based Access Control:** Highly secure access for Students, Admins, Supervisors, Floor Admins, Meal Admins, and Security.
- **🤖 AI-Powered Support:** Embedded Markdown-supported AI chat to assist students with university rules and housing guidelines.
- **🏨 Automated Room Allocation:** Smart distribution based on academic grade, gender, and real-time building limits.
- **📱 QR Code Integration:** Zero-touch attendance verification and meal redemption system via mobile scanning.
- **🔔 Real-time Communications:** Socket.io pipelines pushing instant updates for `Announcement`, `Notification`, and `Report` status changes.
- **🍔 Meal Planning:** Complete workflow for weekly menus (`Meal`), advanced booking (`MealBooking`), and capacity-aware serving.
- **🛡️ Attendance & Leaves:** Automated tracking (`Attendance`) preventing meal booking during formal leaves.
- **⚠️ Maintenance Ticketing:** Native issue reporting natively logging `Report` models, tracked from 'open' to 'resolved'.
- **💳 Financials:** Direct logging for housing fees and dependencies using the `Payment` module.

---

## 📂 Monorepo Project Structure

The project strictly follows a clean separation of concerns:

```text
university-housing-system/
│
├── backend/                        # Node.js API & Web-Socket Engine
│   ├── src/
│   │   ├── config/                 # Firebase, MongoDB, Swagger configs
│   │   ├── controllers/            # Route logic
│   │   ├── middlewares/            # JWT Auth, Role checking
│   │   ├── models/                 # Mongoose Schemas (User, Room, Meal, Report, etc.)
│   │   ├── routes/                 # Express endpoints
│   │   └── utils/                  # Helpers
│   ├── app.js                      # Express pipeline
│   └── server.js                   # Application entry point
│
├── web/                            # React + Vite Dashboards
│   ├── public/                     # Static web assets
│   ├── src/
│   │   ├── assets/                 # SVGs and Images
│   │   ├── components/             # Reusable UI
│   │   │   ├── admin/              # Admin-specific components
│   │   │   └── member/             # Member widgets (AIChatWidget, FormContainer)
│   │   ├── pages/                  # Views (AdminDashboard, MemberDashboard, etc.)
│   │   └── services/               # Native Fetch API wrappers (authService, aiService)
│   ├── vite.config.ts              # Bundler configuration
│   └── package.json
│
└── mobile/                         # React Native (Expo) App
    ├── app/                        # Expo Router Layouts
    │   ├── (auth)/                 # Login, Register paths
    │   ├── (manager)/              # Supervisor/Security paths
    │   ├── (student)/              # Student portal paths
    │   └── _layout.tsx             # Root layout
    ├── assets/images/              # App branding
    ├── components/                 # React Native Components
    │   ├── housing/                # Housing-specific UI
    │   ├── shared/                 # Shared UI elements
    │   └── ui/                     # Core atoms (buttons, inputs)
    ├── config/                     # Firebase & Constants
    └── package.json                # Expo dependencies (Zustand, Camera, Pickers)

```

---

## 🔌 API Documentation & Schema

The backend uses **Swagger UI** for comprehensive endpoint documentation.
To view and interact with the API endpoints, start the backend server and navigate to:
👉 **`http://localhost:<PORT>/api-docs`**

*Core Database Entities:* `User`, `Building`, `Room`, `Application`, `StudentRequest`, `HousingRequest`, `Attendance`, `Meal`, `MealBooking`, `Report`, `Payment`, `Announcement`, `Notification`.

---

## 🚀 Getting Started & Local Setup

To run the full stack locally, you must initialize each environment. All network requests across Web and Mobile strictly utilize the native **`Fetch API`**.

### 1. Prerequisites

* **Node.js** (v18+)
* **MongoDB** (Local instance or Atlas)
* **Firebase Project** (Client Config + Admin SDK Credentials)

---

### 2. Backend Setup

Create a `.env` file in `/backend`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/university-housing
NODE_ENV=development
# Additional keys for Firebase Admin and Nodemailer SMTP

```

```bash
cd backend
npm install
npm run dev      # Starts the server with Nodemon on port 5000

```

---

### 3. Web Dashboard Setup

Create a `.env` file in `/web`:

```env
VITE_API_URL=http://localhost:5000/api
# Add Hugging Face inference tokens if testing the AI Chat Widget

```

```bash
cd web
npm install
npm run dev      # Starts the Vite HMR server

```

---

### 4. Mobile App Setup

Update your configuration variables in `/mobile/config/` (or via `.env`) to point to your local IP address (e.g., `http://192.168.1.100:5000/api`).

```bash
cd mobile
npm install
npx expo start   # Starts Metro Bundler (Scan QR with Expo Go)

```

---

## 👥 Engineering Team

Architected and developed by the **Cairo University Backend & Full-Stack Dev Unit**:

* **Youssif**
* **Eslam**
* **Uosry**
* **shehab**
* **ismail**
* **Karim**
* **Farouk**

```

```
