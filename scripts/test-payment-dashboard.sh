#!/bin/bash

echo "🧪 Testing Payment Dashboard Integration..."

# Check if server is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Server not running. Start with: ./scripts/start-dev.sh"
    exit 1
fi

# Get test user ID
USER_ID=$(psql -h localhost -U milan -d antique_auction -t -c "SELECT id FROM users WHERE email = 'user@example.com';" | xargs)

if [ -z "$USER_ID" ]; then
    echo "❌ Test user not found"
    exit 1
fi

echo "✅ Test user found: $USER_ID"

# Test payment dashboard API
echo "Testing payment dashboard API..."
RESPONSE=$(curl -s "http://localhost:3001/api/payments/dashboard/$USER_ID")

if echo "$RESPONSE" | grep -q "Vintage Pocket Watch"; then
    echo "✅ Payment dashboard API working"
    echo "Response: $RESPONSE"
else
    echo "❌ Payment dashboard API failed"
    echo "Response: $RESPONSE"
fi

echo ""
echo "🎯 Test Complete!"
echo ""
echo "To test the full flow:"
echo "1. Login with: user@example.com / password123"
echo "2. Visit: http://localhost:8080/payments"
echo "3. You should see a pending payment for 'Vintage Pocket Watch'"
echo "4. Click 'Complete Payment' to test eSewa integration"