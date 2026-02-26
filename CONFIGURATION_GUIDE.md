# ⚙️ CONFIGURATION FILES GUIDE

Essential configuration files for a professional repository.

---

## 📋 Root-Level `.gitignore`

**Create: `/workspaces/university-housing-system/.gitignore`**

This file should ignore:
- Dependencies (node_modules)
- Environment variables (.env files)
- OS files (.DS_Store, Thumbs.db)
- IDE configurations (.vscode, .idea)
- Build outputs (dist, build)
- Log files
- Operating system files

Here's the comprehensive template:

```gitignore
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Environment variables (NEVER commit secrets!)
.env
.env.local
.env.*.local
.env.production.local

# Build outputs
dist/
build/
.dist/
*.tsbuildinfo

# IDE & Editor
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db
*.sublime-project
*.sublime-workspace

# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
desktop.ini

# Runtime & Testing
coverage/
.nyc_output/
*.lcov
jest-coverage/
test-results/

# Logs
logs/
*.log

# Temporary files
tmp/
temp/
*.tmp

# macOS
.AppleDouble
.LSOverride
._*

# Windows
$RECYCLE.BIN/

# Firebase
serviceAccountKey.json
firebase-debug.log

# Expo
.expo/
.expo-shared/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision
*.orig.*
web-build/

# React Native
.gradle
.m2
local.properties
GeneratedPluginRegistrant.java

# Misc
.cache/
*.pidfile
```

---

## 📋 Root-Level `.gitignore` (Mobile-specific additions)

Ensure mobile/.gitignore includes:

```gitignore
# Expo specific
.expo/
.expo-shared/
dist/
npm-debug.*
*.jks
*.p8
*.p12
*.key
*.mobileprovision

# React Native
android/
ios/
node_modules/

# Environment
.env
.env.local

# Build
.dist/
build/
```

---

## 📋 `.env.example` Files

**Create these TEMPLATES** (without actual secrets):

### Mobile: `/mobile/.env.example`
```bash
# Firebase Configuration
# Get these from: Firebase Console → Project Settings → Your apps → web/iOS/Android
FIREBASE_API_KEY=AIza...
FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
FIREBASE_PROJECT_ID=your-project
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=123456789
FIREBASE_APP_ID=1:123456789:web:abcdef123456

# API Configuration
API_BASE_URL=https://api.example.com
API_TIMEOUT=30000

# Debugging
DEBUG_MODE=false
LOG_LEVEL=info
```

### Backend: `/backend/.env.example`
```bash
# Server Configuration
PORT=5000
NODE_ENV=development
HOST=localhost

# Firebase Admin SDK
FIREBASE_PROJECT_ID=your-project
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----...
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...

# Database
DATABASE_URL=mongodb://localhost:27017/housing

# JWT Tokens
JWT_SECRET=your-secret-key
JWT_EXPIRY=7d

# Email Service (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password

# Payment Gateway (if applicable)
STRIPE_API_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Logging
LOG_LEVEL=debug

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Web: `/web/.env.example`
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:5000/api
VITE_API_TIMEOUT=30000

# Firebase Configuration
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project

# App Configuration
VITE_APP_NAME=University Housing System
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=development

# Feature Flags
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_SENTRY=false
```

**Key Points:**
- ✅ `.env.example` files ARE committed to Git
- ❌ `.env` files are NEVER committed
- ✅ New team members copy `.env.example` to `.env` and fill in values

---

## 📋 `.editorconfig`

**Create: `/.editorconfig`**

Enforces consistent code formatting across editors:

```ini
# EditorConfig helps maintain consistent coding styles
# See: https://editorconfig.org

root = true

# All files
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2

# JavaScript/TypeScript
[*.{js,jsx,ts,tsx,mjs,cjs}]
indent_size = 2
max_line_length = 100

# JSON
[*.json]
indent_size = 2

# Markdown
[*.md]
trim_trailing_whitespace = false
max_line_length = off

# YAML
[*.{yml,yaml}]
indent_size = 2

# Shell
[*.{sh,bash}]
indent_size = 2
```

---

## 📋 `LICENSE` File

**Create: `/LICENSE`**

For MIT License (most common for open source):

```
MIT License

Copyright (c) 2024 Yousif Elsayed

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

Or choose your license at: https://choosealicense.com

---

## 📋 Root `package.json` (Workspace Configuration)

**Update: `/package.json`**

If using monorepo structure:

```json
{
  "name": "university-housing-system",
  "version": "1.0.0",
  "description": "Full-stack university housing management system",
  "license": "MIT",
  "author": "Yousif Elsayed",
  "repository": {
    "type": "git",
    "url": "https://github.com/youssifcu/university-housing-system.git"
  },
  "keywords": [
    "housing",
    "university",
    "react-native",
    "expo",
    "firebase",
    "node.js"
  ],
  "private": true,
  "workspaces": [
    "mobile",
    "web",
    "backend"
  ],
  "scripts": {
    "setup": "npm install && cd mobile && npm install && cd ../web && npm install && cd ../backend && npm install",
    "dev": "npm run dev --workspaces",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces",
    "lint": "npm run lint --workspaces",
    "format": "prettier --write .",
    "mobile:dev": "cd mobile && npm start",
    "mobile:test": "cd mobile && npm test",
    "web:dev": "cd web && npm run dev",
    "web:build": "cd web && npm run build",
    "web:test": "cd web && npm test",
    "backend:dev": "cd backend && npm run dev",
    "backend:build": "cd backend && npm run build",
    "backend:test": "cd backend && npm test"
  },
  "devDependencies": {
    "prettier": "^3.0.0"
  }
}
```

---

## 📋 `.github/workflows/` - CI/CD Configuration

Create continuous integration for automated testing.

### **Create: `/.github/workflows/test.yml`**

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x, 20.x]

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint --workspaces

      - name: Run tests
        run: npm test --workspaces

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

### **Create: `/.github/workflows/lint.yml`**

```yaml
name: Lint

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Use Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20.x"

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint --workspaces

      - name: Check Prettier formatting
        run: npm run format:check || true
```

---

## 📋 `.github/PULL_REQUEST_TEMPLATE.md`

**Create: `/.github/pull_request_template.md`**

```markdown
## 📝 Description
<!-- Explain what this PR does -->
Describe your changes here.

## 🎯 Type of Change
- [ ] 🚀 New feature
- [ ] 🐛 Bug fix
- [ ] 📚 Documentation
- [ ] 🎨 UI/UX improvement
- [ ] ♻️ Refactoring
- [ ] 🔒 Security improvement

## 📋 Testing
How to test this change?
- [ ] Added tests
- [ ] Manual testing (describe below)

**How to test:**
1. ...
2. ...

## 🔗 Related Issues
Closes #(issue number) or Links to #(issue number)

## 📸 Screenshots (if applicable)
<!-- Add screenshots for UI changes -->

## ✅ Checklist
- [ ] My code follows the style guidelines
- [ ] I have performed a self-review
- [ ] I have commented complex logic
- [ ] I have updated documentation
- [ ] My changes generate no new warnings
- [ ] I have tested this change locally
- [ ] No breaking changes introduced

## 💡 Additional Notes
<!-- Any additional context -->
```

---

## 📋 `.github/ISSUE_TEMPLATE/bug_report.md`

**Create: `/.github/ISSUE_TEMPLATE/bug_report.md`**

```markdown
---
name: Bug Report
about: Create a bug report
title: "[BUG] "
labels: bug
assignees: ""
---

## 🐛 Describe the Bug
A clear description of what the bug is.

## 📍 Environment
- **Platform:** [Mobile/Web/Backend]
- **OS:** [iOS/Android/Windows/macOS]
- **Version:** [1.0.0]

## 🔄 Steps to Reproduce
1. ...
2. ...
3. ...

## 🎯 Expected Behavior
What should happen?

## 🚨 Actual Behavior
What actually happened?

## 📸 Screenshots/Logs
<!-- Add screenshots or error logs -->

## 💬 Additional Context
Any other context?
```

---

## ✅ Configuration Files Checklist

### Root Level
- [ ] `.gitignore` ✅ CRITICAL
- [ ] `.env.example` (in each project)
- [ ] `.editorconfig`
- [ ] `LICENSE`
- [ ] `package.json` (updated)
- [ ] `.prettierrc` (code formatting)
- [ ] `.eslintrc.json` (code linting)

### GitHub Specific
- [ ] `.github/workflows/test.yml`
- [ ] `.github/workflows/lint.yml`
- [ ] `.github/pull_request_template.md`
- [ ] `.github/ISSUE_TEMPLATE/bug_report.md`
- [ ] `.github/ISSUE_TEMPLATE/feature_request.md`

### Per-Project (.gitignore already exists)
- [ ] `mobile/.gitignore` ✅
- [ ] `mobile/.env.example`
- [ ] `web/.gitignore` ✅
- [ ] `web/.env.example`
- [ ] `backend/.gitignore` ✅
- [ ] `backend/.env.example`

---

## 🚀 Quick Setup

```bash
cd /workspaces/university-housing-system

# Create root .gitignore (if not already there)
cat > .gitignore << 'EOF'
node_modules/
.env
.env.local
.DS_Store
dist/
build/
coverage/
.vscode/
.idea/
*.log
EOF

# Create .editorconfig
cat > .editorconfig << 'EOF'
root = true
[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
indent_style = space
indent_size = 2
EOF

# Create LICENSE (MIT)
# (See template above)

# Create .github/workflows
mkdir -p .github/workflows
# Add test.yml and lint.yml (see templates above)

# Create issue templates
mkdir -p .github/ISSUE_TEMPLATE
# Add bug_report.md and feature_request.md
```

---

## 📚 Related Documentation

- See `README.md` for project overview
- See `GIT_WORKFLOW.md` for branching strategy
- See `CONTRIBUTING.md` for contribution guidelines
