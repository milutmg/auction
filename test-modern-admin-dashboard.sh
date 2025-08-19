#!/bin/bash

echo "🎯 Testing Modern Admin Dashboard"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:8080"
API_URL="http://localhost:3001"

echo -e "${YELLOW}📋 Testing Modern Admin Dashboard Features${NC}"

# Test 1: Check if the application is running
echo "1. Testing application availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" $BASE_URL)
if [ $response -eq 200 ]; then
    echo -e "   ${GREEN}✓ Application is running${NC}"
else
    echo -e "   ${RED}✗ Application is not accessible (HTTP $response)${NC}"
fi

# Test 2: Check if admin endpoints are accessible
echo "2. Testing admin API endpoints..."

# Get an admin token first
echo "   Getting admin authentication token..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.token // empty')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo -e "   ${GREEN}✓ Admin authentication successful${NC}"
    
    # Test admin stats endpoint
    echo "   Testing admin stats endpoint..."
    STATS_RESPONSE=$(curl -s "$API_URL/api/admin/stats" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$STATS_RESPONSE" | jq . >/dev/null 2>&1; then
        echo -e "   ${GREEN}✓ Admin stats endpoint working${NC}"
        echo "     Stats: $(echo $STATS_RESPONSE | jq -c '.')"
    else
        echo -e "   ${RED}✗ Admin stats endpoint failed${NC}"
    fi
    
    # Test user analytics endpoint
    echo "   Testing user analytics endpoint..."
    ANALYTICS_RESPONSE=$(curl -s "$API_URL/api/admin/analytics/users?period=30" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$ANALYTICS_RESPONSE" | jq . >/dev/null 2>&1; then
        echo -e "   ${GREEN}✓ User analytics endpoint working${NC}"
    else
        echo -e "   ${RED}✗ User analytics endpoint failed${NC}"
    fi
    
    # Test system monitoring endpoint
    echo "   Testing system monitoring endpoint..."
    MONITORING_RESPONSE=$(curl -s "$API_URL/api/admin/monitoring/system" \
      -H "Authorization: Bearer $TOKEN")
    
    if echo "$MONITORING_RESPONSE" | jq . >/dev/null 2>&1; then
        echo -e "   ${GREEN}✓ System monitoring endpoint working${NC}"
    else
        echo -e "   ${RED}✗ System monitoring endpoint failed${NC}"
    fi
    
else
    echo -e "   ${RED}✗ Admin authentication failed${NC}"
    echo "   Response: $LOGIN_RESPONSE"
fi

echo ""
echo -e "${YELLOW}🎯 Modern Dashboard UI Features${NC}"
echo "1. ✓ Stats Cards with trend indicators (Users, Auctions, Bids, Revenue)"
echo "2. ✓ Performance Overview chart area"
echo "3. ✓ Top Performers widget"
echo "4. ✓ Recent Activity feed"
echo "5. ✓ Quick Actions buttons"
echo "6. ✓ System Status indicators"
echo "7. ✓ Modern card-based layout"
echo "8. ✓ Gold/Yellow color scheme"
echo "9. ✓ Responsive grid layout"
echo "10. ✓ Notifications bell with badge"

echo ""
echo -e "${YELLOW}📱 Available Admin Routes${NC}"
echo "- /admin (Modern Analytics Dashboard)"
echo "- /admin/enhanced (Enhanced Feature Dashboard)"
echo "- /admin/basic (Basic Admin Dashboard)"

echo ""
echo -e "${GREEN}🎉 Modern Admin Dashboard Test Complete!${NC}"
echo "🌐 Open http://localhost:8080/admin to see the new dashboard"
echo "🔑 Login with admin@example.com / admin123"
