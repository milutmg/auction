#!/bin/bash

echo "🔧 Testing Payment Integration..."

# Check if payment tables exist
echo "Checking payment tables..."
psql -h localhost -U milan -d antique_auction -c "\dt payment_transactions" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Payment tables exist"
else
    echo "❌ Payment tables missing - running setup..."
    ./scripts/setup-payment-tables.sh
fi

# Test payment route
echo "Testing payment route..."
curl -s "http://localhost:3001/api/payments/test-signature" > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Payment routes accessible"
else
    echo "❌ Payment routes not accessible - make sure server is running"
fi

# Check environment variables
echo "Checking eSewa configuration..."
if grep -q "ESEWA_MERCHANT_ID" server/.env; then
    echo "✅ eSewa configuration found"
else
    echo "❌ eSewa configuration missing"
fi

echo "Payment integration test complete!"
echo ""
echo "To test payment flow:"
echo "1. Start the servers: ./scripts/start-dev.sh"
echo "2. Create an auction and let it end"
echo "3. Visit the auction detail page as the winner"
echo "4. Click 'Pay with eSewa' button"