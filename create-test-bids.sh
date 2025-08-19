#!/bin/bash

echo "🧪 Creating test pending bids for admin approval demo"
echo "=================================================="

API_BASE="http://localhost:3002/api"

# First, login as test user to get token
echo "1. Logging in as test user..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password"}')

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to login as test user"
  exit 1
fi

echo "✅ Test user logged in successfully"

# Get available auctions
echo "2. Getting available auctions..."
AUCTIONS_RESPONSE=$(curl -s "$API_BASE/auctions")
AUCTION_ID=$(echo $AUCTIONS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$AUCTION_ID" ]; then
  echo "❌ No auctions found"
  exit 1
fi

echo "✅ Found auction: $AUCTION_ID"

# Create test bids
echo "3. Creating test pending bids..."

echo "Creating bid #1..."
BID1_RESPONSE=$(curl -s -X POST "$API_BASE/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"auctionId\": \"$AUCTION_ID\", \"amount\": 150}")

echo "Response: $BID1_RESPONSE"

echo "Creating bid #2..."
BID2_RESPONSE=$(curl -s -X POST "$API_BASE/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{\"auctionId\": \"$AUCTION_ID\", \"amount\": 175}")

echo "Response: $BID2_RESPONSE"

echo ""
echo "✅ Test pending bids created!"
echo "🎯 Now check your admin dashboard at http://localhost:8080/admin"
echo "📋 You should see pending bids requiring approval"
