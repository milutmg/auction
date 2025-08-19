#!/bin/bash

echo "🔍 Checking Admin Dashboard Routes"
echo "=================================="

# Test if the application is running
echo "Testing application availability..."
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080

# Check if routes are working
echo ""
echo "Testing specific routes..."

# Test main page
echo "1. Testing main page (/):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/

# Test admin route
echo "2. Testing admin route (/admin):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/admin

# Test enhanced admin route
echo "3. Testing enhanced admin route (/admin/enhanced):"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/admin/enhanced

echo ""
echo "🔎 Checking build files..."
if [ -f "/home/milan/fyp/antique-bidderly-1/client/dist/index.html" ]; then
    echo "✓ Build files exist"
else
    echo "✗ Build files missing"
fi

echo ""
echo "🔍 Checking source files..."
if [ -f "/home/milan/fyp/antique-bidderly-1/client/src/pages/ModernAdminDashboard.tsx" ]; then
    echo "✓ ModernAdminDashboard.tsx exists"
    echo "Component definition:"
    grep -n "const.*Dashboard.*=" /home/milan/fyp/antique-bidderly-1/client/src/pages/ModernAdminDashboard.tsx
else
    echo "✗ ModernAdminDashboard.tsx missing"
fi

echo ""
echo "🔍 Checking App.tsx imports..."
grep -n "ModernAdminDashboard" /home/milan/fyp/antique-bidderly-1/client/src/App.tsx

echo ""
echo "🎯 To test the dashboard:"
echo "1. Open http://localhost:8080 in browser"
echo "2. Login with admin@example.com / admin123"  
echo "3. Navigate to /admin"
echo "4. Check browser console for any errors"
