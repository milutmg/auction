#!/usr/bin/env node

const { default: fetch } = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Test configurations
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

const NEW_USER = {
  email: 'testuser4@example.com',
  password: 'SecureTest789!',
  fullName: 'Test User 4'
};

const TEST_AUCTION = {
  title: 'Test Auction Item',
  description: 'A beautiful test auction item for testing purposes',
  starting_bid: 50.00,
  reserve_price: 100.00,
  estimated_value_min: 75.00,
  estimated_value_max: 150.00,
  end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
  image_url: 'https://via.placeholder.com/400x300?text=Test+Auction+Item'
};

let adminToken = '';
let newUserToken = '';

// Test functions
async function testRequest(method, endpoint, body = null, token = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
}

async function testAdminLogin() {
  console.log('\n🔐 Testing Admin Login...');
  const result = await testRequest('POST', '/auth/signin', ADMIN_CREDENTIALS);
  
  if (result.ok && result.data.token) {
    adminToken = result.data.token;
    console.log('✅ Admin login successful');
    console.log(`   Token: ${adminToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Admin login failed:', result.data?.error || result.error);
    return false;
  }
}

async function testCreateUser() {
  console.log('\n👤 Testing User Login (with existing user)...');
  
  // Try to login with an existing test user from database
  const testUser = {
    email: 'testuser@test.com',
    password: 'TestPassword123!'
  };
  
  const loginResult = await testRequest('POST', '/auth/signin', testUser);
  
  if (loginResult.ok && loginResult.data.token) {
    newUserToken = loginResult.data.token;
    console.log('✅ Test user login successful');
    console.log(`   Token: ${newUserToken.substring(0, 20)}...`);
    return true;
  } else {
    console.log('❌ Test user login failed:', loginResult.data?.error || loginResult.error);
    return false;
  }
}

async function testGetCategories() {
  console.log('\n📂 Testing Get Categories...');
  const result = await testRequest('GET', '/bids/categories');
  
  if (result.ok && Array.isArray(result.data)) {
    console.log('✅ Categories fetch successful');
    console.log(`   Found ${result.data.length} categories:`, result.data.map(c => c.name).join(', '));
    return result.data;
  } else {
    console.log('❌ Categories fetch failed:', result.data?.error || result.error);
    return [];
  }
}

async function testCreateAuction() {
  console.log('\n🏺 Testing Create Auction...');
  
  // First get categories to use a valid category_id
  const categories = await testGetCategories();
  if (categories.length === 0) {
    console.log('❌ Cannot create auction: No categories available');
    return false;
  }

  const auctionData = {
    ...TEST_AUCTION,
    category_id: categories[0].id
  };

  const result = await testRequest('POST', '/auctions', auctionData, newUserToken);
  
  if (result.ok) {
    console.log('✅ Auction creation successful');
    console.log(`   Auction ID: ${result.data.id}`);
    console.log(`   Title: ${result.data.title}`);
    console.log(`   Status: ${result.data.status}`);
    return result.data;
  } else {
    console.log('❌ Auction creation failed:', result.data?.error || result.error);
    return null;
  }
}

async function testGetAuctions() {
  console.log('\n📋 Testing Get Auctions...');
  const result = await testRequest('GET', '/auctions');
  
  if (result.ok && Array.isArray(result.data)) {
    console.log('✅ Auctions fetch successful');
    console.log(`   Found ${result.data.length} auctions`);
    result.data.slice(0, 3).forEach(auction => {
      console.log(`   - ${auction.title} (${auction.status}) - $${auction.starting_bid}`);
    });
    return result.data;
  } else {
    console.log('❌ Auctions fetch failed:', result.data?.error || result.error);
    return [];
  }
}

async function testAdminGetPendingAuctions() {
  console.log('\n👨‍💼 Testing Admin - Get Pending Auctions...');
  const result = await testRequest('GET', '/admin/auctions/pending', null, adminToken);
  
  if (result.ok && Array.isArray(result.data)) {
    console.log('✅ Admin pending auctions fetch successful');
    console.log(`   Found ${result.data.length} pending auctions`);
    result.data.forEach(auction => {
      console.log(`   - ${auction.title} (${auction.approval_status})`);
    });
    return result.data;
  } else {
    console.log('❌ Admin pending auctions fetch failed:', result.data?.error || result.error);
    return [];
  }
}

async function testAdminStats() {
  console.log('\n📊 Testing Admin - Get Stats...');
  const result = await testRequest('GET', '/admin/stats', null, adminToken);
  
  if (result.ok) {
    console.log('✅ Admin stats fetch successful');
    console.log('   Stats:', JSON.stringify(result.data, null, 2));
    return result.data;
  } else {
    console.log('❌ Admin stats fetch failed:', result.data?.error || result.error);
    return null;
  }
}

async function testSocketConnection() {
  console.log('\n🔌 Testing Socket.IO Connection...');
  
  try {
    const io = require('socket.io-client');
    const socket = io('http://localhost:3001');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        console.log('❌ Socket connection timeout');
        socket.disconnect();
        resolve(false);
      }, 5000);

      socket.on('connect', () => {
        console.log('✅ Socket connected successfully');
        console.log(`   Socket ID: ${socket.id}`);
        clearTimeout(timeout);
        socket.disconnect();
        resolve(true);
      });

      socket.on('connect_error', (error) => {
        console.log('❌ Socket connection error:', error.message);
        clearTimeout(timeout);
        resolve(false);
      });
    });
  } catch (error) {
    console.log('❌ Socket test failed:', error.message);
    return false;
  }
}

async function checkAPIEndpoints() {
  console.log('\n🌐 Checking API Endpoints...');
  
  const endpoints = [
    { method: 'GET', path: '/', name: 'Root endpoint' },
    { method: 'GET', path: '/auctions', name: 'Get auctions' },
    { method: 'GET', path: '/bids/categories', name: 'Get categories' }
  ];

  for (const endpoint of endpoints) {
    const result = await testRequest(endpoint.method, endpoint.path);
    if (result.ok) {
      console.log(`✅ ${endpoint.name} working`);
    } else {
      console.log(`❌ ${endpoint.name} failed: ${result.data?.error || result.error}`);
    }
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Antique Bidderly Application Tests');
  console.log('=' .repeat(50));

  const results = {
    apiEndpoints: false,
    adminLogin: false,
    userCreation: false,
    auctionCreation: false,
    auctionListing: false,
    adminFeatures: false,
    socketConnection: false
  };

  // Test basic API endpoints
  await checkAPIEndpoints();
  results.apiEndpoints = true;

  // Test admin login
  results.adminLogin = await testAdminLogin();

  // Test user creation
  results.userCreation = await testCreateUser();

  // Test auction creation
  if (results.userCreation) {
    const auction = await testCreateAuction();
    results.auctionCreation = !!auction;
  }

  // Test auction listing
  const auctions = await testGetAuctions();
  results.auctionListing = auctions.length > 0;

  // Test admin features
  if (results.adminLogin) {
    await testAdminGetPendingAuctions();
    await testAdminStats();
    results.adminFeatures = true;
  }

  // Test socket connection
  results.socketConnection = await testSocketConnection();

  // Print summary
  console.log('\n🏁 Test Results Summary');
  console.log('=' .repeat(50));
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
  });

  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  console.log(`\n📈 Overall: ${passedTests}/${totalTests} tests passed`);

  if (passedTests < totalTests) {
    console.log('\n⚠️  Some tests failed. Check the details above for troubleshooting.');
  } else {
    console.log('\n🎉 All tests passed! Your application is working correctly.');
  }
}

// Run the tests
runTests().catch(console.error);
