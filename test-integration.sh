#!/bin/bash

# Test script to verify the dynamic category and auction functionality

echo "🔍 Testing Antique Bidderly Category & Auction Integration"
echo "================================================"

BASE_URL="http://localhost"
CLIENT_PORT="8080"
SERVER_PORT="3002"

# Test 1: Frontend is accessible
echo "1. Testing frontend accessibility..."
if curl -s "$BASE_URL:$CLIENT_PORT" > /dev/null; then
    echo "✅ Frontend is accessible at $BASE_URL:$CLIENT_PORT"
else
    echo "❌ Frontend is not accessible"
    exit 1
fi

# Test 2: Backend API is accessible
echo "2. Testing backend API accessibility..."
if curl -s "$BASE_URL:$SERVER_PORT/api/categories" > /dev/null; then
    echo "✅ Backend API is accessible at $BASE_URL:$SERVER_PORT"
else
    echo "❌ Backend API is not accessible"
    exit 1
fi

# Test 3: Categories endpoint returns data
echo "3. Testing categories endpoint..."
CATEGORIES_RESPONSE=$(curl -s "$BASE_URL:$SERVER_PORT/api/categories")
CATEGORY_COUNT=$(echo "$CATEGORIES_RESPONSE" | jq length 2>/dev/null || echo "0")
if [ "$CATEGORY_COUNT" -gt 0 ]; then
    echo "✅ Categories endpoint returns $CATEGORY_COUNT categories"
else
    echo "❌ Categories endpoint returns no data"
fi

# Test 4: Category detail endpoint works
echo "4. Testing category detail endpoint..."
FIRST_CATEGORY=$(echo "$CATEGORIES_RESPONSE" | jq -r '.[0].name' 2>/dev/null)
if [ "$FIRST_CATEGORY" != "null" ] && [ "$FIRST_CATEGORY" != "" ]; then
    CATEGORY_DETAIL_RESPONSE=$(curl -s "$BASE_URL:$SERVER_PORT/api/categories/$(echo "$FIRST_CATEGORY" | sed 's/ /%20/g')")
    if echo "$CATEGORY_DETAIL_RESPONSE" | jq -e '.category' > /dev/null 2>&1; then
        echo "✅ Category detail endpoint works for '$FIRST_CATEGORY'"
    else
        echo "❌ Category detail endpoint failed for '$FIRST_CATEGORY'"
    fi
else
    echo "❌ Could not get first category name"
fi

# Test 5: Auctions endpoint works
echo "5. Testing auctions endpoint..."
AUCTIONS_RESPONSE=$(curl -s "$BASE_URL:$SERVER_PORT/api/auctions")
if echo "$AUCTIONS_RESPONSE" | jq -e '.auctions' > /dev/null 2>&1; then
    AUCTION_COUNT=$(echo "$AUCTIONS_RESPONSE" | jq '.auctions | length' 2>/dev/null || echo "0")
    echo "✅ Auctions endpoint returns $AUCTION_COUNT auctions"
else
    echo "❌ Auctions endpoint failed"
fi

# Test 6: Frontend pages load correctly
echo "6. Testing frontend page responses..."
PAGES=("/" "/categories" "/auctions")
for page in "${PAGES[@]}"; do
    if curl -s "$BASE_URL:$CLIENT_PORT$page" | grep -q "<!doctype html" 2>/dev/null; then
        echo "✅ Page '$page' loads correctly"
    else
        echo "❌ Page '$page' failed to load"
    fi
done

echo "================================================"
echo "🎉 Integration test completed!"
echo ""
echo "🌐 Access the application:"
echo "   Frontend: $BASE_URL:$CLIENT_PORT"
echo "   Categories: $BASE_URL:$CLIENT_PORT/categories"
echo "   Auctions: $BASE_URL:$CLIENT_PORT/auctions"
echo ""
echo "🔗 API Endpoints:"
echo "   Categories: $BASE_URL:$SERVER_PORT/api/categories"
echo "   Auctions: $BASE_URL:$SERVER_PORT/api/auctions"
