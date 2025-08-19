#!/bin/bash

echo "🔄 Restarting Antique Bidderly Application"
echo "=========================================="

# Kill all node processes
echo "1. Stopping all processes..."
killall -9 node 2>/dev/null
killall -9 nodemon 2>/dev/null
pkill -f "vite" 2>/dev/null
sleep 3

# Clear ports
echo "2. Clearing ports..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 2

# Start backend server
echo "3. Starting backend server on port 3001..."
cd server
nohup node server.js > ../logs/server.log 2>&1 &
sleep 3

# Check if server started
if curl -s http://localhost:3001 > /dev/null; then
    echo "   ✅ Backend server started successfully"
else
    echo "   ❌ Backend server failed to start"
    exit 1
fi

# Start frontend client
echo "4. Starting frontend client on port 8080..."
cd ../client
nohup npm run dev > ../logs/client.log 2>&1 &
sleep 5

# Check if client started
if curl -s http://localhost:8080 > /dev/null; then
    echo "   ✅ Frontend client started successfully"
else
    echo "   ❌ Frontend client failed to start"
fi

echo ""
echo "🚀 Application Status:"
echo "   Backend:  http://localhost:3001"
echo "   Frontend: http://localhost:8080"
echo ""
echo "📋 Logs:"
echo "   Server:   tail -f logs/server.log"
echo "   Client:   tail -f logs/client.log"
echo ""
echo "✨ Application restarted successfully!"