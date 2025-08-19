#!/bin/bash

# Test script to verify bidding authentication is properly enforced
echo "🔒 Testing Bidding Authentication Protection"
echo "=========================================="

API_BASE="http://localhost:3002/api"

echo ""
echo "📋 Test 1: Attempting to place bid WITHOUT authentication token"
echo "Expected: 401 Unauthorized"

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE/bids" \
  -H "Content-Type: application/json" \
  -d '{"auctionId": "1", "amount": 100}')

HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed 's/HTTPSTATUS:[0-9]*$//')

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $BODY"

if [ "$HTTP_STATUS" -eq 401 ]; then
    echo "✅ PASS: Bidding correctly rejected without authentication"
else
    echo "❌ FAIL: Bidding should require authentication"
fi

echo ""
echo "📋 Test 2: Attempting to place bid on auction route WITHOUT authentication token"
echo "Expected: 401 Unauthorized"

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE/auctions/1/bid" \
  -H "Content-Type: application/json" \
  -d '{"amount": 100}')

HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed 's/HTTPSTATUS:[0-9]*$//')

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $BODY"

if [ "$HTTP_STATUS" -eq 401 ]; then
    echo "✅ PASS: Auction bidding correctly rejected without authentication"
else
    echo "❌ FAIL: Auction bidding should require authentication"
fi

echo ""
echo "📋 Test 3: Attempting to place bid with INVALID authentication token"
echo "Expected: 403 Forbidden or 401 Unauthorized"

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "$API_BASE/bids" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer invalid_token_12345" \
  -d '{"auctionId": "1", "amount": 100}')

HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')
BODY=$(echo $RESPONSE | sed 's/HTTPSTATUS:[0-9]*$//')

echo "HTTP Status: $HTTP_STATUS"
echo "Response: $BODY"

if [ "$HTTP_STATUS" -eq 403 ] || [ "$HTTP_STATUS" -eq 401 ]; then
    echo "✅ PASS: Bidding correctly rejected with invalid token"
else
    echo "❌ FAIL: Bidding should reject invalid tokens"
fi

echo ""
echo "📋 Test 4: Check if auctions endpoint exists and returns data"

RESPONSE=$(curl -s -w "HTTPSTATUS:%{http_code}" -X GET "$API_BASE/auctions")
HTTP_STATUS=$(echo $RESPONSE | grep -o "HTTPSTATUS:[0-9]*" | sed 's/HTTPSTATUS://')

echo "HTTP Status: $HTTP_STATUS"

if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ PASS: Auctions endpoint is accessible"
else
    echo "❌ FAIL: Auctions endpoint not working"
fi

echo ""
echo "📋 Test Summary"
echo "==============="
echo "These tests verify that:"
echo "1. Bidding is protected by authentication middleware"
echo "2. Invalid tokens are rejected"
echo "3. No bidding can happen without proper authorization"
echo ""
echo "If all tests pass, your bidding authentication is working correctly! 🎉"
