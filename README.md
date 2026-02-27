# University Housing System

A comprehensive multi-platform solution for managing university housing, featuring web, mobile, and backend applications.

## Overview

The University Housing System is designed to streamline housing management, allocation, and operations for university students and administrators. This repository contains the monorepo structure with separate applications for different platforms.

## Project Structure

```
university-housing-system/
├── web/              # Web application (React/Vue/Next.js)
├── mobile/           # Mobile application (React Native/Flutter)
├── backend/          # Backend API services
├── docs/             # Documentation
└── README.md         # This file
```

## Branches

This repository uses a multi-branch strategy:

| Branch | Purpose | Status |
|--------|---------|--------|
| `main` | Production-ready main branch (this branch) | Active |
| `web` | Web application source code | Active |
| `backend` | Backend API and services | Active |
| `mobile` | Mobile application source code | Active |

**Note:** Each branch contains its own README with specific setup and development instructions.

## Key Features

- 🏢 Housing management and allocation system
- 👥 User and role-based access control
- 📱 Cross-platform support (Web, Mobile, Desktop)
- 🔐 Secure authentication and authorization
- 📊 Analytics and reporting dashboards
- 🔄 Real-time synchronization

## Tech Stack Overview

### Web Application
- Frontend framework (React/Vue/Next.js)
- State management (Redux/Vuex/Zustand)
- UI component library
- Build tool (Webpack/Vite)

### Mobile Application
- React Native / Flutter
- Native modules for platform-specific features
- Push notifications
- Offline storage

### Backend
- Node.js / Python / Java
- Express / FastAPI / Spring Boot
- Database (PostgreSQL / MongoDB)
- Authentication (JWT / OAuth2)

## Quick Start

### Prerequisites
- Node.js 16+ or equivalent runtime
- Git
- Docker (optional, for containerized setup)

### Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/youssifcu/university-housing-system.git
   cd university-housing-system
   ```

2. **For Web Development:**
   ```bash
   git checkout web
   cd web
   npm install
   npm run dev
   ```

3. **For Backend Development:**
   ```bash
   git checkout backend
   cd backend
   npm install
   npm start
   ```

4. **For Mobile Development:**
   ```bash
   git checkout mobile
   cd mobile
   npm install
   npx react-native run-android  # or run-ios
   ```

## Documentation

- **Branch-specific guides:** See README.md in each branch
- **API Documentation:** Check the `backend` branch for API specs
- **Setup Guides:** Each branch contains comprehensive setup instructions
- **Contributing:** See CONTRIBUTING.md for development guidelines

## Development Workflow

1. Create feature branches from the main development branch
2. Follow the commit message conventions
3. Create pull requests for code review
4. Ensure all tests pass before merging
5. Maintain branch-specific documentation

## Common Tasks

### Viewing Web Application
```bash
git checkout web
# See web/README.md for detailed instructions
```

### Viewing Backend Code
```bash
git checkout backend
# See backend/README.md for detailed instructions
```

### Viewing Mobile Application
```bash
git checkout mobile
# See mobile/README.md for detailed instructions
```

## Building for Production

See the respective branch README files for production build instructions:
- Web: `git checkout web && cat README.md`
- Backend: `git checkout backend && cat README.md`
- Mobile: `git checkout mobile && cat README.md`

## Environment Configuration

Each branch requires specific environment variables. Example `.env` files are provided in each branch:

- `.env.example` - Template for environment variables
- `.env.local` - Your local configuration (should not be committed)

## Testing

Run tests in each branch:

```bash
# Web tests
git checkout web && npm test

# Backend tests
git checkout backend && npm test

# Mobile tests
git checkout mobile && npm test
```

## Deployment

Deployment instructions are maintained in each branch:
- Web deployment: See `web` branch
- Backend deployment: See `backend` branch
- Mobile deployment: See `mobile` branch

## Troubleshooting

### Issue: Repository tracking shows node_modules
**Solution:** The `.gitignore` file is configured to exclude `node_modules/`. If you see them staged, run:
```bash
git rm -r --cached node_modules/
git add .gitignore
git commit -m "Remove node_modules from tracking"
```

### Issue: Branch switching loses local changes
**Solution:** Stash changes before switching branches:
```bash
git stash
git checkout other-branch
# Later restore:
git stash pop
```

## Performance & Optimization

- Web: Check `web` branch for optimization guidelines
- Backend: Check `backend` branch for API optimization
- Mobile: Check `mobile` branch for battery and storage optimization

## Security

- Store secrets in `.env.local` (not committed)
- Use environment variables for sensitive data
- Review security guidelines in each branch
- Report security issues responsibly (contact maintainers)

## Contributing

We welcome contributions! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests and documentation
5. Submit a pull request

See CONTRIBUTING.md for detailed guidelines.

## License

This project is licensed under the [LICENSE](LICENSE) - see file for details.

## Support & Contact

- 📧 Email: support@example.com
- 💬 Issues: GitHub Issues
- 📚 Documentation: [See Wiki](https://github.com/youssifcu/university-housing-system/wiki)
- 👥 Team: See CONTRIBUTORS.md

## Roadmap

- [ ] Feature 1
- [ ] Feature 2
- [ ] Feature 3
- [ ] Performance improvements
- [ ] Enhanced security features

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

---

**Last Updated:** February 27, 2026

For branch-specific information, switch to that branch:
- `git checkout web` - For web application details
- `git checkout backend` - For backend API details
- `git checkout mobile` - For mobile application details
