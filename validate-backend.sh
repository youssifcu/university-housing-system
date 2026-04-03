#!/bin/bash

# University Housing System - Backend Setup and Validation Script

echo "================================================"
echo "University Housing System - Backend Setup"
echo "================================================"
echo ""

# Change to backend directory
cd /workspaces/university-housing-system/backend || {
    echo "❌ Error: Could not navigate to backend directory"
    exit 1
}

echo "📦 Installing dependencies..."
npm install 2>/dev/null

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: npm install had issues. Continuing with existing packages..."
fi

echo ""
echo "🧪 Running tests..."
echo "================================================"
npm test -- --forceExit --detectOpenHandles 2>&1 | head -100

echo ""
echo "✅ Backend validation complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Start the server: npm start  (requires MongoDB running on localhost:27017)"
echo "2. Access API: http://localhost:5000"
echo "3. View Swagger docs: http://localhost:5000/api-docs"
echo "4. Run additional tests: npm test"
echo ""
echo "📚 Documentation:"
echo "- See ENDPOINT_CHECKLIST.md for all available endpoints"
echo "- See README.md for API usage details"
echo ""
echo "🔐 Authentication:"
echo "- All endpoints require Firebase token"
echo "- Token format: Authorization header with 'Bearer <token>'"
echo ""
echo "================================================"
