const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'antique_bidderly',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupPaymentDemo() {
  console.log('🔧 Setting up eSewa Payment Demo...\n');

  try {
    // Check if test user exists
    console.log('1. Checking test user...');
    const userResult = await pool.query(
      'SELECT id, email, full_name FROM users WHERE email = $1',
      ['test@example.com']
    );

    if (userResult.rows.length === 0) {
      console.log('   ⚠️  Test user not found. Creating user...');
      
      // Create test user
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      await pool.query(
        'INSERT INTO users (email, password, full_name, role) VALUES ($1, $2, $3, $4)',
        ['test@example.com', hashedPassword, 'Test User', 'user']
      );
      console.log('   ✅ Test user created');
    } else {
      console.log('   ✅ Test user exists:', userResult.rows[0].full_name);
    }

    // Check for existing auctions
    console.log('\n2. Checking available auctions...');
    const auctionsResult = await pool.query(
      "SELECT id, title, current_bid, status FROM auctions WHERE status IN ('active', 'scheduled') LIMIT 5"
    );

    if (auctionsResult.rows.length === 0) {
      console.log('   ⚠️  No active auctions found');
      console.log('   💡 You may need to create auctions for testing');
    } else {
      console.log('   ✅ Available auctions:');
      auctionsResult.rows.forEach(auction => {
        console.log(`      - ${auction.title} (Current bid: $${auction.current_bid})`);
      });
    }

    // Check for existing orders
    console.log('\n3. Checking existing orders...');
    const ordersResult = await pool.query(
      'SELECT COUNT(*) as count FROM orders'
    );
    console.log(`   📋 Total orders in system: ${ordersResult.rows[0].count}`);

    console.log('\n✅ Demo setup complete!');
    console.log('\n🎯 Next Steps:');
    console.log('   1. Open http://localhost:8080');
    console.log('   2. Click "Login" and use test@example.com / password123');
    console.log('   3. Browse auctions and place bids');
    console.log('   4. Win an auction to create an order');
    console.log('   5. Test eSewa payment');

  } catch (error) {
    console.error('Demo setup error:', error.message);
    console.log('\n⚠️  Make sure your database is running and configured correctly');
  } finally {
    await pool.end();
  }
}

// Run setup
setupPaymentDemo();
