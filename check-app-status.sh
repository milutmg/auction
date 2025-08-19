#!/bin/bash

echo "🔧 Web Application Status Check"
echo "================================"

# Check servers
echo "1. Checking server status..."
if pgrep -f "node.*server" > /dev/null; then
    echo "   ✅ Backend server is running (port 3001)"
else
    echo "   ❌ Backend server not running"
fi

if pgrep -f "vite" > /dev/null; then
    echo "   ✅ Frontend server is running (port 8080)"
else
    echo "   ❌ Frontend server not running"
fi

# Check ports
echo ""
echo "2. Checking port accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null | grep -q "200\|404"; then
    echo "   ✅ Backend API accessible on port 3001"
else
    echo "   ⚠️  Backend API not responding on port 3001"
fi

if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 2>/dev/null | grep -q "200"; then
    echo "   ✅ Frontend accessible on port 8080"
else
    echo "   ❌ Frontend not accessible on port 8080"
fi

echo ""
echo "3. Available URLs:"
echo "   🏠 Main app: http://localhost:8080"
echo "   👤 Dashboard: http://localhost:8080/dashboard"
echo "   🔐 Admin: http://localhost:8080/admin"
echo "   🔑 Login: http://localhost:8080/auth"

echo ""
echo "4. Admin credentials:"
echo "   📋 Email: admin@example.com"
echo "   🔑 Password: password123"

echo ""
echo "✨ If the app is not loading properly:"
echo "   1. Try refreshing the browser (Ctrl+F5)"
echo "   2. Check browser console for errors (F12)"
echo "   3. Clear browser cache"
echo "   4. Make sure you're using the correct port (8080, not 5173)"
