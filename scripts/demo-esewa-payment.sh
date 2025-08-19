#!/bin/bash

# eSewa Payment Demo Test Script
echo "🚀 Starting eSewa Payment Integration Demo"
echo "==========================================="

# Check if servers are running
echo "1. Checking server status..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "   ✅ Backend server is running (port 3001)"
else
    echo "   ❌ Backend server not responding"
    exit 1
fi

if curl -s http://localhost:8080 > /dev/null; then
    echo "   ✅ Frontend server is running (port 8080)"
else
    echo "   ❌ Frontend server not responding"
    exit 1
fi

echo ""
echo "2. Testing API endpoints..."

# Test auth endpoint
echo "   - Testing auth endpoint..."
AUTH_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}')

if echo "$AUTH_RESPONSE" | grep -q "token\|success"; then
    echo "   ✅ Auth endpoint working"
else
    echo "   ⚠️  Auth endpoint response: $AUTH_RESPONSE"
fi

# Test auctions endpoint
echo "   - Testing auctions endpoint..."
AUCTIONS_RESPONSE=$(curl -s http://localhost:3001/api/auctions)
if echo "$AUCTIONS_RESPONSE" | grep -q "\[\]" || echo "$AUCTIONS_RESPONSE" | grep -q "id"; then
    echo "   ✅ Auctions endpoint working"
else
    echo "   ⚠️  Auctions endpoint response: $AUCTIONS_RESPONSE"
fi

echo ""
echo "3. eSewa Integration Check..."

# Check eSewa configuration
if [ -f "/home/milan/fyp/antique-bidderly-1/server/config/esewa.js" ]; then
    echo "   ✅ eSewa config file exists"
else
    echo "   ❌ eSewa config file missing"
fi

# Check eSewa service
if [ -f "/home/milan/fyp/antique-bidderly-1/server/services/esewaPayment.js" ]; then
    echo "   ✅ eSewa payment service exists"
else
    echo "   ❌ eSewa payment service missing"
fi

# Check frontend payment component
if [ -f "/home/milan/fyp/antique-bidderly-1/client/src/components/payment/EsewaPaymentButton.tsx" ]; then
    echo "   ✅ eSewa payment button component exists"
else
    echo "   ❌ eSewa payment button component missing"
fi

echo ""
echo "🎯 Demo Instructions:"
echo "====================="
echo ""
echo "1. Open your browser and go to: http://localhost:8080"
echo ""
echo "2. Login with test credentials:"
echo "   Email: test@example.com"
echo "   Password: password123"
echo ""
echo "3. If the above credentials don't work, try admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: password123"
echo ""
echo "4. Navigate to auctions and either:"
echo "   - Join an existing auction and win it"
echo "   - Create a new auction (if admin) and bid on it"
echo ""
echo "5. After winning an auction:"
echo "   - Go to your dashboard"
echo "   - Find the won auction"
echo "   - Click 'Pay Now' or similar button"
echo ""
echo "6. On the payment page:"
echo "   - Look for 'Pay with eSewa' button"
echo "   - Click it to initiate payment"
echo "   - Complete the eSewa test payment flow"
echo ""
echo "7. Verify payment success:"
echo "   - Check if redirected to success page"
echo "   - Verify payment status in dashboard"
echo ""
echo "🔧 Troubleshooting:"
echo "==================="
echo "- If login fails, check browser console (F12)"
echo "- If payment button is missing, check browser network tab"
echo "- If eSewa redirect fails, check server logs"
echo "- If payment status doesn't update, check database"
echo ""
echo "💡 Ready to start demo!"
echo "Open http://localhost:8080 in your browser to begin."
