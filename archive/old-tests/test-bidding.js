#!/usr/bin/env node

const { default: fetch } = require('node-fetch');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001/api';

// Test configurations
const ADMIN_CREDENTIALS = {
  email: 'admin@example.com',
  password: 'admin123'
};

const TEST_USER = {
  email: 'testuser@test.com',
  password: 'TestPassword123!'
};

let adminToken = '';
let userToken = '';
let testAuctionId = '';

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

async function testBiddingWorkflow() {
  console.log('🧪 Testing Live Bidding Workflow');
  console.log('=' .repeat(50));

  // 1. Login as admin
  console.log('\n🔐 Admin Login...');
  const adminLogin = await testRequest('POST', '/auth/signin', ADMIN_CREDENTIALS);
  if (!adminLogin.ok) {
    console.log('❌ Admin login failed');
    return;
  }
  adminToken = adminLogin.data.token;
  console.log('✅ Admin logged in');

  // 2. Login as user
  console.log('\n👤 User Login...');
  const userLogin = await testRequest('POST', '/auth/signin', TEST_USER);
  if (!userLogin.ok) {
    console.log('❌ User login failed');
    return;
  }
  userToken = userLogin.data.token;
  console.log('✅ User logged in');

  // 3. Get pending auctions
  console.log('\n📋 Getting pending auctions...');
  const pendingAuctions = await testRequest('GET', '/admin/auctions/pending', null, adminToken);
  if (!pendingAuctions.ok || pendingAuctions.data.length === 0) {
    console.log('❌ No pending auctions found for testing');
    return;
  }
  
  testAuctionId = pendingAuctions.data[0].id;
  console.log(`✅ Found pending auction: ${pendingAuctions.data[0].title} (${testAuctionId})`);

  // 4. Approve the auction
  console.log('\n✅ Approving auction...');
  const approveResult = await testRequest('POST', `/admin/auction/${testAuctionId}/approve`, {
    approvalStatus: 'approved'
  }, adminToken);
  
  if (!approveResult.ok) {
    console.log('❌ Failed to approve auction:', approveResult.data?.error);
    return;
  }
  console.log('✅ Auction approved');

  // 5. Set auction status to active
  console.log('\n🎯 Activating auction...');
  // We need to manually update the status since the approval doesn't automatically set it to active
  // This is a gap in the current workflow that should be fixed
  
  // 6. Test socket connection and bidding
  console.log('\n🔌 Testing live bidding with Socket.IO...');
  
  await testSocketBidding();
  
  // 7. Test API bid placement
  console.log('\n💰 Testing API bid placement...');
  const bidResult = await testRequest('POST', '/bids', {
    auctionId: testAuctionId,
    amount: 60
  }, userToken);
  
  if (bidResult.ok) {
    console.log('✅ API bid placed successfully');
    console.log(`   Bid: $${bidResult.data.bid.amount} by ${bidResult.data.bid.bidder_name}`);
  } else {
    console.log('❌ API bid failed:', bidResult.data?.error);
  }

  // 8. Verify auction current bid updated
  console.log('\n🔍 Verifying auction current bid...');
  const auctionResult = await testRequest('GET', `/auctions/${testAuctionId}`);
  if (auctionResult.ok) {
    console.log(`✅ Current bid: $${auctionResult.data.current_bid}`);
  } else {
    console.log('❌ Failed to get auction details');
  }
}

async function testSocketBidding() {
  return new Promise((resolve) => {
    const socket = io('http://localhost:3001');
    let bidReceived = false;

    const timeout = setTimeout(() => {
      if (!bidReceived) {
        console.log('❌ Socket bidding timeout');
      }
      socket.disconnect();
      resolve();
    }, 10000);

    socket.on('connect', () => {
      console.log('✅ Socket connected for bidding test');
      
      // Join auction room
      socket.emit('join-auction', testAuctionId);
      
      // Listen for bid updates
      socket.on('bid-update', (data) => {
        console.log('✅ Real-time bid received:', data);
        bidReceived = true;
        clearTimeout(timeout);
        socket.disconnect();
        resolve();
      });

      // Wait a moment then place a bid via socket
      setTimeout(() => {
        socket.emit('new-bid', {
          auctionId: testAuctionId,
          userId: 'test-user-id',
          amount: 55,
          bidderName: 'Socket Test User',
          timestamp: new Date().toISOString()
        });
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      console.log('❌ Socket connection error:', error.message);
      clearTimeout(timeout);
      resolve();
    });
  });
}

// Run the test
testBiddingWorkflow().catch(console.error);
