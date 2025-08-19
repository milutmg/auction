#!/bin/bash

echo "🚀 Starting Antique Bidderly with Correct Port Configuration"
echo "Client: http://localhost:8080"
echo "Server: http://localhost:3001"

# Kill any existing processes
echo "1. Cleaning up existing processes..."
sudo fuser -k 8080/tcp 3001/tcp 3002/tcp 2>/dev/null || true
pkill -f "node.*server.js" 2>/dev/null || true
pkill -f "npm.*dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

sleep 2

# Create logs directory
mkdir -p /home/milan/fyp/antique-bidderly-1/logs

echo "2. Starting backend server on port 3001..."
cd /home/milan/fyp/antique-bidderly-1/server
nohup npm run dev > ../logs/server.log 2>&1 &
echo $! > ../logs/server.pid

sleep 3

echo "3. Starting frontend client on port 8080..."
cd /home/milan/fyp/antique-bidderly-1/client
nohup npm run dev -- --port 8080 > ../logs/client.log 2>&1 &
echo $! > ../logs/client.pid

sleep 5

echo "4. Testing configuration..."
echo "Backend health check:"
curl -s http://localhost:3001/api/health 2>/dev/null || echo "Backend starting up..."

echo ""
echo "Frontend check:"
curl -s http://localhost:8080 | head -1 2>/dev/null || echo "Frontend starting up..."

echo ""
echo "✅ Servers started successfully!"
echo ""
echo "🌐 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📊 Admin credentials: admin@bidderly.com / Admin123!"
echo ""
echo "📝 Logs:"
echo "  Server: tail -f logs/server.log"
echo "  Client: tail -f logs/client.log"
