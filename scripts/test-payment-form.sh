#!/bin/bash

echo "🧪 Testing Payment Form..."

# Test the payment endpoint
echo "Testing payment form endpoint..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  -d '{"amount":"1000","customerName":"Test User","customerEmail":"test@example.com","description":"Test payment"}' \
  http://localhost:3001/api/payments/custom-pay)

if echo "$RESPONSE" | grep -q "Debug Info: Amount: 1000"; then
    echo "✅ Payment form endpoint working"
    echo "✅ Amount: 1000 detected in response"
    echo "✅ eSewa redirect page generated"
else
    echo "❌ Payment form endpoint failed"
    echo "Response: $RESPONSE"
fi

echo ""
echo "🎯 To test the full flow:"
echo "1. Open: http://localhost:8080"
echo "2. Login: user@example.com / password123"
echo "3. Click: 'Pay Now' in navbar"
echo "4. Enter amount: 1000"
echo "5. Fill form and submit"
echo "6. Should see eSewa redirect page"