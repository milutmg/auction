#!/bin/bash

echo "🔧 ROUTE DIAGNOSTIC - Finding Missing Routes"
echo "==========================================="

echo -e "\n1. 🖥️  Server Status:"
echo "   Backend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/)"
echo "   Frontend: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/)"

echo -e "\n2. 🔍 Testing Core API Routes:"

# Test auth routes
echo "   Auth Health: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/auth/health)"
echo "   Auth Check: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/auth/check)"

# Test main routes
echo "   Auctions: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/auctions)"
echo "   Categories: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/bids/categories)"
echo "   Admin: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/api/admin/stats)"

echo -e "\n3. 🚫 Testing Potentially Missing Routes:"

# Test routes that might be missing
missing_routes=(
    "/api/auth/login"
    "/api/auth/register" 
    "/api/users"
    "/api/user/profile"
    "/api/dashboard"
    "/api/admin/users"
    "/api/admin/dashboard"
    "/api/socket.io"
    "/socket.io"
)

for route in "${missing_routes[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3002$route")
    if [ "$status" = "404" ]; then
        echo "   ❌ $route: $status (Route not found)"
    else
        echo "   ✅ $route: $status"
    fi
done

echo -e "\n4. 📊 Frontend Route Test:"
curl -s http://localhost:8080/ | head -n 5 | grep -q "<!doctype html" && echo "   ✅ Frontend serving HTML" || echo "   ❌ Frontend not serving HTML"

echo -e "\n5. 🔌 WebSocket Test:"
curl -s "http://localhost:3002/socket.io/?EIO=4&transport=polling" | head -n 1

echo -e "\n6. 🆔 Available Routes Summary:"
echo "   Core API Routes Available:"
echo "   - GET  /api/auth/health"
echo "   - POST /api/auth/signin"
echo "   - POST /api/auth/signup" 
echo "   - GET  /api/auctions"
echo "   - GET  /api/bids/categories"
echo "   - POST /api/bids"
echo "   - GET  /api/admin/stats"
echo "   - GET  /api/notifications"

echo -e "\n✅ Diagnosis Complete!"
echo "📋 If you're still getting 'Route not found', please specify:"
echo "   1. The exact URL you're trying to access"
echo "   2. The HTTP method (GET, POST, etc.)"
echo "   3. Where you're seeing this error (browser console, API call, etc.)"
