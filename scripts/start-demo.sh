#!/bin/bash

echo "🚀 Starting Admin Panel Demo..."
echo ""

# Kill any existing processes on the ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Start server in background
echo "📡 Starting server on port 3001..."
cd server && npm run dev > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Start client in background  
echo "🖥️ Starting client on port 8080..."
cd ../client && npm run dev > client.log 2>&1 &
CLIENT_PID=$!

# Wait for client to start
sleep 8

echo ""
echo "🎯 Demo is ready!"
echo "═══════════════════════════════════════════════════"
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend: http://localhost:3001" 
echo ""
echo "🔑 Admin Credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "👤 Test User Credentials:"
echo "   Email: testuser@example.com" 
echo "   Password: password123"
echo ""
echo "📝 Testing Instructions:"
echo "1. Open http://localhost:8080 in your browser"
echo "2. Click 'Sign In' and login as admin"  
echo "3. Look for the 'Admin' button in the top right navbar"
echo "4. Click 'Admin' to access the admin dashboard"
echo "5. You should see pending auctions waiting for approval"
echo "6. Test the approve/reject functionality"
echo "7. Explore other admin features (users, reports, etc.)"
echo "8. Try logging in as the test user to create more auctions"
echo ""
echo "🔄 Server PID: $SERVER_PID"
echo "🔄 Client PID: $CLIENT_PID"
echo ""
echo "To stop the demo:"
echo "  kill $SERVER_PID $CLIENT_PID"
echo "  Or press Ctrl+C in this terminal"
echo ""

# Keep script running so PIDs remain valid
trap "echo 'Stopping demo...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT

echo "Press Ctrl+C to stop the demo servers..."
while true; do
  sleep 1
done
