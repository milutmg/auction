const fetch = require('node-fetch');

const API_BASE = 'http://localhost:3001/api';

// Create test user and auction to demo admin functionality
async function createDemoData() {
  try {
    console.log('🚀 Creating demo data for admin testing...\n');

    // 1. Create a test user
    console.log('1️⃣ Creating test user...');
    const userResponse = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123',
        fullName: 'Test User'
      })
    });

    if (userResponse.ok) {
      console.log('✅ Test user created: testuser@example.com');
    } else {
      console.log('ℹ️ Test user might already exist');
    }

    // 2. Sign in as test user to get token
    console.log('\n2️⃣ Signing in as test user...');
    const signinResponse = await fetch(`${API_BASE}/auth/signin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'testuser@example.com',
        password: 'password123'
      })
    });

    if (!signinResponse.ok) {
      throw new Error('Failed to sign in test user');
    }

    const signinData = await signinResponse.json();
    const userToken = signinData.token;
    console.log('✅ Test user signed in successfully');

    // 3. Create auction as test user (will be in pending status)
    console.log('\n3️⃣ Creating test auction...');
    const auctionResponse = await fetch(`${API_BASE}/auctions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({
        title: 'Vintage Victorian Tea Set',
        description: 'Beautiful antique tea set from the Victorian era, complete with ornate patterns and gold trim.',
        category: 'Ceramics & Glassware',
        starting_bid: 50.00,
        reserve_price: 150.00,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        condition: 'Excellent',
        dimensions: '12x8x6 inches',
        provenance: 'Estate collection'
      })
    });

    let auctionData;
    if (auctionResponse.ok) {
      auctionData = await auctionResponse.json();
      console.log('✅ Test auction created:', auctionData.title);
    } else {
      console.log('⚠️ Could not create auction, might already exist');
    }

    console.log('\n🎯 Demo Setup Complete!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('🔐 Admin Login Credentials:');
    console.log('   Email: admin@example.com');
    console.log('   Password: (check database or use existing password)');
    console.log('');
    console.log('👤 Test User Credentials:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('🌐 Application URLs:');
    console.log('   Frontend: http://localhost:8080');
    console.log('   Backend API: http://localhost:3001');
    console.log('');
    console.log('🧪 Testing Instructions:');
    console.log('1. Go to http://localhost:8080/auth');
    console.log('2. Sign in as admin@example.com');
    console.log('3. You should see "Admin" button in navbar');
    console.log('4. Click "Admin" to access admin panel');
    console.log('5. You should see pending auction for approval');
    console.log('6. Test approving/rejecting auctions');
    console.log('7. Sign out and sign in as testuser@example.com');
    console.log('8. Create more auctions to test the workflow');
    console.log('');

  } catch (error) {
    console.error('❌ Error creating demo data:', error.message);
  }
}

createDemoData();
