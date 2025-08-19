#!/bin/bash

# Test script for auction notification and approval system
echo "🧪 Testing Auction Notification & Approval System"
echo "================================================="

# Function to test with curl
test_endpoint() {
    local method=$1
    local url=$2
    local data=$3
    local token=$4
    
    echo "Testing: $method $url"
    
    if [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$url" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data")
        else
            response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST "$url" \
                -H "Authorization: Bearer $token")
        fi
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$url" \
            -H "Authorization: Bearer $token")
    fi
    
    echo "Response: $response"
    echo ""
}

echo "1. Testing server connectivity..."
if curl -s http://localhost:3001/ > /dev/null; then
    echo "   ✅ Backend server is running"
else
    echo "   ❌ Backend server not responding"
    exit 1
fi

echo ""
echo "2. Testing API endpoints..."

# Note: These tests require actual authentication tokens
# In a real test, you'd need to:
# 1. Login as a user to get token
# 2. Create an auction
# 3. Login as admin to get admin token
# 4. Test the pending auctions endpoint
# 5. Test approval/rejection

echo "   📝 Test Plan:"
echo "   - User creates auction → Should trigger admin notification"
echo "   - Admin views pending auctions → Should see new auction"
echo "   - Admin approves/rejects → Should notify auction creator"
echo ""

echo "3. Manual Testing Steps:"
echo "   1. Go to: http://localhost:8080/auth"
echo "   2. Login as regular user (test@example.com / password123)"
echo "   3. Create a new auction"
echo "   4. Check if admin receives notification"
echo "   5. Login as admin (admin@example.com / admin123)" 
echo "   6. Go to admin dashboard"
echo "   7. Check 'Pending Auctions' section"
echo "   8. Approve or reject the auction"
echo "   9. Check if user receives notification"
echo ""

echo "4. Expected Results:"
echo "   ✅ New auction creation triggers admin notification"
echo "   ✅ Pending auctions appear in admin dashboard"
echo "   ✅ Admin can approve/reject with one click"
echo "   ✅ Auction creator receives approval/rejection notification"
echo ""

echo "🎯 Ready for manual testing!"
echo "Open: http://localhost:8080/auth"
