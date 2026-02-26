# 🛠️ DEVELOPMENT SETUP GUIDE

Complete guide to set up the University Housing System for local development.

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Initial Setup](#-initial-setup)
- [Environment Configuration](#-environment-configuration)
- [Running Each Service](#-running-each-service)
- [Database Setup](#-database-setup)
- [Troubleshooting](#-troubleshooting)
- [Useful Commands](#-useful-commands)
- [Development Tips](#-development-tips)

---

## 📦 Prerequisites

### Required

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
  ```bash
  node --version  # Should be v18.0.0 or higher
  npm --version   # Should be 9.x or higher
  ```

- **Git** ([Download](https://git-scm.com/))
  ```bash
  git --version   # Should be 2.30 or higher
  ```

### For Mobile Development

- **Expo CLI**
  ```bash
  npm install -g expo-cli
  expo --version
  ```

- **Expo Account** ([Sign up](https://expo.dev/))

- **Expo Go App**
  - iOS: Download from App Store
  - Android: Download from Google Play

### For Firebase

- **Firebase Account** ([Create](https://firebase.google.com/))
  - A Firebase project set up
  - Email/Password authentication enabled
  - Firestore database created

---

## 🚀 Initial Setup

### Step 1: Clone Repository

```bash
# Clone the repository
git clone https://github.com/youssifcu/university-housing-system.git

# Navigate to project
cd university-housing-system

# Verify structure
ls -la
# Should see: mobile/, web/, backend/, README.md, etc.
```

### Step 2: Install Dependencies

```bash
# Option A: Install all at once
npm run setup

# Option B: Install individually
npm install              # Root
cd mobile && npm install
cd ../web && npm install
cd ../backend && npm install
```

### Step 3: Set Up Environment Variables

#### Mobile (.env)

```bash
cd mobile
cp .env.example .env
```

Edit `mobile/.env`:
```bash
FIREBASE_API_KEY=AIzaSyA9qMYj0jfGyVXgZUVL_2L1BBgLWjyyoH4
FIREBASE_AUTH_DOMAIN=housing-53d87.firebaseapp.com
FIREBASE_PROJECT_ID=housing-53d87
FIREBASE_STORAGE_BUCKET=housing-53d87.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=399139942239
FIREBASE_APP_ID=1:399139942239:web:97bbe5b8d529031d3b50ea
```

#### Backend (.env)

```bash
cd ../backend
cp .env.example .env
```

Edit `backend/.env`:
```bash
PORT=5000
NODE_ENV=development
FIREBASE_PROJECT_ID=housing-53d87
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

**Get Firebase credentials:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (⚙️ icon)
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Copy values into `.env` files

#### Web (.env)

```bash
cd ../web
cp .env.example .env
```

Edit `web/.env`:
```bash
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=housing-53d87.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=housing-53d87
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## ⚙️ Environment Configuration

### Configuration Priority

Environment variables are loaded in this order:

1. `.env` file (highest priority)
2. `.env.local` file (if exists)
3. Process environment variables
4. `.env.example` file (fallback)

### Viewing Current Configuration

```bash
# Mobile
cd mobile
cat .env

# Backend
cd ../backend
cat .env

# Web
cd ../web
cat .env
```

### Important: Don't Commit .env Files

```bash
# These should NEVER be committed
# .gitignore already ignores them
git status  # Should NOT show .env files
```

---

## 🏃 Running Each Service

### Option 1: Run All Services

```bash
# Start all with one command
npm run dev --workspaces
```

### Option 2: Run Services Individually

#### Run Mobile App

```bash
cd mobile
npm start

# Output:
# Expo server is running on http://localhost:19000
# Tunnel: https://u.expo.dev/...
# 
# Press 'i' to open iOS
# Press 'a' to open Android
# Press 'w' to open web
# Press 'r' to restart
# Press 's' to send symbol
# Press 'q' to quit
```

**Using Expo Go (on your phone):**
1. Install Expo Go app (iOS/Android)
2. Scan QR code shown in terminal
3. App opens on your phone

**Using iOS Simulator:**
```bash
cd mobile
npm start
# Press 'i'
```

**Using Android Emulator:**
```bash
cd mobile
npm start
# Press 'a'
```

#### Run Web App

```bash
cd web
npm run dev

# Output:
# ➜  Local:   http://localhost:5173/
# ➜  press h + enter to show help
```

Visit http://localhost:5173 in your browser.

#### Run Backend API

```bash
cd backend
npm run dev

# Output:
# Server running on port 5000
# Environment: development
# Database: Connected
```

Backend runs on http://localhost:5000

---

## 🗄️ Database Setup

### Firebase Firestore Setup

1. **Create Database**
   - Go to Firebase Console
   - Select your project
   - Go to "Firestore Database"
   - Click "Create Database"
   - Choose location
   - Start in "Test Mode"

2. **Create Collections**

```
users/
  └── [userId]
      ├── fullName: "John Doe"
      ├── email: "john@university.edu"
      ├── studentId: "123456"
      ├── role: "student"
      └── createdAt: timestamp

housing/
  └── [housingId]
      ├── name: "Dorm A"
      ├── address: "123 University St"
      ├── price: 500
      ├── amenities: ["WiFi", "AC", "Parking"]
      ├── images: ["url1", "url2"]
      └── availableRooms: 5

bookings/
  └── [bookingId]
      ├── userId: [userId]
      ├── housingId: [housingId]
      ├── checkInDate: timestamp
      ├── checkOutDate: timestamp
      ├── status: "confirmed"
      ├── totalPrice: 500
      └── createdAt: timestamp
```

3. **Set Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write their own user document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Allow anyone to read housing (public)
    match /housing/{document=**} {
      allow read: if true;
      allow write: if false;  // Only admin can write
    }
    
    // Allow authenticated users to manage their bookings
    match /bookings/{bookingId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid != null;
    }
  }
}
```

---

## 🔧 Troubleshooting

### Mobile Issues

#### "Unmatched Route" Error
```
Error: Unmatched Route "/login"
```

**Solution:** Routes use folder names without parentheses.
- ✅ Correct: `router.push('/login')`
- ❌ Wrong: `router.push('/(auth)/login')`

#### Firebase Invalid API Key
```
Error: auth/invalid-api-key
```

**Solution:**
1. Check `.env` file has Firebase credentials
2. Restart Expo: `npm start -c`
3. Verify credentials in Firebase Console

#### "expo-image-picker" not found
```
Error: Cannot resolve module "expo-image-picker"
```

**Solution:**
```bash
cd mobile
expo install expo-image-picker
npm start -c
```

### Web Issues

#### Port Already in Use
```
Error: error listening on port 5173
```

**Solution:**
```bash
# Find and kill process using port 5173
lsof -i :5173
kill -9 <PID>

# Or use different port
npm run dev -- --port 5174
```

#### Vite Cache Issues
```bash
# Clear Vite cache
rm -rf web/.vite
npm run dev
```

### Backend Issues

#### Port 5000 in Use
```bash
# Find process
netstat -tuln | grep 5000

# Kill it
kill -9 <PID>

# Or use different port
PORT=5001 npm run dev
```

#### Firebase Admin SDK Error
```
Error: Certificate not valid
```

**Solution:** Verify `.env` has correct Firebase credentials:
```bash
cat backend/.env | grep FIREBASE
```

### General Issues

#### Clear All Caches

```bash
# Clear npm cache
npm cache clean --force

# Clear Expo cache
cd mobile
expo start -c

# Clear Metro bundler cache
cd mobile
rm -rf .metro-cache
```

#### Restart Everything

```bash
# Full reset
npm run setup

# Kill all node processes
killall node

# Start fresh
npm run dev --workspaces
```

---

## 📚 Useful Commands

### Development

```bash
# Start all services
npm run dev --workspaces

# Start individual service
npm run mobile:dev
npm run web:dev
npm run backend:dev
```

### Testing

```bash
# Run all tests
npm test --workspaces

# Run tests for specific service
cd mobile && npm test
```

### Linting & Formatting

```bash
# Lint all code
npm run lint --workspaces

# Format code
npm run format

# Check formatting
npm run format:check
```

### Building

```bash
# Build all
npm run build --workspaces

# Build specific service
npm run web:build
npm run backend:build
```

### Debugging

```bash
# Mobile debugging
cd mobile
npm start
# In terminal: press 'd' or shake device

# Backend debugging
cd backend
node --inspect server.js

# Web debugging
Open DevTools: F12 or Cmd+I
```

---

## 💡 Development Tips

### 1. Use VS Code Debugger

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Backend Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/server.js",
      "restart": true,
      "console": "integratedTerminal"
    }
  ]
}
```

### 2. Use Better Console Logs

```typescript
// Good logging
import { logger } from './utils/logger';

logger.info('User created:', userId);
logger.error('Database error:', error);
logger.debug('Request data:', data);
```

### 3. Environment-Specific Code

```typescript
// Only in development
if (process.env.NODE_ENV === 'development') {
  console.log('Development mode');
}

// Only in production
if (process.env.NODE_ENV === 'production') {
  // Production-only logic
}
```

### 4. Use Hot Module Replacement

```typescript
// Mobile - Expo Hot Reload
// Automatically reloads on file save

// Web - Vite HMR
// Automatically reloads on file save

// Backend - Nodemon
// Automatically restarts on file save
```

### 5. Testing During Development

```bash
# Run tests in watch mode
npm test -- --watch

# Run specific test
npm test -- getUserById.test.js

# Run with coverage
npm test -- --coverage
```

### 6. API Testing Tools

Use one of these for testing backend:

- **Postman:** https://www.postman.com/ (GUI)
- **Insomnia:** https://insomnia.rest/ (GUI)
- **cURL:** Built-in command-line tool
- **REST Client:** VS Code extension

**Example cURL request:**
```bash
curl -X GET http://localhost:5000/api/housing \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json"
```

### 7. Local Database Inspection

**Firestore:**
- Web UI: https://console.firebase.google.com/ → Firestore Database

**Backend Logs:**
```bash
cd backend
npm run dev
# Logs appear in console
```

### 8. Device Testing (Mobile)

Test on actual device:

```bash
# iOS
1. Run `npm start` in mobile/
2. Open Expo Go app
3. Scan QR code

# Android
1. Run `npm start` in mobile/
2. Open Expo Go app
3. Scan QR code
```

---

## 🔄 Typical Development Workflow

```bash
# Morning: Start fresh
git checkout develop
git pull origin develop

# Start all services
npm run dev --workspaces

# During development
# - Edit files in VS Code
# - Hot reload auto-refreshes
# - Check console for errors

# Before committing
npm run lint --workspaces       # Check code style
npm test --workspaces          # Run tests
git status                      # Check changes

# Commit and push
git add .
git commit -m "feat: add feature"
git push origin feature/feature-name

# Create PR on GitHub
```

---

## ✅ Verification Checklist

After setup, verify everything works:

- [ ] `node --version` shows 18.x or higher
- [ ] `npm --version` shows 9.x or higher
- [ ] All `.env` files created and filled
- [ ] `npm install` completes without errors
- [ ] Mobile app starts: `npm run mobile:dev`
- [ ] Web app starts: `npm run web:dev`
- [ ] Backend starts: `npm run backend:dev`
- [ ] Can scan QR code and open mobile app
- [ ] Can access web app at localhost:5173
- [ ] Can reach backend at localhost:5000
- [ ] Tests pass: `npm test --workspaces`
- [ ] Linting passes: `npm run lint --workspaces`

---

## 🆘 Still Need Help?

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Ask in [GitHub Discussions](https://github.com/youssifcu/university-housing-system/discussions)
- Check [GitHub Issues](https://github.com/youssifcu/university-housing-system/issues)

---

**Happy developing! 🚀**
