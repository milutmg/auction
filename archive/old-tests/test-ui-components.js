#!/usr/bin/env node

const { default: fetch } = require('node-fetch');
const io = require('socket.io-client');

const API_BASE = 'http://localhost:3001/api';
const SOCKET_URL = 'http://localhost:3001';

// Test user credentials  
const TEST_USER = {
  email: 'testuser@test.com',
  password: 'TestPassword123!'
};

let userToken = '';
let socket;

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

async function login() {
  console.log('🔐 Logging in test user...');
  const result = await testRequest('POST', '/auth/signin', TEST_USER);
  
  if (result.ok && result.data.token) {
    userToken = result.data.token;
    console.log('✅ Login successful');
    return result.data.user;
  } else {
    console.log('❌ Login failed:', result.data?.error || result.error);
    return null;
  }
}

async function testNotifications() {
  console.log('\n🔔 Testing Notifications System...');
  
  // Login first
  const user = await login();
  if (!user) return;
  
  console.log(`📝 Testing notifications for user: ${user.email} (ID: ${user.id})`);
  
  // Connect to Socket.IO
  socket = io(SOCKET_URL, {
    auth: { token: userToken }
  });
  
  socket.on('connect', () => {
    console.log('✅ Socket connected:', socket.id);
    
    // Listen for notifications
    socket.on('newNotification', (notification) => {
      console.log('🔔 Real-time notification received:');
      console.log('   Type:', notification.type);
      console.log('   Title:', notification.title);
      console.log('   Message:', notification.message);
      console.log('   Time:', new Date(notification.created_at).toLocaleTimeString());
    });
  });
  
  socket.on('connect_error', (error) => {
    console.log('❌ Socket connection error:', error.message);
  });
  
  // Wait a moment for socket to connect
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Create a test notification via API
  console.log('\n📨 Creating test notification...');
  const notificationResult = await testRequest('POST', '/notifications', {
    type: 'info',
    title: 'Test Notification',
    message: 'This is a test notification to verify the real-time notification system is working!',
    user_id: user.id
  }, userToken);
  
  if (notificationResult.ok) {
    console.log('✅ Test notification created successfully');
  } else {
    console.log('❌ Failed to create notification:', notificationResult.data?.error);
  }
  
  // Get notifications via API
  console.log('\n📋 Fetching notifications...');
  const fetchResult = await testRequest('GET', '/notifications', null, userToken);
  
  if (fetchResult.ok) {
    console.log(`✅ Found ${fetchResult.data.length} notifications`);
    fetchResult.data.slice(0, 3).forEach((notif, index) => {
      console.log(`   ${index + 1}. ${notif.title} - ${notif.read ? 'Read' : 'Unread'}`);
    });
  } else {
    console.log('❌ Failed to fetch notifications:', fetchResult.data?.error);
  }
  
  // Keep alive for a few seconds to see real-time notifications
  console.log('\n⏱️  Waiting 5 seconds for real-time notifications...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  socket.disconnect();
  console.log('🔌 Socket disconnected');
}

// Test user profile dropdown by checking auth context
async function testUserProfile() {
  console.log('\n👤 Testing User Profile...');
  
  const user = await login();
  if (!user) return;
  
  console.log('✅ User profile data available:');
  console.log('   Name:', user.full_name);
  console.log('   Email:', user.email);
  console.log('   Role:', user.role || 'user');
  console.log('   ID:', user.id);
  
  // Test profile endpoint
  const profileResult = await testRequest('GET', '/auth/profile', null, userToken);
  
  if (profileResult.ok) {
    console.log('✅ Profile endpoint working');
  } else {
    console.log('❌ Profile endpoint failed:', profileResult.data?.error);
  }
}

async function main() {
  console.log('🧪 Testing Real-time Notifications & User Profile');
  console.log('='.repeat(55));
  
  await testNotifications();
  await testUserProfile();
  
  console.log('\n✨ Test complete!');
  console.log('\n🌐 Open http://localhost:8080 in your browser to test the UI components');
  console.log('   - Login and check the notification bell icon');
  console.log('   - Check the user profile dropdown in the top right');
  console.log('   - Test the logout functionality');
  
  process.exit(0);
}

main().catch(console.error);
