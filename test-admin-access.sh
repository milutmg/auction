#!/bin/bash

echo "Testing Admin Dashboard Access..."

# Check if servers are running
echo "1. Checking server status:"
curl -s --connect-timeout 5 --max-time 10 http://localhost:3002/api/health | jq -r '.status // "ERROR"' 2>/dev/null || echo "Backend: ERROR"
curl -s --connect-timeout 3 --max-time 5 http://localhost:8080 | grep -q "<!doctype html>" 2>/dev/null && echo "Frontend: OK" || echo "Frontend: ERROR"

echo ""
echo "2. Testing admin login with common credentials:"

# Try the correct admin credentials
CREDENTIALS=(
    '{"email": "admin@example.com", "password": "admin123"}'
)

for cred in "${CREDENTIALS[@]}"; do
    echo "Trying: $cred"
    RESPONSE=$(curl -s --connect-timeout 3 --max-time 5 -X POST http://localhost:3002/api/auth/login \
        -H "Content-Type: application/json" \
        -d "$cred" 2>/dev/null)
    
    if echo "$RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
        TOKEN=$(echo "$RESPONSE" | jq -r '.token')
        echo "✅ Login successful! Token: ${TOKEN:0:20}..."
        
        # Test admin endpoint with token
        echo "3. Testing admin endpoints:"
        curl -s --connect-timeout 3 --max-time 5 -H "Authorization: Bearer $TOKEN" \
            http://localhost:3002/api/admin/pending-bids | jq '.total // "ERROR"' 2>/dev/null
        
        exit 0
    else
        echo "❌ Login failed: $RESPONSE"
    fi
done

echo ""
echo "4. Checking database for admin users:"
cd /home/milan/fyp/antique-bidderly-1/server
node -e "
const db = require('./config/database');
(async () => {
  try {
    const result = await db.query('SELECT email, role FROM users WHERE role = \$1', ['admin']);
    console.log('Admin users found:', result.rows.length);
    result.rows.forEach(user => console.log('  -', user.email));
    process.exit(0);
  } catch (error) {
    console.error('Database error:', error.message);
    process.exit(1);
  }
})();
"
