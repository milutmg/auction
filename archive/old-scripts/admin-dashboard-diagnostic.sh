#!/bin/bash

echo "🔍 Antique Bidderly - Admin Dashboard Diagnostic"
echo "==============================================="

echo ""
echo "📊 Server Status:"
echo "----------------"
curl -s http://localhost:8080/api/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Backend server (3001) is responding"
else
    echo "❌ Backend server is not responding"
fi

curl -s http://localhost:8080 > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Frontend server (8080) is responding"
else
    echo "❌ Frontend server is not responding"
fi

echo ""
echo "🗂️  File Verification:"
echo "---------------------"

# Check main files
if [ -f "client/src/App.tsx" ]; then
    echo "✅ App.tsx exists"
    if grep -q "ModernAdminDashboard" client/src/App.tsx; then
        echo "✅ ModernAdminDashboard is imported in App.tsx"
    else
        echo "❌ ModernAdminDashboard NOT imported in App.tsx"
    fi
else
    echo "❌ App.tsx missing"
fi

if [ -f "client/src/pages/ModernAdminDashboard.tsx" ]; then
    echo "✅ ModernAdminDashboard.tsx exists"
else
    echo "❌ ModernAdminDashboard.tsx missing"
fi

echo ""
echo "🔐 Authentication Test:"
echo "----------------------"
echo "Admin user credentials: admin@example.com / admin123"

echo ""
echo "📋 Manual Testing Steps:"
echo "------------------------"
echo "1. Open browser and go to: http://localhost:8080"
echo "2. Click 'Login' or navigate to login page"
echo "3. Enter credentials: admin@example.com / admin123"
echo "4. After login, navigate to: http://localhost:8080/admin"
echo "5. The modern dashboard should load instantly with:"
echo "   - Statistics cards showing user/auction counts"
echo "   - Gold/yellow color scheme"
echo "   - Recent activity feed"
echo "   - Top performers section"

echo ""
echo "🐛 If dashboard doesn't appear:"
echo "------------------------------"
echo "1. Open browser developer tools (F12)"
echo "2. Check Console tab for JavaScript errors"
echo "3. Check Network tab for failed API requests"
echo "4. Try hard refresh (Ctrl+Shift+R or Cmd+Shift+R)"
echo "5. Clear browser cache and try again"

echo ""
echo "🌐 Direct URLs to test:"
echo "----------------------"
echo "App home: http://localhost:8080"
echo "Login: http://localhost:8080/login"
echo "Admin Dashboard: http://localhost:8080/admin"
echo "API Health: http://localhost:8080/api/health"
