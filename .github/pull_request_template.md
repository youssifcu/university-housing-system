## 🎯 Description

Please include a summary of what this PR accomplishes. What problem does it solve?

<!-- Example: 
This PR implements user authentication using Firebase and adds login/register screens to the mobile app. Fixes #123.
-->

---

## 🔗 Linked Issues

- Fixes #(issue number)
- Related to #(issue number)

<!-- Use "Fixes" to auto-close issues when PR is merged -->

---

## 📝 Type of Change

Please select the relevant option(s):

- [ ] 🐛 Bug fix (non-breaking change that fixes an issue)
- [ ] ✨ New feature (non-breaking change that adds functionality)
- [ ] 💔 Breaking change (fix or feature that causes existing functionality to change)
- [ ] 📚 Documentation update
- [ ] 🔧 Configuration/Build change
- [ ] ♻️ Refactoring (code improvement without changing behavior)
- [ ] ⚡ Performance improvement
- [ ] 🔒 Security fix

---

## 🧪 Testing

Describe how you tested these changes:

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

**Test Cases:**
1. 
2. 
3. 

**Environment Tested:**
- [ ] Mobile (iOS)
- [ ] Mobile (Android)
- [ ] Web (Chrome)
- [ ] Web (Firefox)

---

## ✅ Checklist

Please verify you've completed the following:

- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests passed locally with my changes
- [ ] Any dependent changes have been merged and published
- [ ] I have followed the [Code of Conduct](../CODE_OF_CONDUCT.md)
- [ ] I have followed the [contribution guidelines](../CONTRIBUTING.md)

---

## 📸 Screenshots or Demo

If applicable, add screenshots, GIFs, or video demonstrating the changes:

<!-- 
Markdown syntax:
![image description](image_url)

For GIFs: ![gif description](gif_url)
-->

---

## 🔍 Potential Issues or Concerns

Are there any edge cases, dependencies, or breaking changes I should know about?

<!-- Example:
- This change requires users to re-authenticate
- Database migration scripts need to be run
- API endpoint behavior change
-->

---

## 📦 Files Changed

<!-- This will be auto-generated, but you can highlight key files -->

- `backend/src/controllers/authController.js` - Authentication logic
- `mobile/app/(auth)/login.tsx` - UI component
- `DEVELOPERS.md` - Documentation update

---

## 🚀 Deployment Notes

Any special considerations for deployment?

- [ ] Database migration required
- [ ] Backend service restart required
- [ ] Environment variables need updating
- [ ] Feature flag needs enabling

**Migration Instructions:**
```bash
# Example migration steps
npm run migrate
```

---

## 📋 Reviewer Notes

Any specific areas you'd like reviewers to focus on?

<!-- Example:
- Please pay special attention to the authentication flow
- This implementation differs from the original proposal - it's more performant
- I'm not 100% sure about the error handling, please review
-->

---

## 🎓 Related Documentation

- [Contribution Guidelines](../CONTRIBUTING.md)
- [Development Guide](../DEVELOPMENT.md)
- [Code of Conduct](../CODE_OF_CONDUCT.md)

---

**Thank you for contributing! 🙏**

---

### 🔖 PR Title Format

Please ensure your PR title follows this format:

```
[TYPE]: Brief description

Examples:
- feat: add user authentication
- fix: resolve mobile login redirect bug
- docs: update README with setup instructions
- refactor: improve database query performance
```

Where TYPE is one of:
- `feat` - New feature
- `fix` - Bug fix  
- `docs` - Documentation changes
- `style` - Code style changes (formatting, semicolons, etc.)
- `refactor` - Code refactoring without feature changes
- `perf` - Performance improvements
- `test` - Adding or updating tests
- `chore` - Build, CI, or dependencies
