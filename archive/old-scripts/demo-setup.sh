#!/bin/bash

echo "🚀 Creating demo data for admin testing..."
echo ""

API_BASE="http://localhost:3001/api"

# 1. Create test user
echo "1️⃣ Creating test user..."
curl -s -X POST "$API_BASE/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123", 
    "fullName": "Test User"
  }' > /dev/null

echo "✅ Test user created: testuser@example.com"

# 2. Sign in as test user
echo ""
echo "2️⃣ Signing in as test user..."
SIGNIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/signin" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "password123"
  }')

USER_TOKEN=$(echo $SIGNIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$USER_TOKEN" ]; then
  echo "✅ Test user signed in successfully"
else
  echo "❌ Failed to sign in test user"
  exit 1
fi

# 3. Create test auction
echo ""
echo "3️⃣ Creating test auction..."
curl -s -X POST "$API_BASE/auctions" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "title": "Vintage Victorian Tea Set",
    "description": "Beautiful antique tea set from the Victorian era, complete with ornate patterns and gold trim.",
    "category": "Ceramics & Glassware", 
    "starting_bid": 50.00,
    "reserve_price": 150.00,
    "start_time": "'$(date -u -d "+1 hour" +%Y-%m-%dT%H:%M:%S.000Z)'",
    "end_time": "'$(date -u -d "+1 week" +%Y-%m-%dT%H:%M:%S.000Z)'",
    "condition": "Excellent",
    "dimensions": "12x8x6 inches",
    "provenance": "Estate collection"
  }' > /dev/null

echo "✅ Test auction created: Vintage Victorian Tea Set"

echo ""
echo "🎯 Demo Setup Complete!"
echo "═══════════════════════════════════════════════════════"
echo "🔐 Admin Login Credentials:"
echo "   Email: admin@example.com"
echo "   Password: (check existing admin password)"
echo ""
echo "👤 Test User Credentials:"
echo "   Email: testuser@example.com"
echo "   Password: password123"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:8080"
echo "   Backend API: http://localhost:3001"
echo ""
echo "🧪 Testing Instructions:"
echo "1. Go to http://localhost:8080/auth"
echo "2. Sign in as admin@example.com (get password from database)"
echo "3. You should see \"Admin\" button in navbar"
echo "4. Click \"Admin\" to access admin panel"
echo "5. You should see pending auction for approval"
echo "6. Test approving/rejecting auctions"
echo "7. Sign out and sign in as testuser@example.com"
echo "8. Create more auctions to test the workflow"
echo ""

# Get admin password hint
echo "💡 Getting admin password..."
ADMIN_INFO=$(psql -d antique_auction -t -c "SELECT email, substring(password_hash, 1, 20) as pwd_hint FROM users WHERE role = 'admin';" 2>/dev/null)
if [ $? -eq 0 ]; then
  echo "   Admin found in database: $ADMIN_INFO"
  echo "   Try common passwords like: admin, password, admin123, etc."
else
  echo "   Database connection failed - check your PostgreSQL setup"
fi
