# University Housing System - Backend API

The backend API services for the University Housing System, providing core business logic and data management.

## Overview

The backend API provides:
- RESTful/GraphQL endpoints for all frontend applications
- User authentication and authorization
- Housing management operations
- Room allocation algorithms
- Payment processing integration
- Admin operations and reporting

## Tech Stack

- **Runtime:** Node.js v[version] / Python 3.9+ / Java 11+
- **Framework:** Express.js / FastAPI / Spring Boot
- **Database:** PostgreSQL / MongoDB
- **Authentication:** JWT / OAuth2
- **API Documentation:** Swagger/OpenAPI
- **Testing:** Jest/Pytest/JUnit

## Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   ├── utils/           # Utility functions
│   ├── validators/      # Input validation
│   ├── config/          # Configuration
│   └── index.js         # Entry point
├── tests/               # Test files
├── database/
│   ├── migrations/      # DB migrations
│   └── seeds/           # Seed data
├── docs/                # API documentation
├── .env.example         # Environment template
└── README.md           # This file
```

## Prerequisites

- Node.js 16+ / Python 3.9+ / Java 11+
- npm/yarn / pip / Maven
- PostgreSQL/MongoDB running
- Redis (optional, for caching/sessions)
- Git

## Installation

1. **Checkout the backend branch:**
   ```bash
   git checkout backend
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   # or
   pip install -r requirements.txt
   # or
   mvn install
   ```

3. **Setup database:**
   ```bash
   # Create database
   createdb university_housing

   # Run migrations
   npm run migrate
   ```

4. **Create environment file:**
   ```bash
   cp .env.example .env.local
   ```

5. **Configure environment variables:**
   ```env
   NODE_ENV=development
   PORT=3001
   DATABASE_URL=postgresql://user:password@localhost:5432/university_housing
   JWT_SECRET=your_jwt_secret_key
   API_KEY=your_api_key
   REDIS_URL=redis://localhost:6379
   ```

## Development

### Start Development Server

```bash
npm run dev
```

Server runs on `http://localhost:3001`

### Available Scripts

```bash
# Start development server
npm run dev

# Start with auto-reload
npm run watch

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Run tests with coverage
npm test:coverage

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix

# Database migrations
npm run migrate
npm run migrate:rollback

# Seed database
npm run seed

# Generate API docs
npm run docs
```

## API Endpoints

### Authentication
```
POST   /api/auth/register       - User registration
POST   /api/auth/login          - User login
POST   /api/auth/logout         - User logout
POST   /api/auth/refresh        - Refresh token
GET    /api/auth/profile        - Get current user
```

### Housing
```
GET    /api/housing             - List all housing
GET    /api/housing/:id         - Get housing details
POST   /api/housing             - Create housing (admin)
PUT    /api/housing/:id         - Update housing (admin)
DELETE /api/housing/:id         - Delete housing (admin)
```

### Room Requests
```
GET    /api/requests            - Get user requests
POST   /api/requests            - Submit room request
PUT    /api/requests/:id        - Update request
DELETE /api/requests/:id        - Cancel request
GET    /api/requests/:id        - Request details
```

### Allocation
```
POST   /api/allocation/process  - Run allocation algorithm
GET    /api/allocation/results  - View allocation results
POST   /api/allocation/confirm  - User confirms allocation
```

### Admin
```
GET    /api/admin/users         - List users
GET    /api/admin/stats         - System statistics
POST   /api/admin/reports       - Generate reports
```

See [API Documentation](./docs/API.md) for complete details.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  firstName VARCHAR,
  lastName VARCHAR,
  role VARCHAR DEFAULT 'student',
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Housing Table
```sql
CREATE TABLE housing (
  id UUID PRIMARY KEY,
  name VARCHAR NOT NULL,
  address VARCHAR,
  capacity INT,
  available_rooms INT,
  type VARCHAR,
  created_at TIMESTAMP
);
```

### Room Requests Table
```sql
CREATE TABLE room_requests (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  housing_id UUID REFERENCES housing(id),
  preferences JSONB,
  status VARCHAR,
  created_at TIMESTAMP
);
```

## Testing

### Run Tests
```bash
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

### Write Tests
```javascript
// Example test
describe('Housing Service', () => {
  it('should retrieve all housing', async () => {
    const housing = await HousingService.getAll();
    expect(housing).toBeDefined();
    expect(Array.isArray(housing)).toBe(true);
  });
});
```

## Authentication & Security

### JWT Authentication
1. User logs in with email/password
2. Server returns JWT token
3. Client includes token in Authorization header
4. Server validates token on each request

### Security Best Practices
- ✅ Hash passwords with bcrypt
- ✅ Use HTTPS in production
- ✅ Validate all inputs
- ✅ Implement rate limiting
- ✅ Use environment variables for secrets
- ✅ CORS configuration for frontend

## Error Handling

All API responses follow a standard format:

```javascript
// Success
{
  success: true,
  data: { ... },
  message: "Operation successful"
}

// Error
{
  success: false,
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid input",
    details: [ ... ]
  }
}
```

## Deployment

### Build for Production
```bash
npm run build
```

### Environment for Production
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://prod_user:secure_password@prod-db:5432/university_housing
JWT_SECRET=secure_random_secret
API_KEY=prod_api_key
```

### Deploy to Cloud
- Heroku: `git push heroku main`
- AWS: Use AWS CodeDeploy
- DigitalOcean: Docker container deployment
- Other platforms: Follow standard Node.js deployment

## Monitoring & Logging

### Logging
```javascript
logger.info('User login:', { userId: user.id });
logger.warn('Low memory:', { available: memory });
logger.error('Database error:', error);
```

### Health Check
```
GET /health - Returns server status
GET /health/db - Returns database status
```

## Performance Optimization

### Database Queries
- Use indexes on frequently queried columns
- Implement query pagination
- Cache frequently accessed data
- Use database connection pooling

### API Optimization
- Response compression (gzip)
- Request validation early
- Use async/await patterns
- Implement caching (Redis)

## Dependencies

Key dependencies:
- Express: Web framework
- Mongoose/Sequelize: ORM
- JWT: Authentication
- Bcrypt: Password hashing
- Joi/Yup: Schema validation
- Swagger: API documentation
- Jest: Testing framework

## Contributing

1. Create feature branch: `git checkout -b feature/api-endpoint`
2. Write tests for new code
3. Ensure tests pass: `npm test`
4. Lint code: `npm run lint:fix`
5. Document API changes
6. Submit Pull Request

## Troubleshooting

### Database Connection Failed
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database credentials
- Check network connectivity

### Tests Failing
- Clear test cache: `npm test -- --clearCache`
- Check test environment setup
- Verify test database exists
- Check error logs

### Performance Issues
- Run profiler: `node --inspect`
- Check slow queries: `EXPLAIN ANALYZE`
- Monitor memory usage
- Review database indexes

## API Documentation

Generate Swagger docs:
```bash
npm run docs
```

View at: `http://localhost:3001/api-docs`

## Support & Contact

- 📧 Backend Team: backend-team@example.com
- 📚 API Docs: [Swagger UI](http://localhost:3001/api-docs)
- 🐛 Issues: [GitHub Issues](https://github.com/youssifcu/university-housing-system/issues)

---

**Last Updated:** February 27, 2026
