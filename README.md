# 🏢 University Housing System Backend

> Comprehensive backend for **Cairo University Housing Management System**. Built to oversee massive scale student dormitory processing, building management, real-time analytics, and automated logic deployment.

---

## 🏗️ Core Architecture Overview

This server provides the rigid business logic required to orchestrate a modern university complex.

### 1. Database & Polymorphism
We utilize **MongoDB** alongside **Mongoose** (v9.x). Because of the diversity of users involved, the system features a **Polymorphic Data Architecture**:
- All users inherit from a base `User` schema containing shared traits (Auth references, Name, Contact).
- Mongoose **Discriminators** branch this logic seamlessly into sub-collections under the same namespace: `Student`, `Admin`, `Supervisor`, `FloorAdmin`, and `MealAdmin`.
- Operations on users automatically pull schema-specific constraints safely.

### 2. Authentication & Authorization
Stateless safety is heavily relied upon:
- All users register through heavily encrypted API chains handled natively by **Firebase Authorization**. 
- Token payloads (`JWT`) are passed back to our Node.js `/login` controller.
- **Custom Middlewares** (`verifyFirebaseToken`, `roleMiddleware`) intercept requests dynamically checking role strings (e.g., `isAdmin`, `isSupervisor`) allowing rapid closure to sensitive endpoints.

### 3. File Buffering
To circumvent broken image URLs and complicated scaling dependencies, specific high-traffic photos (like physical ID cards and **Student Profile Pictures**) are pushed up through `Multer`, digested, and stored as scalable **Native MongoDB Buffers**. Our APIs format this to standard HTTP Image endpoints that browser `<img>` tags digest effortlessly!

### 4. Real-time Broadcasting (Socket.IO)
Events critical to resident awareness scale broadly using **Socket.io**. Actions such as creating an Announcement, filing an Emergency Report, or updating System Status broadcast globally or to filtered active channels instilling a "live" feel to the interface.

---

## 🚦 System Modules & Business Workflows

### 📝 Housing Applications
The backbone of the university cycle. 
1. `Students` apply, submitting necessary document buffers (IDs, medical) and parameters (GPA, Gender).
2. The logic halts their `housingStatus` into `suspended` ensuring they await verification safely.
3. Once an `Admin` runs an Application Review, the system automatically runs **Grading Algorithms**, finds matching active `Buildings` explicitly isolating cross-gendered structures, and scans for optimal `Rooms` before incrementing capacity parameters.

### 🏨 Buildings & Rooms
Manages geographical assets. 
- Administrators generate entire Building assets mapping out specific limitations (`grades`, `gender matching`) and maximum floor densities.
- Students interact primarily with "Safe Endpoints" that strictly format outputs—masking sensitive supervisor IDs, precise internal capacities, or neighbor details for strict privacy standards.

### ⚠️ Maintenance & Reports
Students encountering room damages or complaints file reports natively. The workflow tracks these into open, in-progress, or resolved conditions. Admins assign priority queues internally depending on severity logic.

### 🍔 Meal Planning Ecosystem
Controls dormitory cafeteria assets. 
- Meal operators publish rotating weekly Menus (Breakfast, Lunch, Dinner).
- Students ping the server booking slots prior to expiration conditions—which automatically regulates internal food allocation predictions avoiding waste.

### 🛡️ Secure QR & Attendance System
Physical presence logic.
- The server generates distinct, cryptographically unique strings securely logged inside the `Student` Profile payload.
- External scanners ping the QR endpoints validating student attendance against active database leases tracking physical compliance in dormitories securely.

---

## 🔌 Core API Endpoints

### 🔐 Auth & Identity
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Registers a new student securely checking Firebase & local database validation. |
| `POST` | `/api/auth/login` | Passes stateless JWT Token checking database blocks, statuses, and role validation. |
| `GET` | `/api/auth/profile` | Yields the formatted JSON details mapped explicitly to the authenticated user. |
| `PUT` | `/api/auth/profile` | Restricted updater for minor non-critical fields (name, phone). |

### 👥 User Management
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/users/` | *Admin-Only.* Yields the global user pool separated by parameters. |
| `GET` | `/api/users/:id/profile-picture` | Buffers dynamic MongoDB profiles explicitly to `image/*` formats. |
| `PUT` | `/api/users/:id` | *Admin-Only.* Handles role/housingStatus elevations natively. |
| `DELETE` | `/api/users/:id` | Double-deletes targeting Firebase memory & local instances synchronously. |

### 🏠 Housing Application Lifecycle
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/applications` | Uploads the initial student form (PDFs, Images, Details) into memory. |
| `GET` | `/api/applications` | Polls the system for incoming forms. |
| `PATCH` | `/api/applications/:id/approve` | The internal assigning script executing the room allocation and changing Student `housingStatus`. |

### 🏬 Buildings & Rooms API
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/buildings` | Generates a new facility assigning specific thresholds and constraints. |
| `GET` | `/api/buildings/:id` | Polymorphic. Admins see full data; Students see "Shaped" safe visual data points. |
| `GET` | `/api/rooms/available` | Pulls dynamically empty/partially-empty units depending on student gender logic flags. |

### 📣 Announcements & Notifications
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/announcements` | Global broadcasting system targeting specific channels (`student`, `floor_admin`, etc.). Triggers active Web-Socket listeners. |
| `GET` | `/api/announcements` | Standard fetching logic parsing active memory against expired triggers. |

### 🛠️ Analytics & Reports
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/stats/dashboard` | Compiles extensive array calculations reflecting room fullness, application queues, and building health statuses globally! |
| `POST` | `/api/reports` | Intake standard for student problems mapped tightly to their active `$Room`. |

*(Note: Test endpoints locally via the completely synced `Swagger UI` located magically at `/api-docs`!)*

---

## 🛠️ Environmental Setup & Boot Protocol

**1. Database Check**
Ensure you have a MongoDB cluster active or running on a local docker daemon. The Mongoose connections trigger natively upon booting `server.js`.

**2. Configurations**
Create a root `.env` config with mapping parameters:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/university-housing
NODE_ENV=development
```

*(You must securely inject your Firebase Admin JSON credentials here based on standard Firebase environment keys.)*

**3. Execution**
```bash
# Package pulling
npm install

# Live Development (Auto-resets on save via Nodemon)
npm run dev

# Testing logic validations explicitly 
npm run test
```

## 👩‍💻 Contributors
Engineered by Youssif & Team - Cairo University Backend Dev Unit.
