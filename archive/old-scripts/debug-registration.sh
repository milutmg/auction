#!/bin/bash

echo "🔍 COMPREHENSIVE REGISTRATION DEBUG"
echo "=================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
echo -e "${BLUE}[1] Checking Backend Status...${NC}"
if curl -s http://localhost:3001 >/dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is NOT running${NC}"
    exit 1
fi

# Check which port frontend is on
echo -e "${BLUE}[2] Checking Frontend Ports...${NC}"
FRONTEND_PORT=""
for port in 8080 8081 8082 8083; do
    if ss -tlnp | grep -q ":$port "; then
        echo -e "${GREEN}✅ Frontend running on port $port${NC}"
        FRONTEND_PORT=$port
        break
    fi
done

if [ -z "$FRONTEND_PORT" ]; then
    echo -e "${RED}❌ No frontend server found${NC}"
    exit 1
fi

# Test CORS
echo -e "${BLUE}[3] Testing CORS Configuration...${NC}"
CORS_RESPONSE=$(curl -X OPTIONS http://localhost:3001/api/auth/signup \
    -H "Origin: http://localhost:$FRONTEND_PORT" \
    -H "Access-Control-Request-Method: POST" \
    -H "Access-Control-Request-Headers: Content-Type" \
    -s -i | grep "Access-Control-Allow-Origin")

if [[ "$CORS_RESPONSE" == *"localhost"* ]]; then
    echo -e "${GREEN}✅ CORS is configured correctly${NC}"
    echo "   $CORS_RESPONSE"
else
    echo -e "${RED}❌ CORS issue detected${NC}"
    echo "   Response: $CORS_RESPONSE"
fi

# Test API directly
echo -e "${BLUE}[4] Testing Signup API Directly...${NC}"
TEST_EMAIL="debug-$(date +%s)@test.com"
SIGNUP_RESPONSE=$(curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"DebugTest123!\", \"fullName\": \"Debug User\"}" \
    -s -w "\nHTTP_STATUS:%{http_code}")

HTTP_STATUS=$(echo "$SIGNUP_RESPONSE" | grep "HTTP_STATUS" | cut -d: -f2)
RESPONSE_BODY=$(echo "$SIGNUP_RESPONSE" | sed '/HTTP_STATUS/d')

if [ "$HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Direct API signup successful${NC}"
    echo "   Response: $RESPONSE_BODY"
else
    echo -e "${RED}❌ Direct API signup failed (Status: $HTTP_STATUS)${NC}"
    echo "   Response: $RESPONSE_BODY"
fi

# Test password validation
echo -e "${BLUE}[5] Testing Password Validation...${NC}"
WEAK_PASSWORD_TEST=$(curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -d '{"email": "weak@test.com", "password": "weak", "fullName": "Weak User"}' \
    -s -w "\nHTTP_STATUS:%{http_code}")

WEAK_HTTP_STATUS=$(echo "$WEAK_PASSWORD_TEST" | grep "HTTP_STATUS" | cut -d: -f2)
if [ "$WEAK_HTTP_STATUS" = "400" ]; then
    echo -e "${GREEN}✅ Password validation working${NC}"
else
    echo -e "${YELLOW}⚠️  Password validation might have issues${NC}"
fi

# Test database connection
echo -e "${BLUE}[6] Testing Database Connection...${NC}"
cd /home/milan/fyp/antique-bidderly-1/server
DB_TEST=$(psql -h localhost -U milan -d antique_auction -c "SELECT 1;" 2>&1)
if [[ "$DB_TEST" == *"1"* ]]; then
    echo -e "${GREEN}✅ Database connection working${NC}"
else
    echo -e "${RED}❌ Database connection issues${NC}"
    echo "   $DB_TEST"
fi

# Check recent users
echo -e "${BLUE}[7] Checking Recent User Registrations...${NC}"
RECENT_USERS=$(psql -h localhost -U milan -d antique_auction -c "SELECT email, created_at FROM users ORDER BY created_at DESC LIMIT 3;" 2>/dev/null)
echo "$RECENT_USERS"

# Test with frontend URL
echo -e "${BLUE}[8] Testing with Frontend Origin...${NC}"
FRONTEND_SIGNUP_TEST=$(curl -X POST http://localhost:3001/api/auth/signup \
    -H "Content-Type: application/json" \
    -H "Origin: http://localhost:$FRONTEND_PORT" \
    -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36" \
    -d "{\"email\": \"frontend-$(date +%s)@test.com\", \"password\": \"FrontendTest123!\", \"fullName\": \"Frontend User\"}" \
    -s -w "\nHTTP_STATUS:%{http_code}")

FRONTEND_HTTP_STATUS=$(echo "$FRONTEND_SIGNUP_TEST" | grep "HTTP_STATUS" | cut -d: -f2)
FRONTEND_RESPONSE_BODY=$(echo "$FRONTEND_SIGNUP_TEST" | sed '/HTTP_STATUS/d')

if [ "$FRONTEND_HTTP_STATUS" = "201" ]; then
    echo -e "${GREEN}✅ Frontend origin signup successful${NC}"
else
    echo -e "${RED}❌ Frontend origin signup failed (Status: $FRONTEND_HTTP_STATUS)${NC}"
    echo "   Response: $FRONTEND_RESPONSE_BODY"
fi

echo ""
echo -e "${BLUE}📊 SUMMARY${NC}"
echo "==========="
echo "Backend: http://localhost:3001"
echo "Frontend: http://localhost:$FRONTEND_PORT"
echo ""
echo -e "${YELLOW}If registration is still failing in the browser:${NC}"
echo "1. Open browser dev tools (F12)"
echo "2. Go to Network tab"
echo "3. Try to register and look for failed requests"
echo "4. Check Console tab for JavaScript errors"
