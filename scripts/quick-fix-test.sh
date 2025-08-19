#!/bin/bash

echo "🔧 Quick Fix Test for Auction Notifications"
echo "==========================================="

echo "1. Testing server..."
if curl -s http://localhost:3001/ > /dev/null; then
    echo "   ✅ Server running"
else
    echo "   ❌ Server not running"
    exit 1
fi

echo ""
echo "2. Check server logs for any errors..."
echo "   (Check the terminal where the server is running)"

echo ""
echo "3. Quick Test Steps:"
echo "   1. Go to: http://localhost:8080/auth"
echo "   2. Login as test user: test@example.com / password123"
echo "   3. Create a simple auction:"
echo "      - Title: 'Test Clock'"  
echo "      - Starting bid: 50"
echo "      - Any category"
echo "      - End time: tomorrow"
echo "   4. Check server logs for: 'Sent approval notifications'"
echo "   5. Login as admin: admin@example.com / admin123"
echo "   6. Go to dashboard"
echo "   7. Check browser console (F12) for pending auctions logs"
echo "   8. Look for 'Pending Auctions' section"

echo ""
echo "4. Debugging Info:"
echo "   - Server logs will show: 'Fetching pending auctions...'"
echo "   - Browser console will show: 'Pending auctions data:'"
echo "   - If no data appears, check authentication tokens"

echo ""
echo "🎯 Start testing: http://localhost:8080/auth"
