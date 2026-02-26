# 🌳 GIT WORKFLOW & BRANCHING GUIDE

## Recommended Git Workflow: Git Flow

For solo development, use a simplified **Git Flow** strategy:

```
main (production)
  ↑
  └─── develop (integration/staging)
         ↑
         └─── feature/* (feature development)
         └─── bugfix/* (bug fixes)
         └─── hotfix/* (urgent production fixes)
```

---

## 📌 Branch Strategy

### **1. Main Branch (`main`)**
- **Purpose**: Production-ready code
- **Protection**: 
  - Require pull request reviews
  - Require status checks to pass
  - Require up-to-date PR
- **Tags**: Semantic versioning (v1.0.0, v1.0.1, etc.)

**When to use:**
```bash
# Only merge via PR from develop after testing
# Tag releases
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### **2. Develop Branch (`develop`)**
- **Purpose**: Integration/staging branch
- **Protection**: Require PR reviews
- **Use for**: Testing before production

**Create it:**
```bash
git checkout -b develop origin/main
git push origin develop
```

### **3. Feature Branches (`feature/*`)**
- **Naming**: `feature/user-authentication`, `feature/booking-system`
- **Purpose**: Develop new features
- **Lifetime**: Until feature is done (1-4 weeks)
- **From**: `develop`
- **Back to**: `develop` (via PR)

**Example workflow:**
```bash
# Start feature
git checkout develop
git pull origin develop
git checkout -b feature/housing-search

# Work on feature
git add .
git commit -m "feat: add housing search filter"
git push origin feature/housing-search

# Create PR on GitHub and request review
# After approval and merge, delete branch
```

### **4. Bugfix Branches (`bugfix/*`)**
- **Naming**: `bugfix/login-error`, `bugfix/payment-calculation`
- **Purpose**: Fix bugs found during development
- **From**: `develop`
- **Back to**: `develop`

### **5. Hotfix Branches (`hotfix/*`)**
- **Naming**: `hotfix/security-patch`, `hotfix/critical-crash`
- **Purpose**: Urgent fixes for production issues
- **From**: `main`
- **Back to**: Both `main` AND `develop`

**Example hotfix workflow:**
```bash
# Fix critical production issue
git checkout main
git pull origin main
git checkout -b hotfix/payment-bug

# Make fix and commit
git add .
git commit -m "fix: payment processing error"

# Merge back to both main and develop
git push origin hotfix/payment-bug
# Create 2 PRs: one to main, one to develop
```

---

## 📝 Commit Message Convention

Use **Conventional Commits** for clear history:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### **Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting, missing semicolons, etc.
- `refactor:` - Code refactoring without feature change
- `perf:` - Performance improvements
- `test:` - Adding or updating tests
- `chore:` - Build process, dependencies, etc.

### **Examples:**
```bash
# Good commit messages
git commit -m "feat(mobile): add image picker to profile screen"
git commit -m "fix(backend): resolve authentication token expiration"
git commit -m "docs: update API documentation for booking endpoint"
git commit -m "refactor(web): extract BookingForm to separate component"
git commit -m "test: add integration tests for payment flow"

# Bad commit messages (avoid!)
git commit -m "fix stuff"
git commit -m "updates"
git commit -m "WIP"
```

---

## 🔄 Solo Development Workflow (Step-by-Step)

### **Step 1: Set Up Branches Locally**

```bash
cd university-housing-system

# Clone with all branches
git fetch origin

# Create and track develop branch
git checkout -b develop origin/develop

# Verify branches
git branch -a
# Output:
# * develop
#   main
#   origin/develop
#   origin/main
```

### **Step 2: Start New Feature**

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-feature-name

# Verify you're on the right branch
git status
```

### **Step 3: Develop & Commit**

```bash
# Make changes, then stage them
git add mobile/app/screens/NewFeature.tsx

# Commit with clear message
git commit -m "feat(mobile): add new feature screen"

# Multiple commits are fine!
git add backend/routes/api.js
git commit -m "feat(backend): add new endpoint"

# Keep commits logical and atomic
```

### **Step 4: Push to GitHub**

```bash
# Push your feature branch
git push origin feature/new-feature-name

# GitHub should suggest creating a Pull Request
```

### **Step 5: Create Pull Request**

On GitHub.com:

1. Navigate to your repo
2. Click "Compare & pull request"
3. Fill in the PR template:
   ```markdown
   ## Description
   What does this PR do?

   ## Type of Change
   - [ ] New feature
   - [ ] Bug fix
   - [ ] Documentation update

   ## Testing
   How to test this change?

   ## Screenshots (if UI change)
   [Add screenshots]

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Comments added for complex logic
   - [ ] Tests added/updated
   - [ ] Documentation updated
   ```

4. Set base branch to `develop` (not `main`)
5. Submit PR

### **Step 6: Review & Merge**

For solo development, you can:

**Option A: Self-review**
```bash
# Review your own PR
# Make sure all tests pass
# Merge to develop
```

**Option B: Automated merge**
```bash
# On GitHub, click "Merge pull request"
# Choose "Squash and merge" (for cleaner history)
# Or "Create merge commit" (to keep all commits)
```

### **Step 7: Delete Feature Branch**

```bash
# Locally
git checkout develop
git branch -d feature/new-feature-name

# On GitHub
# Automatically suggested after merge
# Or manually delete in branch settings
```

### **Step 8: Pull Latest Changes**

```bash
# Always sync before starting new feature
git checkout develop
git pull origin develop
```

---

## 📊 Example: Complete Feature Flow

### Scenario: Add password reset feature

```bash
# 1. Start feature
git checkout develop
git pull origin develop
git checkout -b feature/password-reset

# 2. Work on mobile
cd mobile
# ... edit files ...
git add app/screens/ForgotPassword.tsx
git commit -m "feat(mobile): add forgot password screen"

# 3. Work on backend
cd ../backend
# ... edit files ...
git add src/routes/auth.js
git commit -m "feat(backend): add password reset endpoint"

# 4. Work on web
cd ../web
# ... edit files ...
git add src/pages/ForgotPasswordPage.tsx
git commit -m "feat(web): add forgot password page"

# 5. Push all changes
git push origin feature/password-reset

# 6. Create PR on GitHub
# - Title: "feat: implement password reset flow"
# - Base: develop
# - Link to issue if any

# 7. After review/testing
# - Merge PR to develop

# 8. Clean up
git checkout develop
git pull origin develop
git branch -d feature/password-reset
```

---

## 🔓 Production Release Flow

When ready to release to production:

```bash
# 1. All features merged to develop
git checkout develop
git pull origin develop

# 2. Create release branch
git checkout -b release/v1.0.0

# 3. Version bump (if using package.json)
# Update version in mobile/package.json, backend/package.json, web/package.json
git add .
git commit -m "chore: bump version to 1.0.0"

# 4. Merge to main
git push origin release/v1.0.0
# Create PR to main on GitHub

# 5. After merge to main, tag the release
git checkout main
git pull origin main
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 6. Merge back to develop
git checkout develop
git merge main
git push origin develop

# 7. Delete release branch
git branch -d release/v1.0.0
git push origin --delete release/v1.0.0
```

---

## 🛡️ GitHub Branch Protection Rules

Set up automatic protections:

### For `main` branch:

1. Go to Settings → Branches → Add rule
2. Apply to: `main`
3. Require checks:
   - ✅ Require a pull request before merging
   - ✅ Require approvals (1 for solo, 2+ for teams)
   - ✅ Require status checks to pass (CI/CD tests)
   - ✅ Require branches to be up to date before merging
   - ✅ Restrict who can push to matching branches

### For `develop` branch:

Slightly relaxed:
- ✅ Require a pull request before merging
- ✅ Require status checks to pass
- ❌ Approvals (optional for solo)
- ✅ Restrict history rewriting

---

## 🧹 Cleanup Old Branches

```bash
# List branches
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Force delete if needed
git branch -D feature/old-feature

# Clean up deleted remote branches
git fetch origin --prune
```

---

## 📈 Recommended Tools

### **Command Line**
```bash
# View branch structure
git log --oneline --graph --all

# See detailed branch info
git show-branch

# Interactive rebase (clean history)
git rebase -i develop
```

### **VS Code Git Extensions**
- **GitLens** - Git history visualization
- **GitHub Pull Requests and Issues** - Manage PRs from editor

### **GitHub Features**
- Use GitHub Issues for tracking work
- Link PRs to issues: "closes #123"
- Use GitHub Projects for kanban board

---

## ✅ Checklist: Setting Up Branches

- [ ] Create `develop` branch from `main`
- [ ] Push `develop` to GitHub
- [ ] Set up branch protection on `main`
- [ ] Set up branch protection on `develop`
- [ ] Create first feature branch
- [ ] Make a test commit with conventional message
- [ ] Create test PR
- [ ] Test the merge workflow
- [ ] Delete test branch
- [ ] Document branch strategy in team wiki/docs

---

## 📚 Related Files

- See `CONTRIBUTING.md` for contribution guidelines
- See `DEVELOPMENT.md` for local development setup
- See `CHANGELOG.md` for version history

**For more on Git workflows, see:** https://nvie.com/posts/a-successful-git-branching-model/
