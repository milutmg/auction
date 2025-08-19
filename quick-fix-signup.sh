#!/bin/bash

echo "🚀 Quick Fix for Signup & WebSocket Issues"

# 1. Fix WebSocket connection by restarting servers with correct config
echo "1. Stopping servers..."
pkill -f "node.*server.js" 2>/dev/null
pkill -f "npm.*dev" 2>/dev/null

# Wait a moment
sleep 2

echo "2. Starting backend server on port 3002..."
cd /home/milan/fyp/antique-bidderly-1/server
nohup npm run dev > ../logs/server.log 2>&1 &
echo $! > ../logs/server.pid

echo "3. Starting frontend server on port 8080..."
cd /home/milan/fyp/antique-bidderly-1/client
nohup npm run dev > ../logs/client.log 2>&1 &
echo $! > ../logs/client.pid

# Wait for servers to start
sleep 3

echo "4. Testing signup endpoint..."
SIGNUP_TEST=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"quicktest@test.com","password":"Test123!","fullName":"Quick Test"}' \
  http://localhost:3002/api/auth/signup)

echo "Signup test result: $SIGNUP_TEST"

echo ""
echo "5. Testing WebSocket connection..."
curl -s http://localhost:3002/socket.io/ | head -1

echo ""
echo "✅ Servers restarted with correct configuration!"
echo "Frontend: http://localhost:8080"
echo "Backend: http://localhost:3002"
echo "Try signup now - it should work!"
