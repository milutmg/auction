#!/usr/bin/env node

const fetch = require('node-fetch');

async function testAuthFlow() {
  console.log('🔐 Testing Admin Authentication Flow');
  console.log('===================================');
  
  try {
    // Test login endpoint
    console.log('📡 Testing signin endpoint...');
    const loginResponse = await fetch('http://localhost:3001/api/auth/signin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123'
      })
    });
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      console.log(`👤 User role: ${loginData.user?.role || 'unknown'}`);
      console.log(`🔑 Token received: ${loginData.token ? 'Yes' : 'No'}`);
      
      if (loginData.user?.role === 'admin') {
        console.log('✅ User has admin role - dashboard should be accessible');
      } else {
        console.log('❌ User does not have admin role');
      }
      
      // Test protected route with token
      if (loginData.token) {
        console.log('\n📡 Testing protected route access...');
        const protectedResponse = await fetch('http://localhost:3001/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${loginData.token}`
          }
        });
        
        if (protectedResponse.ok) {
          console.log('✅ Protected route accessible with token');
        } else {
          console.log(`❌ Protected route not accessible: ${protectedResponse.status}`);
        }
      }
      
    } else {
      const errorData = await loginResponse.text();
      console.log(`❌ Login failed: ${loginResponse.status}`);
      console.log(`Error: ${errorData}`);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
    console.log('\nℹ️  This might indicate the backend server is not running.');
    console.log('Run: ./start-dev.sh to start the servers');
  }
  
  console.log('\n🌐 Frontend Testing:');
  console.log('==================');
  console.log('1. Open browser to http://localhost:8080');
  console.log('2. Open Developer Tools (F12)');
  console.log('3. Go to Application/Storage tab');
  console.log('4. Clear all local storage and session storage');
  console.log('5. Refresh page and try logging in again');
  console.log('6. After login, check localStorage for token');
  console.log('7. Navigate to /admin and check console for errors');
}

testAuthFlow();
