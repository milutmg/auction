#!/bin/bash

# Startup script for Antique Bidderly application
# This script starts both the backend server and frontend server

echo "🚀 Starting Antique Bidderly Application..."
echo ""

# Kill any existing processes on ports 3001 and 8080
echo "🧹 Cleaning up existing processes..."
sudo fuser -k 3001/tcp 2>/dev/null || true
sudo fuser -k 8080/tcp 2>/dev/null || true
sleep 2

# Start backend server
echo "🖥️  Starting backend server on port 3001..."
cd server
node server.js > server-output.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 3

# Check if backend is running
if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ Backend server is running on http://localhost:3001"
else
    echo "❌ Backend server failed to start"
    exit 1
fi

# Start frontend server
echo "🎨 Starting frontend server on port 8080..."
cd client
npm run dev > client-output.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
sleep 5

# Check if frontend is running
if curl -s -I http://localhost:8080 > /dev/null; then
    echo "✅ Frontend server is running on http://localhost:8080"
else
    echo "❌ Frontend server failed to start"
fi

echo ""
echo "🎉 Antique Bidderly Application is ready!"
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend:  http://localhost:3001"
echo "🐛 Debug:    http://localhost:8080/debug"
echo ""
echo "📋 Process IDs:"
echo "   Backend PID: $BACKEND_PID"
echo "   Frontend PID: $FRONTEND_PID"
echo ""
echo "📄 Log files:"
echo "   Backend:  server/server-output.log"
echo "   Frontend: client/client-output.log"
echo ""
echo "⚠️  To stop the servers, run: ./stop-servers.sh"
echo "   Or manually kill processes: kill $BACKEND_PID $FRONTEND_PID"
