#!/usr/bin/env node

const { default: fetch } = require('node-fetch');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001/api';

const TEST_USER = {
  email: 'testuser@test.com',
  password: 'TestPassword123!'
};

async function testNotificationSystem() {
  console.log('🔔 Testing Real-time Notification System');
  console.log('=' .repeat(50));

  // 1. Login user to get token
  console.log('\n👤 Logging in user...');
  const loginResponse = await fetch(`${API_BASE}/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(TEST_USER)
  });

  if (!loginResponse.ok) {
    console.log('❌ Login failed');
    return;
  }

  const { token, user } = await loginResponse.json();
  console.log(`✅ User logged in: ${user.full_name} (${user.id})`);

  // 2. Connect to Socket.IO
  console.log('\n🔌 Connecting to Socket.IO...');
  const socket = io('http://localhost:3001');

  socket.on('connect', () => {
    console.log(`✅ Socket connected: ${socket.id}`);
    
    // 3. Listen for notifications
    socket.on('new-notification', (notificationData) => {
      console.log('🔔 Real-time notification received:', {
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        userId: notificationData.userId,
        auction_id: notificationData.auction_id
      });
    });

    // 4. Simulate a bid to trigger notification
    setTimeout(() => {
      console.log('\n💰 Simulating bid to trigger notification...');
      socket.emit('new-bid', {
        auctionId: '00b0b36a-e8ea-42f5-b13b-81cc6fe44611', // Use existing auction
        userId: 'test-notif-user',
        amount: 40,
        bidderName: 'Notification Test User',
        timestamp: new Date().toISOString()
      });
    }, 1000);

    // 5. Test notification API endpoint
    setTimeout(async () => {
      console.log('\n📊 Testing notification API...');
      try {
        const notifResponse = await fetch(`${API_BASE}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (notifResponse.ok) {
          const notifications = await notifResponse.json();
          console.log(`✅ Found ${notifications.length} notifications via API`);
          if (notifications.length > 0) {
            console.log('   Latest notification:', {
              type: notifications[0].type,
              title: notifications[0].title,
              read: notifications[0].read
            });
          }
        } else {
          console.log('❌ Notification API failed');
        }
      } catch (error) {
        console.log('❌ Notification API error:', error.message);
      }
      
      socket.disconnect();
      console.log('\n🎯 Notification test completed');
    }, 3000);
  });

  socket.on('connect_error', (error) => {
    console.log('❌ Socket connection error:', error.message);
  });
}

testNotificationSystem().catch(console.error);
