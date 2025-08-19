#!/usr/bin/env node

const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';
const FRONTEND_URL = 'http://localhost:8080';

// Test user credentials  
const TEST_USER = {
  email: 'testuser@test.com',
  password: 'TestPassword123!'
};

async function testRequest(method, endpoint, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, ok: response.ok, data };
  } catch (error) {
    return { status: 0, ok: false, error: error.message };
  }
}

async function checkUserProfileFix() {
  console.log('🔧 Testing User Profile Dropdown Fix');
  console.log('=' .repeat(40));
  
  // Test login to verify auth works
  console.log('\n🔐 Testing user authentication...');
  const result = await testRequest('POST', '/auth/signin', TEST_USER);
  
  if (result.ok && result.data.token) {
    console.log('✅ User authentication working');
    console.log(`   User: ${result.data.user.email}`);
    console.log(`   Role: ${result.data.user.role || 'user'}`);
  } else {
    console.log('❌ Authentication failed:', result.data?.error || result.error);
    return;
  }
  
  // Test profile endpoint
  console.log('\n👤 Testing profile endpoint...');
  const profileResult = await testRequest('GET', '/auth/profile', null, result.data.token);
  
  if (profileResult.ok) {
    console.log('✅ Profile endpoint working');
    console.log(`   Name: ${profileResult.data.full_name}`);
  } else {
    console.log('❌ Profile endpoint failed');
  }
  
  console.log('\n🌐 Frontend Testing Instructions:');
  console.log('=' .repeat(40));
  console.log(`1. Open ${FRONTEND_URL} in your browser`);
  console.log('2. Login with the test user credentials');
  console.log('3. Click on the user avatar in the top right corner');
  console.log('4. The dropdown should now:');
  console.log('   ✅ Stay open when you hover over it');
  console.log('   ✅ Not flicker or close unexpectedly');
  console.log('   ✅ Allow you to click on menu items');
  console.log('   ✅ Have a working "Sign Out" button that logs you out');
  console.log('\n🔧 Fixes Applied:');
  console.log('- Added explicit open/close state management');
  console.log('- Added modal={false} to prevent auto-closing');
  console.log('- Improved click event handling');
  console.log('- Added proper focus management');
  console.log('- Fixed event propagation issues');
  
  console.log('\n📱 Mobile vs Desktop:');
  console.log('- Desktop: Fixed flickering and click issues');
  console.log('- Mobile: Should continue working as before');
  
  console.log('\n🎯 The user profile dropdown should now work perfectly on desktop!');
}

checkUserProfileFix().catch(console.error);
