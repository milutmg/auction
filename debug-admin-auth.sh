#!/bin/bash

echo "=== Admin Authentication Debug Test ==="

# First, let's try to login as admin
echo ""
echo "1. Attempting admin login..."

LOGIN_RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"admin123"}' \
  http://localhost:3001/api/auth/signin)

echo "Login response: $LOGIN_RESPONSE"

# Extract token if login was successful
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "❌ Admin login failed - no token received"
    echo "Trying to create admin user..."
    
    # Try to create admin user
    CREATE_RESPONSE=$(curl -s -X POST \
      -H "Content-Type: application/json" \
      -d '{"email":"admin@test.com","password":"admin123","fullName":"Admin User","role":"admin"}' \
      http://localhost:3001/api/auth/signup)
    
    echo "Admin creation response: $CREATE_RESPONSE"
    exit 1
else
    echo "✅ Admin login successful, token received"
    echo "Token: $TOKEN"
fi

echo ""
echo "2. Testing admin debug endpoint..."
DEBUG_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/debug-auth)

echo "Debug response: $DEBUG_RESPONSE"

echo ""
echo "3. Testing admin stats endpoint..."
STATS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/admin/stats)

echo "Stats response: $STATS_RESPONSE"

echo ""
echo "=== Test Complete ==="
