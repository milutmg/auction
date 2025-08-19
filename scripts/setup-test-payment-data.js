const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'antique_auction',
  user: process.env.DB_USER || 'milan',
  password: process.env.DB_PASSWORD || 'password',
});

async function setupTestPaymentData() {
  try {
    console.log('Setting up test payment data...');

    // Get test user
    const userResult = await pool.query(
      "SELECT id FROM users WHERE email = 'user@example.com' LIMIT 1"
    );

    if (userResult.rows.length === 0) {
      console.log('Creating test user...');
      await pool.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified)
        VALUES ('user@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Test User', 'user', true, true)
      `);
    }

    const user = await pool.query("SELECT id FROM users WHERE email = 'user@example.com'");
    const userId = user.rows[0].id;

    // Create test auction
    const auctionResult = await pool.query(`
      INSERT INTO auctions (title, description, starting_bid, current_bid, status, seller_id, end_time, image_url)
      VALUES ('Vintage Pocket Watch', 'Beautiful antique pocket watch from 1920s', 150, 250, 'ended', $1, NOW() - INTERVAL '1 day', 'https://images.unsplash.com/photo-1509048191080-d2e2678e67b4?w=400')
      RETURNING id
    `, [userId]);

    const auctionId = auctionResult.rows[0].id;

    // Create winning bid
    await pool.query(`
      INSERT INTO bids (auction_id, bidder_id, amount)
      VALUES ($1, $2, 250)
    `, [auctionId, userId]);

    // Create payment transaction
    const transactionId = `test-${Date.now()}`;
    await pool.query(`
      INSERT INTO payment_transactions (auction_id, winner_id, transaction_id, amount, status)
      VALUES ($1, $2, $3, 250, 'pending')
    `, [auctionId, userId, transactionId]);

    // Create order
    await pool.query(`
      INSERT INTO orders (auction_id, winner_id, final_amount, status, payment_status, transaction_id)
      VALUES ($1, $2, 250, 'pending', 'pending', $3)
    `, [auctionId, userId, transactionId]);

    console.log('✅ Test payment data created successfully!');
    console.log(`User: user@example.com (password: password123)`);
    console.log(`Auction: ${auctionId}`);
    console.log(`Transaction: ${transactionId}`);

  } catch (error) {
    console.error('❌ Error setting up test data:', error);
  } finally {
    await pool.end();
  }
}

setupTestPaymentData();