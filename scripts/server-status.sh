#!/bin/bash

# Server Management Script for Antique Bidderly
echo "🔧 Antique Bidderly Server Management"
echo "===================================="

echo "1. Checking current server status..."

# Check backend
if curl -s http://localhost:3001/ > /dev/null; then
    echo "   ✅ Backend server running on port 3001"
else
    echo "   ❌ Backend server not running"
fi

# Check frontend  
if curl -s http://localhost:8080 > /dev/null; then
    echo "   ✅ Frontend server running on port 8080"
else
    echo "   ❌ Frontend server not running"
fi

echo ""
echo "2. Server Management Commands:"
echo "   🚀 Start Backend:  cd server && npm start"
echo "   🚀 Start Frontend: cd client && npm run dev"
echo "   🛑 Stop All:       pkill -f node"
echo "   🔄 Restart:        Kill processes and restart"

echo ""
echo "3. Quick Status Check:"
echo "   Backend API: http://localhost:3001"
echo "   Frontend:    http://localhost:8080"
echo "   Login Page:  http://localhost:8080/auth"

echo ""
echo "4. Demo Credentials:"
echo "   Test User: test@example.com / password123"
echo "   Admin:     admin@example.com / admin123"

echo ""
echo "🎯 Ready for eSewa Payment Demo!"
echo "Go to: http://localhost:8080/auth"
