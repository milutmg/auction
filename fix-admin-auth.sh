#!/bin/bash

echo "🔧 Quick Fix for Admin Dashboard Authentication Issues"

# Create a proper admin user
echo ""
echo "1. Creating admin user with proper credentials..."

curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@bidderly.com",
    "password": "Admin123!",
    "fullName": "System Administrator"
  }' \
  http://localhost:3001/api/auth/signup

echo ""
echo "2. Manually setting admin role in database..."

# Use Node.js to update user role directly in database
node -e "
const db = require('./server/config/database');
(async () => {
  try {
    const result = await db.query(
      'UPDATE users SET role = \$1 WHERE email = \$2 RETURNING *',
      ['admin', 'admin@bidderly.com']
    );
    console.log('✅ Admin role set successfully:', result.rows[0]);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error setting admin role:', error.message);
    process.exit(1);
  }
})();
"

echo ""
echo "3. Testing admin login..."

TOKEN=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bidderly.com","password":"Admin123!"}' \
  http://localhost:3001/api/auth/signin | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "✅ Admin login successful!"
    echo "Token: $TOKEN"
    
    echo ""
    echo "4. Testing admin endpoints..."
    
    echo "Debug auth:"
    curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3001/api/admin/debug-auth | jq '.'
    
    echo ""
    echo "Admin stats:"
    curl -s -H "Authorization: Bearer $TOKEN" \
      http://localhost:3001/api/admin/stats | jq '.'
      
    echo ""
    echo "🎉 Admin dashboard should now work properly!"
    echo "Use these credentials to log in:"
    echo "Email: admin@bidderly.com"
    echo "Password: Admin123!"
    
else
    echo "❌ Admin login still failing"
fi
