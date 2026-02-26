# 📁 REPOSITORY STRUCTURE GUIDE

## Recommended Directory Structure for React Native + Web + Backend

```
university-housing-system/
├── 📄 Root Configuration Files
│   ├── .gitignore              # Git ignore rules (all platforms)
│   ├── .env.example            # Example environment variables (TEMPLATE)
│   ├── .github/                # GitHub specific configs
│   │   ├── workflows/          # CI/CD pipelines
│   │   ├── ISSUE_TEMPLATE.md   # Issue templates
│   │   └── PULL_REQUEST_TEMPLATE.md
│   ├── .editorconfig           # Code editor configurations
│   ├── package.json            # Root workspace (mono-repo)
│   ├── README.md               # Main project README
│   ├── CONTRIBUTING.md         # Contribution guidelines
│   ├── LICENSE                 # License file (MIT/Apache)
│   └── CHANGELOG.md            # Version history
│
├── 📱 Mobile App (React Native + Expo)
│   ├── .env                    # Firebase credentials (DO NOT COMMIT)
│   ├── .env.example            # Template for .env
│   ├── app.config.js           # Expo config
│   ├── babel.config.js         # Babel configuration
│   ├── package.json
│   ├── tsconfig.json           # TypeScript config
│   ├── app/                    # App routes (Expo Router)
│   │   ├── _layout.tsx         # Root layout
│   │   ├── (auth)/
│   │   │   ├── _layout.tsx
│   │   │   ├── login.tsx
│   │   │   ├── register.tsx
│   │   │   └── forgot.tsx
│   │   └── (tabs)/
│   │       ├── _layout.tsx
│   │       ├── index.tsx       # Home/Explore
│   │       ├── profile.tsx
│   │       └── bookings.tsx
│   ├── components/             # Reusable UI components
│   │   ├── ui/                 # Basic UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Modal.tsx
│   │   ├── features/           # Feature-specific components
│   │   │   ├── HousingCard.tsx
│   │   │   ├── BookingForm.tsx
│   │   │   └── ReviewsList.tsx
│   │   └── ModernLoginScreen.tsx
│   ├── services/               # APIs & external services
│   │   ├── firebaseService.ts
│   │   ├── authService.ts
│   │   ├── housingService.ts
│   │   └── bookingService.ts
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useAuth.ts
│   │   ├── useBooking.ts
│   │   └── useFetch.ts
│   ├── contexts/               # React Context (State Management)
│   │   ├── AuthContext.tsx
│   │   ├── LanguageContext.tsx
│   │   └── ThemeContext.tsx
│   ├── constants/              # Constants & configurations
│   │   ├── colors.ts
│   │   ├── appTheme.ts
│   │   ├── strings.ts
│   │   └── endpoints.ts
│   ├── utils/                  # Utility functions
│   │   ├── validators.ts
│   │   ├── formatters.ts
│   │   ├── api.ts
│   │   └── storage.ts
│   ├── assets/                 # Images, fonts, icons
│   │   ├── images/
│   │   ├── fonts/
│   │   └── icons/
│   ├── firebaseConfig.ts
│   ├── __tests__/              # Test files
│   │   ├── auth.test.ts
│   │   ├── components.test.tsx
│   │   └── services.test.ts
│   └── TROUBLESHOOTING.md      # Mobile-specific troubleshooting
│
├── 🌐 Web App (React + Vite)
│   ├── .env                    # Environment variables
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── index.html
│   ├── package.json
│   ├── src/
│   │   ├── main.tsx            # Entry point
│   │   ├── App.tsx
│   │   ├── pages/              # Page components
│   │   │   ├── HomePage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── BookingsPage.tsx
│   │   │   └── ProfilePage.tsx
│   │   ├── components/         # Reusable components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── HousingCard.tsx
│   │   │   └── BookingForm.tsx
│   │   ├── services/           # API services
│   │   ├── hooks/              # Custom hooks
│   │   ├── contexts/           # State management
│   │   ├── utils/
│   │   ├── styles/             # CSS/SCSS files
│   │   └── assets/
│   ├── tests/
│   └── README.md
│
├── 🔧 Backend API (Node.js + Express)
│   ├── .env                    # Private credentials (DO NOT COMMIT)
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json (if using TypeScript)
│   ├── server.js               # Entry point
│   ├── src/
│   │   ├── app.js              # Express app setup
│   │   ├── config/
│   │   │   ├── db.js           # Database connection
│   │   │   ├── firebase.js     # Firebase admin SDK
│   │   │   └── env.js          # Environment variables
│   │   ├── controllers/        # Business logic
│   │   │   ├── authController.js
│   │   │   ├── housingController.js
│   │   │   └── bookingController.js
│   │   ├── routes/             # API routes
│   │   │   ├── authRoutes.js
│   │   │   ├── housingRoutes.js
│   │   │   └── bookingRoutes.js
│   │   ├── middlewares/        # Express middlewares
│   │   │   ├── verifyFirebaseToken.js
│   │   │   ├── errorHandler.js
│   │   │   └── logging.js
│   │   ├── models/             # Database models
│   │   │   ├── User.js
│   │   │   ├── Housing.js
│   │   │   └── Booking.js
│   │   ├── utils/              # Utility functions
│   │   │   ├── validators.js
│   │   │   └── responseHandler.js
│   │   └── services/           # External services
│   │       ├── emailService.js
│   │       └── paymentService.js
│   ├── test/                   # Tests
│   │   ├── auth.test.js
│   │   └── api.test.js
│   └── README.md
│
├── 📚 Documentation
│   ├── API.md                  # API documentation
│   ├── DEPLOYMENT.md           # Deployment guide
│   ├── DEVELOPMENT.md          # Development setup
│   ├── DATABASE_DESIGN.md      # Database schema
│   └── ARCHITECTURE.md         # System design
│
└── 🔄 CI/CD & Scripts
    ├── .github/workflows/
    │   ├── test.yml            # Run tests on push
    │   ├── deploy.yml          # Deploy to production
    │   └── lint.yml            # Code linting
    └── scripts/
        ├── setup.sh            # Initial project setup
        └── deploy.sh           # Deployment script
```

---

## 📂 Tree View of Your Current Structure

Your project already has good organization:

```
university-housing-system/
├── mobile/                 ✅ React Native + Expo
│   ├── app/               (Expo Router - good!)
│   ├── components/
│   ├── contexts/
│   ├── constants/
│   ├── hooks/
│   ├── services/          (Consider adding)
│   └── utils/
│
├── web/                    ✅ React + Vite
│   ├── src/
│   ├── components/
│   └── assets/
│
├── backend/                ✅ Node.js + Express
│   ├── src/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   ├── models/
│   └── utils/
│
└── 📋 Root level
    ├── README.md          ✅ Good start
    ├── package.json       ✅ Have workspace config
    └── .gitignore         ❌ MISSING (critical!)
```

---

## 🎯 Improvements to Make

### 1. **Create Root .gitignore** (PRIORITY 1)

See detailed guide below.

### 2. **Add Configuration Files**

- `.editorconfig` - Formatting rules
- `.env.example` - Template for secrets
- `.github/workflows/` - CI/CD pipelines

### 3. **Organize Services Layer**

Move common API logic to `shared/services/`:

```
shared/
└── services/
    ├── firebaseService.ts    # Shared Firebase config
    ├── apiClient.ts          # HTTP client
    ├── authService.ts        # Auth logic
    └── storageService.ts     # Local storage wrap
```

### 4. **Add Documentation**

- `CONTRIBUTING.md` - How to contribute
- `DEVELOPMENT.md` - Local setup guide
- `DEPLOYMENT.md` - How to deploy
- `API.md` - API endpoints
- `DATABASE_DESIGN.md` - Data schema

### 5. **GitHub Workflows**

Add automated testing and linting in `.github/workflows/`

---

## 📋 Next Steps

1. ✅ Create root `.gitignore`
2. ✅ Add `.env.example` files
3. ✅ Create `CONTRIBUTING.md`
4. ✅ Create `DEVELOPMENT.md`
5. ✅ Add `.github/workflows/` for CI/CD
6. ✅ Consolidate shared utilities in `shared/`
7. ✅ Add TypeScript strict mode

See other documentation files for implementation details!
