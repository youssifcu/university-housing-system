# 🚀 Quick Start - API Testing with Swagger

## Getting Started (5 minutes)

### Step 1: Start Your Server
```bash
npm start
# or
node server.js
```

You should see:
```
✅ Server is running on port 5000
✅ MongoDB connected
```

### Step 2: Open Swagger UI in Your Browser

**Choose one:**
- 🌟 **Full Documentation**: [http://localhost:5000/api-docs-complete](http://localhost:5000/api-docs-complete)
- **Standard View**: [http://localhost:5000/api-docs](http://localhost:5000/api-docs)

### Step 3: Test Your First Endpoint

1. **Scroll to "Auth" section**
2. **Click on "POST /api/auth/register"**
3. **Click "Try it out"**
4. **Fill in the example:**
   ```json
   {
     "email": "test@university.edu",
     "password": "Test123!@",
     "name": "Test User",
     "gender": "male"
   }
   ```
5. **Click "Execute"**
6. **Copy the token from the response** ⬅️ Important!

### Step 4: Authorize to Test Protected Endpoints

1. **Click the 🔓 "Authorize" button** (top-right of Swagger)
2. **Paste:** `Bearer YOUR_TOKEN_HERE` 
3. **Click "Authorize"**
4. **Close the dialog**

### Step 5: Now Test Other Endpoints

All subsequent requests will automatically include your token!

Try these:
- `GET /api/auth/profile` - Get your profile
- `POST /api/applications` - Submit housing application
- `GET /api/buildings` - View buildings
- `POST /api/meals/book` - Book a meal

---

## 📊 What Each Section Does

| Section | What It Tests |
|---------|--------------|
| **Auth** | Registration, Login, Profile Management |
| **Applications** | Housing Application Submission & Review |
| **Users** | User Management (Admin) |
| **Buildings** | Building Data Management |
| **Rooms** | Room Assignment & Availability |
| **Housing Requests** | Transfer, Leave, Vacate Requests |
| **Meals** | Meal Menu & Booking |
| **Attendance** | Check-in/Out via QR |
| **Reports** | Complaints & Maintenance |
| **Payments** | Payment Management |
| **Stats** | Dashboard & Analytics |
| **Announcements** | News & Notifications |
| **QR Codes** | QR Code Generation |

---

## 🎯 Common Testing Scenarios

### Scenario 1: New Student Registration & Housing Application
```
1. POST /api/auth/register (create account)
   ↓
2. POST /api/applications (submit app)
   ↓
3. GET /api/applications/my (check status)
   ↓
4. Wait for admin approval...
   ↓
5. GET /api/rooms/available (see assigned room)
```

### Scenario 2: Book a Meal
```
1. GET /api/meals (find available meals)
   ↓
2. POST /api/meals/book (book a meal)
   ↓
3. GET /api/meals (confirm booking status)
```

### Scenario 3: Request Room Transfer
```
1. GET /api/rooms/available (find target room)
   ↓
2. POST /api/housing-requests (request transfer)
   ↓
3. GET /api/housing-requests/{id} (check status)
```

---

## 🔑 Test Accounts (Examples)

### Student Account
```json
{
  "email": "student@university.edu",
  "password": "Student123!",
  "role": "student"
}
```

### Admin Account (created by admin)
```json
{
  "email": "admin@university.edu",
  "password": "Admin123!",
  "role": "admin"
}
```

---

## 📋 File Locations

| What | Where |
|------|-------|
| Swagger JSON | `/swagger-complete.json` |
| This Guide | `/SWAGGER_TESTING_GUIDE.md` |
| Code | `/src/controllers/` |
| Routes | `/src/routes/` |
| Models | `/src/models/` |

---

## ✅ Verification Checklist

- [ ] Server is running on port 5000
- [ ] Swagger UI loads at http://localhost:5000/api-docs-complete
- [ ] Can register a new user
- [ ] Can get profile with token
- [ ] Can see protected endpoints once authorized
- [ ] Database is connected

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Swagger won't load** | Check server is running on port 5000 |
| **401 Unauthorized** | Click Authorize button and paste your token |
| **Database errors** | Check MongoDB connection string in .env |
| **CORS errors** | Check CORS settings in app.js |
| **Token expired** | Register again to get a new token |

---

## 📞 API Response Examples

### Success (200)
```json
{
  "success": true,
  "message": "Profile retrieved",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Ahmed Mohamed",
    "email": "ahmed@university.edu",
    "role": "student"
  }
}
```

### Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Email is already registered"
}
```

---

## 🎓 Learning Path

1. **Day 1**: Test Auth endpoints (register, login, profile)
2. **Day 2**: Test Application endpoints (submit, review)
3. **Day 3**: Test Room & Building endpoints
4. **Day 4**: Test Housing Request endpoints
5. **Day 5**: Test Meal, Attendance, Payment endpoints
6. **Day 6**: Test Stats & Reporting endpoints

---

## 💡 Pro Tips

✅ **Use Try-It-Out Feature**: Always use the "Try it out" button in Swagger - it's interactive!

✅ **Check Response Format**: Every response shows the exact format returned

✅ **Copy cURL**: Swagger shows you the cURL command for each request

✅ **Read Error Messages**: They tell you exactly what's wrong

✅ **Test Pagination**: Use page=1, limit=20 parameters

---

## 🔗 Next Steps

1. **Read** [`SWAGGER_TESTING_GUIDE.md`](./SWAGGER_TESTING_GUIDE.md) for detailed endpoint documentation
2. **Explore** http://localhost:5000/api-docs-complete
3. **Try** different endpoints and see how they interact
4. **Build** your frontend using these endpoints!

---

Happy Testing! 🎉

Need help? Check the endpoint documentation in Swagger UI - each endpoint has examples!
