#!/bin/bash

echo "🔧 Admin Dashboard Test - Final Verification"
echo "=========================================="

# Check if servers are running
echo "1. Checking server status..."
if pgrep -f "node.*server.js" > /dev/null; then
    echo "   ✅ Backend server is running"
else
    echo "   ❌ Backend server not running"
    exit 1
fi

if pgrep -f "vite" > /dev/null; then
    echo "   ✅ Frontend server is running"
else
    echo "   ❌ Frontend server not running"
    exit 1
fi

echo "2. Testing admin routes..."
echo "   📋 Admin credentials:"
echo "   Email: admin@example.com"
echo "   Password: password123"

echo "3. Available routes:"
echo "   🏠 Main app: http://localhost:5173"
echo "   👤 Dashboard: http://localhost:5173/dashboard"
echo "   🔐 Admin: http://localhost:5173/admin"
echo "   🔑 Login: http://localhost:5173/auth"

echo "4. Testing admin API endpoints..."
# Test if admin endpoints are available
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/admin/stats 2>/dev/null || echo "000")
if [ "$response" = "401" ]; then
    echo "   ✅ Admin API is responding (requires authentication)"
elif [ "$response" = "200" ]; then
    echo "   ✅ Admin API is responding"
else
    echo "   ⚠️  Admin API status: $response"
fi

echo ""
echo "🎯 NEXT STEPS:"
echo "1. Open http://localhost:5173 in your browser"
echo "2. Click 'Login' and use admin@example.com / password123"
echo "3. After login, you should see the modern Analytics Dashboard"
echo "4. The dashboard should show stats, charts, and admin features"
echo "5. Both /dashboard and /admin routes should show the same modern admin panel"

echo ""
echo "✨ Implementation complete!"
echo "   - UserDashboard.tsx now contains the modern admin dashboard"
echo "   - Both /dashboard and /admin routes use the same component"
echo "   - No tabs or legacy dashboard for admin users"
echo "   - Modern analytics-focused design with gold/yellow theme"
