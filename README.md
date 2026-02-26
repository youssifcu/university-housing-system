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

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# Clone and setup
git clone https://github.com/youssifcu/university-housing-system.git
cd university-housing-system
npm run setup

# Configure environment
cd mobile && cp .env.example .env
cd ../backend && cp .env.example .env
cd ../web && cp .env.example .env

# Start development
npm run dev --workspaces
```

**📖 Full setup guide:** See [docs/DEVELOPMENT.md](./docs/DEVELOPMENT.md)

---

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

## 🎯 Getting Started

### Quick Setup

1. **[Read the Development Guide](./docs/DEVELOPMENT.md)** - Complete setup instructions
2. Clone the repository
3. Install dependencies: `npm run setup`
4. Configure `.env` files in each project folder
5. Start development: `npm run dev --workspaces`

### For Contributors

If you'd like to contribute:
- [Contribution Guidelines](./docs/CONTRIBUTING.md) - How to submit PRs
- [Code of Conduct](./docs/CODE_OF_CONDUCT.md) - Community standards  
- [Git Workflow](./docs/GIT_WORKFLOW.md) - Branch and commit guidelines

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
- `POST /api/auth/register` - Register new user (requires valid Firebase ID token in Authorization header)
- `POST /api/auth/login` - Login user (requires valid Firebase ID token)
- `POST /api/auth/logout` - Logout user (token is managed client-side)

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

> **Security note:** the Firebase API key is no longer hardcoded in the repo. It should be stored in a local `.env` file (see `mobile/.env.example`) and injected via Expo's configuration extras. You can further restrict usage of the key in the Firebase/Google Cloud console by limiting it to Android/iOS package names or specific domains. Never commit the `.env` file.

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

For detailed guides and documentation, see the **[docs/](./docs/)** folder:

- **[DEVELOPMENT.md](./docs/DEVELOPMENT.md)** - Local setup and development guide
- **[CONTRIBUTING.md](./docs/CONTRIBUTING.md)** - How to contribute to the project
- **[CODE_OF_CONDUCT.md](./docs/CODE_OF_CONDUCT.md)** - Community guidelines
- **[GIT_WORKFLOW.md](./docs/GIT_WORKFLOW.md)** - Git branching and workflow
- **[CHANGELOG.md](./docs/CHANGELOG.md)** - Release notes and version history

Additional resources in docs/:
- README Guidelines, Configuration Guide, Repository Structure, GitHub Optimization

Project-specific documentation:
- [Backend API](./backend/) - Backend docs and endpoints
- [Web App](./web/) - Web application documentation  
- [Mobile App](./mobile/) - Mobile app documentation

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
