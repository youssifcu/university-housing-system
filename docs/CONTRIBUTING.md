# 🤝 CONTRIBUTING GUIDELINES

Thank you for your interest in contributing to the **University Housing System**! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#-code-of-conduct)
- [Getting Started](#-getting-started)
- [How to Contribute](#-how-to-contribute)
- [Reporting Bugs](#-reporting-bugs)
- [Suggesting Enhancements](#-suggesting-enhancements)
- [Pull Requests](#-pull-requests)
- [Coding Standards](#-coding-standards)
- [Commit Messages](#-commit-messages)
- [Testing](#-testing)
- [Documentation](#-documentation)

---

## 💼 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inspiring community for all. Please read and adhere to our [Code of Conduct](./CODE_OF_CONDUCT.md).

### Summary

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive criticism
- Report violations immediately

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+
- **Git** 2.30+
- **Firebase Account**
- **Expo Account** (for mobile)

### Development Setup

See [DEVELOPMENT.md](./DEVELOPMENT.md) for detailed setup instructions.

Quick start:
```bash
# Clone the repository
git clone https://github.com/youssifcu/university-housing-system.git
cd university-housing-system

# Install dependencies
npm run setup

# Create environment variables
cd mobile && cp .env.example .env
cd ../backend && cp .env.example .env
cd ../web && cp .env.example .env
```

---

## 💡 How to Contribute

### Types of Contributions

#### 🐛 Bug Reports
- Report issues and problems
- Include reproduction steps
- See [Reporting Bugs](#-reporting-bugs)

#### ✨ Features
- Suggest new features
- Improve existing features
- See [Suggesting Enhancements](#-suggesting-enhancements)

#### 📚 Documentation
- Improve README and guides
- Add code comments
- Create tutorials
- Fix typos and grammar

#### 🎨 UI/UX Improvements
- Improve design
- Better user experience
- Accessibility improvements

#### 🔧 Code Quality
- Refactor code
- Add tests
- Improve performance
- Fix code smells

#### 🤝 Help Others
- Answer questions in Discussions
- Review pull requests
- Help beginners

---

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing [issues](https://github.com/youssifcu/university-housing-system/issues)
2. Search closed issues - might be fixed
3. Check [Discussions](https://github.com/youssifcu/university-housing-system/discussions)

### How to Report

1. Go to [Issues](https://github.com/youssifcu/university-housing-system/issues)
2. Click "New Issue"
3. Choose "Bug Report"
4. Fill in the template

### Good Bug Report Includes

```markdown
## Description
Brief description of the bug

## Steps to Reproduce
1. Go to...
2. Click on...
3. See error...

## Expected Behavior
What should happen

## Actual Behavior
What actually happened

## Environment
- Platform: Mobile/Web/Backend
- OS: iOS/Android/Windows/macOS
- Browser: Chrome/Safari/Firefox
- Version: 1.0.0

## Screenshots/Logs
Relevant screenshots or error logs

## Additional Context
Any other relevant information
```

### Bug Report Severity Levels

- 🔴 **Critical** - App crashes, data loss, security issue
- 🟠 **High** - Core functionality broken
- 🟡 **Medium** - Feature doesn't work as expected
- 🟢 **Low** - Minor issues, cosmetic problems

---

## 💬 Suggesting Enhancements

### Before Suggesting

Check if feature already:
- Exists in current version
- Is in planned roadmap
- Has similar open issue

### How to Suggest

1. Go to [Issues](https://github.com/youssifcu/university-housing-system/issues)
2. Click "New Issue"
3. Choose "Feature Request"
4. Fill in the template

### Good Feature Request Includes

```markdown
## Feature Description
What feature are you suggesting?

## Problem It Solves
What problem does this solve?

## Proposed Solution
How do you envision this working?

## Alternative Solutions
Any other ways to solve this?

## Additional Context
Screenshots, links, or examples

## User Value
Who benefits? Why is it important?
```

### Feature Request Labels

- `enhancement` - New feature
- `improvement` - Improve existing feature
- `ui/ux` - User interface/experience
- `documentation` - Documentation related
- `performance` - Performance improvement

---

## 🔄 Pull Requests

### Before Starting

1. Fork the repository
2. Create feature branch: `feature/your-feature-name`
3. See [GIT_WORKFLOW.md](./GIT_WORKFLOW.md) for Git workflow

### Creating a Pull Request

#### Step 1: Create Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/amazing-feature
```

#### Step 2: Make Changes

```bash
# Make your changes
git add .
git commit -m "feat: add amazing feature"
git push origin feature/amazing-feature
```

#### Step 3: Create PR

1. Go to GitHub
2. Compare & Pull Request
3. Set base branch to `develop`
4. Fill in PR template
5. Request review

### Pull Request Template

```markdown
## 📝 Description
What does this PR do?

## 🎯 Type
- [ ] New feature
- [ ] Bug fix
- [ ] Documentation
- [ ] UI/UX improvement
- [ ] Refactoring
- [ ] Performance improvement

## 🔗 Related Issues
Closes #123

## 📸 Screenshots (if applicable)
[Add UI changes screenshots]

## ✅ Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No new warnings generated
- [ ] Changes are backward compatible
- [ ] Tested locally

## 🧪 Testing
How to test this change?
1. ...
2. ...

## 📊 Performance Impact
Any performance implications?
```

### PR Review Process

1. **Automated Checks**
   - Linting passes
   - Tests pass
   - No conflicts with `develop`

2. **Code Review**
   - Code quality
   - Architecture
   - Style compliance
   - Documentation

3. **Approval**
   - At least 1 approval needed
   - All feedback addressed
   - Ready to merge

4. **Merge**
   - Squash commits (cleaner history)
   - Delete feature branch
   - Close related issues

### PR Guidelines

#### Size
- ✅ Small PRs (< 400 lines) are preferred
- ❌ Avoid huge PRs (> 1000 lines)
- Split large features into multiple PRs

#### Scope
- ✅ One feature per PR
- ❌ Don't mix refactoring with features
- ❌ Don't fix unrelated bugs

#### Description
- ✅ Clear, descriptive PR title
- ✅ Explain why, not just what
- ✅ Link related issues
- ❌ Don't use vague titles like "Fix stuff"

---

## 📐 Coding Standards

### Code Style

We follow:
- **JavaScript/TypeScript:** ESLint config
- **Formatting:** Prettier
- **Git Commits:** Conventional Commits

### Language-Specific Standards

#### TypeScript/JavaScript
```typescript
// ✅ Good
const getUserName = (userId: string): string => {
  return getUserById(userId).name;
};

// ❌ Bad
function get(i) {
  return getU(i).n;
}
```

#### React Components
```typescript
// ✅ Good - Functional component with hooks
const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    fetchUser(userId).then(setUser);
  }, [userId]);

  return <div>{user?.name}</div>;
};

// ❌ Bad - Class components, unclear logic
class UserProfile extends React.Component { ... }
```

#### React Native
```typescript
// ✅ Good - Proper styling and component structure
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  text: { fontSize: 16, color: '#333' },
});

export const Button = () => (
  <TouchableOpacity style={styles.container}>
    <Text style={styles.text}>Press Me</Text>
  </TouchableOpacity>
);
```

### Naming Conventions

| Type | Style | Example |
|------|-------|---------|
| Variables | camelCase | `userName`, `userEmail` |
| Functions | camelCase | `getUserData()`, `fetchHousing()` |
| Classes | PascalCase | `UserService`, `BookingController` |
| Constants | UPPER_SNAKE_CASE | `API_BASE_URL`, `MAX_RETRIES` |
| React Components | PascalCase | `UserCard`, `BookingForm` |
| Files | kebab-case | `user-card.tsx`, `get-user.ts` |

### File Structure

```
mobile/
  components/
    ├── ui/                           # Reusable UI components
    │   ├── Button.tsx
    │   ├── Input.tsx
    │   └── Card.tsx
    └── features/                     # Feature-specific components
        ├── HousingCard.tsx
        └── BookingForm.tsx
  services/
    ├── firebaseService.ts            # Firebase operations
    ├── authService.ts                # Authentication logic
    └── apiClient.ts                  # HTTP requests
  hooks/
    ├── useAuth.ts                    # Authentication hook
    └── useFetch.ts                   # Data fetching hook
```

### Comment Guidelines

```typescript
// ✅ Good - Explains WHY, not WHAT
// We cache housing data for 5 minutes to reduce API calls
const CACHE_DURATION = 5 * 60 * 1000;

// ❌ Bad - Explains WHAT (code already shows this)
// Set cache duration to 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

// ✅ Good - Complex logic needs comments
// Sort by distance, then by price
housing.sort((a, b) => {
  const distDiff = a.distance - b.distance;
  return distDiff !== 0 ? distDiff : a.price - b.price;
});
```

---

## 📝 Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/).

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `perf:` - Performance improvement
- `test:` - Tests
- `chore:` - Setup, dependencies

### Scope

- `mobile`
- `web`
- `backend`
- `auth`
- `booking`
- `housing`

### Examples

```bash
# Good commits
git commit -m "feat(mobile): add image picker to profile"
git commit -m "fix(backend): resolve JWT token expiration"
git commit -m "docs: update API documentation"
git commit -m "refactor(web): extract BookingForm component"
git commit -m "test: add integration tests for authentication"

# Bad commits
git commit -m "fix stuff"
git commit -m "WIP"
git commit -m "update"
```

---

## 🧪 Testing

### Adding Tests

All new features should include tests:

```javascript
// ✅ Good - Test file next to implementation
src/
  ├── services/
  │   ├── getUserById.ts
  │   └── getUserById.test.ts
```

### Running Tests

```bash
# Run all tests
npm test --workspaces

# Run tests for specific workspace
cd mobile && npm test

# Run with coverage
npm test -- --coverage
```

### Test Structure

```typescript
describe('getUserById', () => {
  it('should return user when found', async () => {
    const user = await getUserById('123');
    expect(user).toBeDefined();
    expect(user.id).toBe('123');
  });

  it('should throw error when user not found', async () => {
    await expect(getUserById('invalid')).rejects.toThrow();
  });
});
```

### Coverage Requirements

- Minimum 70% code coverage
- 100% for critical features
- Use `npm test -- --coverage` to check

---

## 📚 Documentation

### Update Documentation When

- ✅ Adding new feature
- ✅ Changing API endpoint
- ✅ Modifying configuration
- ✅ Updating setup process
- ✅ Adding new environment variable

### Documentation Files

- **README.md** - Main overview
- **docs/API.md** - API endpoints
- **docs/DEVELOPMENT.md** - Setup guide
- **CONTRIBUTING.md** - This file
- **Code comments** - Complex logic

### Documentation Style

```markdown
# Feature Name

## Overview
Brief description

## Usage
```javascript
// Example code
```

## Parameters
| Name | Type | Description |
|------|------|-------------|

## Returns
Description of return value

## Example
Real-world usage example
```

---

## 🆘 Getting Help

### Questions

1. Check [Discussions](https://github.com/youssifcu/university-housing-system/discussions)
2. Search existing Q&A
3. Create new discussion

### Support Channels

- **GitHub Issues** - Bug reports and features
- **GitHub Discussions** - Questions and ideas
- **Documentation** - Guides and tutorials
- **Email** - contact@example.com (for sensitive issues)

---

## ✅ Contribution Checklist

Before submitting PR:

- [ ] Forked repository
- [ ] Created feature branch from `develop`
- [ ] Made meaningful changes
- [ ] Ran linter: `npm run lint`
- [ ] Ran tests: `npm test`
- [ ] Updated documentation
- [ ] Followed commit message convention
- [ ] Pushed to your fork
- [ ] Created PR with filled template
- [ ] Linked related issue
- [ ] Responded to review feedback

---

## 🎉 Recognition

Contributors will be:
- ✅ Added to README
- ✅ Listed in CONTRIBUTORS.md
- ✅ Recognized in release notes
- ✅ Featured on GitHub profile

---

## 📜 License

By contributing, you agree that your contributions will be licensed under its MIT License.

---

## 🙏 Thank You!

We appreciate all contributions, from bug reports to feature implementations. Thank you for helping make this project better!

**Happy coding! 🚀**
