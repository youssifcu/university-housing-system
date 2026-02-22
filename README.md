# University Housing System

نظام إدارة السكن الجامعي | A comprehensive platform for university housing management.

## 📋 Project Overview

The University Housing System is a full-stack application designed to manage student housing at universities. It provides a seamless experience for students to browse, book, and manage their housing arrangements, while administrators can manage properties and bookings efficiently.

### ✨ Key Features

- **User Authentication**: Secure login and registration using Firebase
- **Housing Listings**: Browse available housing options with details and images
- **Booking System**: Easy booking and reservation management
- **User Dashboard**: View and manage personal bookings
- **Admin Panel**: Manage properties and bookings (backend)
- **Mobile Access**: Native mobile app for on-the-go access
- **Web Platform**: Responsive web interface for desktop users

## 🏗️ Architecture

The project is built with a **3-tier architecture**:

```
┌─────────────────────────────────────────┐
│          Frontend (Web & Mobile)        │
│    - React (Web with Vite)              │
│    - React Native (Mobile with Expo)    │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│      Backend API (Node.js + Express)    │
│    - RESTful API endpoints              │
│    - Firebase authentication            │
│    - Database operations                │
└─────────────┬───────────────────────────┘
              │
┌─────────────▼───────────────────────────┐
│         Firebase & Database             │
│    - Authentication                     │
│    - Firestore/Realtime Database        │
└─────────────────────────────────────────┘
```

## 📁 Project Structure

```
university-housing-system/
├── backend/              # Node.js Express API server
│   ├── src/
│   │   ├── app.js       # Express app configuration
│   │   ├── config/      # Database & Firebase config
│   │   ├── controllers/ # Route handlers
│   │   ├── middlewares/ # Authentication middleware
│   │   ├── models/      # Database schemas
│   │   ├── routes/      # API routes
│   │   └── utils/       # Helper functions
│   └── server.js        # Server entry point
│
├── mobile/              # React Native / Expo mobile app
│   ├── app/            # App navigation & screens
│   ├── components/     # Reusable UI components
│   ├── constants/      # App constants & theme
│   └── hooks/          # Custom React hooks
│
├── web/                # React + Vite web application
│   ├── src/
│   │   ├── App.tsx     # Main app component
│   │   └── assets/     # Static assets
│   └── vite.config.ts  # Vite configuration
│
└── package.json        # Root workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v14 or higher)
- **npm** or **yarn** package manager
- **Firebase** account with credentials
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd university-housing-system
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   cd ..
   ```

3. **Install web app dependencies**
   ```bash
   cd web
   npm install
   cd ..
   ```

4. **Install mobile app dependencies**
   ```bash
   cd mobile
   npm install
   cd ..
   ```

### Configuration

1. **Firebase Setup** (Backend)
   - Add your `serviceAccountKey.json` to the `backend/` folder
   - Update `backend/src/config/firebase.js` with your Firebase credentials

2. **Database Configuration**
   - Configure database connection in `backend/src/config/db.js`

### Running the Application

#### Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:3000 (or configured port)
```

#### Web Application
```bash
cd web
npm run dev
# Web app runs on http://localhost:5173
```

#### Mobile Application
```bash
cd mobile
npm run ios      # For iOS
npm run android  # For Android
npm run web      # For web preview
```

## 🔧 Technology Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Firebase** - Authentication & Database
- **Middleware** - Token verification & authentication

### Frontend (Web)
- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **CSS** - Styling

### Mobile
- **React Native** - Cross-platform mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **Responsive Design** - Mobile optimization

## 📡 API Endpoints

### Authentication Routes
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Housing Routes
- `GET /api/housing` - Get all housing listings
- `GET /api/housing/:id` - Get housing details
- `POST /api/housing` - Create new housing (admin)
- `PUT /api/housing/:id` - Update housing (admin)
- `DELETE /api/housing/:id` - Delete housing (admin)

### User Routes
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/bookings` - Get user bookings

### Booking Routes
- `POST /api/bookings` - Create new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

## 🔐 Security

- **Firebase Authentication** - Secure user authentication
- **JWT Tokens** - Token-based API authorization
- **Environment Variables** - Sensitive data protection
- **Middleware Validation** - Request validation & filtering
- **CORS** - Cross-origin request security

## 📱 Features by Platform

### Web Application
- Complete housing browsing experience
- Advanced search and filters
- Booking management dashboard
- User profile settings
- Responsive design for all devices

### Mobile Application
- Native performance
- Touch-optimized UI
- Offline capabilities
- Push notifications (future)
- Location-based features

### Backend API
- RESTful endpoints
- Real-time data updates
- Admin management tools
- Comprehensive logging
- Error handling

## 🐛 Troubleshooting

### Backend Issues
- Ensure Node.js version compatibility
- Check Firebase credentials in `serviceAccountKey.json`
- Verify database connection strings
- Check environment variables

### Web/Mobile Issues
- Clear node_modules and reinstall: `npm install`
- Clear cache: `npm cache clean --force`
- Check port availability
- Verify API endpoint configuration

## 📚 Documentation

For detailed documentation, see:
- Backend API docs: `backend/README.md`
- Web app docs: `web/README.md`
- Mobile app docs: `mobile/README.md`

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit your changes (`git commit -m 'Add feature'`)
3. Push to the branch (`git push origin feature/your-feature`)
4. Create a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ✅ Development Checklist

- [ ] Firebase project setup
- [ ] Backend API configuration
- [ ] Database schema migration
- [ ] Web frontend development
- [ ] Mobile app development
- [ ] API integration testing
- [ ] User authentication flow
- [ ] Booking system testing
- [ ] UI/UX optimization
- [ ] Performance optimization
- [ ] Security audit
- [ ] Deployment preparation

## 🎯 Future Enhancements

- [ ] Payment integration
- [ ] Push notifications
- [ ] Rating & review system
- [ ] Advanced search filters
- [ ] Real-time messaging
- [ ] Analytics dashboard
- [ ] Multi-language support
- [ ] Accessibility improvements

---

**Last Updated**: February 2026

For questions or support, please contact the development team or open an issue on the repository.
