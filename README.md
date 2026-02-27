# University Housing System - Mobile Application

A cross-platform mobile application for University Housing System, built with React Native/Flutter.

## Overview

The mobile application provides:
- Native performance on iOS and Android
- Offline-first design with data sync
- Push notifications for housing updates
- Room request submission and tracking
- User profile and settings management
- Real-time status notifications

## Tech Stack

- **Framework:** React Native / Flutter
- **Language:** JavaScript/TypeScript / Dart
- **State Management:** Redux/Context API / Provider/Riverpod
- **Navigation:** React Navigation / Flutter Navigation
- **Storage:** AsyncStorage/SQLite / Hive
- **API Client:** Axios / Dio
- **Testing:** Jest / Flutter Test

## Project Structure

```
mobile/
├── app/                    # App code
│   ├── screens/            # Screen components
│   ├── components/         # Reusable components
│   ├── navigation/         # Navigation setup
│   ├── services/           # API services
│   ├── store/              # State management
│   ├── utils/              # Utilities
│   ├── config/             # Configuration
│   └── assets/             # Images, fonts
├── ios/                    # iOS native code
├── android/                # Android native code
├── tests/                  # Test files
├── app.json               # Expo/app config
├── package.json           # Dependencies
└── README.md             # This file
```

## Prerequisites

### For Development
- Node.js 16+ / Dart 2.17+
- npm/yarn / pub
- Xcode 13+ (for iOS)
- Android Studio (for Android)
- Git
- React Native CLI / Flutter SDK

### For Testing
- iOS: Simulator or device
- Android: Emulator or device

## Installation

### React Native Setup

1. **Checkout the mobile branch:**
   ```bash
   git checkout mobile
   cd mobile
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Install iOS pods (macOS only):**
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Create environment file:**
   ```bash
   cp .env.example .env
   ```

5. **Configure environment:**
   ```env
   API_BASE_URL=http://localhost:3001/api
   API_KEY=your_api_key
   ENVIRONMENT=development
   ```

### Flutter Setup

1. **Checkout the mobile branch:**
   ```bash
   git checkout mobile
   cd mobile
   ```

2. **Get dependencies:**
   ```bash
   flutter pub get
   ```

3. **Create configuration:**
   ```bash
   cp .env.example .env
   ```

## Development

### React Native

#### Start Development Server
```bash
npm start
```

#### Run on iOS
```bash
npx react-native run-ios
```

#### Run on Android
```bash
npx react-native run-android
```

#### Available Scripts
```bash
# Start Metro bundler
npm start

# Run iOS simulator
npm run ios

# Run Android emulator
npm run android

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Lint code
npm run lint

# Format code
npm run format
```

### Flutter

#### Start Development Server
```bash
flutter run
```

#### Run on iOS
```bash
flutter run -d iphone
```

#### Run on Android
```bash
flutter run -d android
```

#### Available Commands
```bash
# Run app
flutter run

# Run with verbose logging
flutter run -v

# Run tests
flutter test

# Generate code
flutter pub get

# Clean and rebuild
flutter clean && flutter pub get

# Build APK
flutter build apk

# Build iOS app
flutter build ios
```

## Features

### User Features
- 📱 Easy-to-use interface
- 🏠 Browse housing options
- 📝 Submit room requests
- ✅ Track request status in real-time
- 👤 Manage profile and preferences
- 🔔 Push notifications
- 📲 Offline access to saved data
- 🎨 Dark mode support

### Technical Features
- ✅ Offline-first architecture
- 🔐 Secure authentication
- 📍 Background data sync
- 💾 Local caching
- 🚀 Fast performance
- 📊 Analytics integration

## Architecture

### State Management (React Native)
```javascript
// Redux store structure
store: {
  auth: { user, token, isLoading },
  housing: { items, selectedItem, isLoading },
  requests: { items, selectedRequest },
  ui: { theme, notifications }
}
```

### Navigation Structure
```
Root
├── Auth Stack
│   ├── Login
│   └── Register
└── App Stack
    ├── Housing (Tab Navigator)
    │   ├── Housing List
    │   └── Housing Details
    ├── Requests (Tab Navigator)
    │   ├── Submit Request
    │   └── Request List
    ├── Profile (Tab Navigator)
    │   ├── Profile
    │   └── Settings
    └── Admin (Tab Navigator - conditional)
```

## API Integration

### Authentication Flow
```javascript
// Login
POST /api/auth/login -> token

// Subsequent requests
Authorization: Bearer {token}
```

### Data Synchronization
- Background sync when online
- Queue requests when offline
- Retry failed requests
- Cache data locally

## Offline Support

### Stored Data
- User profile
- Housing listings
- Room requests
- Recent actions

### Sync Strategy
```javascript
// On app launch
1. Check internet connection
2. Sync pending changes
3. Download fresh data
4. Cache locally
```

## Testing

### React Native

#### Run Tests
```bash
npm test
```

#### Jest Configuration
```javascript
// Example test
describe('Housing Service', () => {
  it('should fetch housing', async () => {
    const houses = await HousingService.getAll();
    expect(houses.length).toBeGreaterThan(0);
  });
});
```

### Flutter

#### Run Tests
```bash
flutter test
```

## Building for Production

### React Native

#### Build iOS
```bash
# Archive for TestFlight/App Store
cd ios
xcodebuild -workspace University.xcworkspace -scheme University -configuration Release
```

#### Build Android
```bash
# Create signed APK
cd android
./gradlew assembleRelease

# Create signed AAB for Play Store
./gradlew bundleRelease
```

### Flutter

#### Build iOS
```bash
flutter build ios --release
```

#### Build Android
```bash
flutter build apk --release
```

## Deployment

### App Store (iOS)
1. Build release: `npm run build:ios`
2. Upload via Xcode or Transporter
3. Wait for review (~24 hours)
4. Publish

### Google Play (Android)
1. Build release: `npm run build:android`
2. Sign APK/AAB
3. Upload to Play Console
4. Wait for review (~2-3 hours)
5. Publish

### Version Management
Update version in:
- `app.json` (React Native)
- `pubspec.yaml` (Flutter)
- Native project files

## Performance Optimization

### Bundle Size
- Tree-shake unused code
- Lazy load screens
- Image optimization
- Remove console logs in production

### Runtime Performance
- Memoize expensive components
- Optimize list rendering
- Reduce re-renders
- Profile with DevTools

### Battery & Storage
- Minimize background sync
- Compress data transfers
- Clean up cache periodically
- Use efficient storage

## Debugging

### React Native
```bash
# Shake device to open menu
# Or: adb shell input keyevent 82 (Android)

# Enable remote debugging
# Check Metro bundler for errors
# Use React Native Debugger
```

### Flutter
```bash
# Use DevTools
flutter pub global activate devtools
devtools

# Hot reload
R (while running)

# Hot restart
Shift+R
```

## Troubleshooting

### Build Issues
```bash
# Clean build
npm run clean  # React Native
flutter clean  # Flutter

# Reinstall dependencies
npm install  # React Native
flutter pub get  # Flutter
```

### Common Issues

#### Pod Install Failed (iOS)
```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

#### Gradle Build Failed (Android)
```bash
cd android
./gradlew clean
./gradlew build
cd ..
```

#### Metro Bundler Issues
```bash
# Clear cache
npm start -- --reset-cache
```

## Device Support

### iOS
- Minimum: iOS 11.0
- Tested: iOS 15+
- Supported: iPhone 8+

### Android
- Minimum: API 21 (Android 5.0)
- Target: API 31+
- Tested: Android 10+

## Dependencies

Key packages:
- React Navigation / Flutter Navigation
- Redux / Provider
- Axios / Dio
- AsyncStorage / Hive
- React Native Vector Icons / Flutter Icons
- Testing libraries (Jest/Flutter Test)

## Code Style

### ESLint Rules
```bash
npm run lint
npm run lint:fix
```

### Dart Analysis
```bash
flutter analyze
dartfmt -w .
```

## Security

- ✅ Secure token storage (Keychain/Keystore)
- ✅ SSL pinning
- ✅ Input validation
- ✅ Secure API communication
- ✅ Data encryption at rest

## Contributing

1. Create feature branch: `git checkout -b feature/new-screen`
2. Write tests for features
3. Test on both platforms
4. Lint and format code
5. Submit Pull Request

## Support & Contact

- 📧 Mobile Team: mobile-team@example.com
- 📚 Documentation: [Wiki](https://github.com/youssifcu/university-housing-system/wiki)
- 🐛 Issues: [GitHub Issues](https://github.com/youssifcu/university-housing-system/issues)
- 💬 React Native Docs: https://reactnative.dev
- 💬 Flutter Docs: https://flutter.dev

---

**Last Updated:** February 27, 2026
