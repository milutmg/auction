#!/bin/bash

echo "=== Testing Admin Dashboard Backend Endpoints ==="

# Check if servers are running
curl -s http://localhost:3001/api > /dev/null
if [ $? -eq 0 ]; then
    echo "✓ Backend server is running on port 3001"
else
    echo "✗ Backend server is not running"
    exit 1
fi

# Get admin token (assuming we have an admin user)
echo ""
echo "Testing admin endpoints..."

# Test admin stats endpoint
echo ""
echo "1. Testing /api/admin/stats"
ADMIN_TOKEN=$(cat logs/admin_token.txt 2>/dev/null || echo "")
if [ -z "$ADMIN_TOKEN" ]; then
    echo "No admin token found, trying to get one..."
    # Try to create/login admin for testing
    echo "Please ensure admin user exists and run this manually or provide token"
else
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3001/api/admin/stats | jq '.'
fi

echo ""
echo "2. Testing /api/admin/activity"
if [ ! -z "$ADMIN_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         "http://localhost:3001/api/admin/activity?page=1&limit=5" | jq '.'
fi

echo ""
echo "3. Testing /api/admin/top-performers"
if [ ! -z "$ADMIN_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3001/api/admin/top-performers | jq '.'
fi

echo ""
echo "4. Testing /api/admin/auctions/pending"
if [ ! -z "$ADMIN_TOKEN" ]; then
    curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
         -H "Content-Type: application/json" \
         http://localhost:3001/api/admin/auctions/pending | jq '.'
fi

echo ""
echo "=== Admin Dashboard Backend Test Complete ==="
