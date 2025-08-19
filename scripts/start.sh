#!/bin/bash

echo "🚀 Starting Antique Auction App..."
echo ""

# Kill any existing processes
echo "🛑 Cleaning up old processes..."
pkill -f "nodemon" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:8080 | xargs kill -9 2>/dev/null || true

# Wait for cleanup
sleep 2

# Start server in background
echo "📡 Starting server (port 3001)..."
(cd server && npm run dev > server.log 2>&1) &
SERVER_PID=$!

# Wait for server to start
echo "⏳ Waiting for server to start..."
sleep 5

# Start client in background
echo "🖥️ Starting client (port 8080)..."
(cd client && npm run dev > client.log 2>&1) &
CLIENT_PID=$!

# Wait for client to start
echo "⏳ Waiting for client to start..."
sleep 8

echo ""
echo "🎯 Application Ready!"
echo "═════════════════════════════════════════"
echo "🌐 Open: http://localhost:8080"
echo "🔧 Server: http://localhost:3001"
echo ""
echo "🔑 Admin Login:"
echo "   Email: admin@example.com"
echo "   Password: admin123"
echo ""
echo "👤 Test User:"
echo "   Email: testuser@example.com"
echo "   Password: password123"
echo ""
echo "📊 Process IDs:"
echo "   Server PID: $SERVER_PID"
echo "   Client PID: $CLIENT_PID"
echo ""
echo "💡 To stop: Press Ctrl+C or run: kill $SERVER_PID $CLIENT_PID"
echo ""

# Keep script running and handle Ctrl+C
trap "echo 'Stopping services...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit" INT

echo "✨ Services running! Press Ctrl+C to stop..."
while true; do
    sleep 1
done
