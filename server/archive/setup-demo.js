require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function setupDemo() {
  try {
    console.log('🚀 Setting up admin panel demo...\n');

    // 1. Ensure test user exists
    const testUserEmail = 'testuser@example.com';
    const testUserResult = await db.query("SELECT id FROM users WHERE email = $1", [testUserEmail]);
    
    if (testUserResult.rows.length === 0) {
      const testHash = await bcrypt.hash('password123', 10);
      await db.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
        VALUES ($1, $2, 'Test User', 'user', true, true)
      `, [testUserEmail, testHash]);
      console.log('✅ Test user created: testuser@example.com / password123');
    } else {
      console.log('✅ Test user already exists');
    }

    // 2. Create pending auction for admin approval
    const testUser = await db.query("SELECT id FROM users WHERE email = $1", [testUserEmail]);
    const userId = testUser.rows[0].id;
    
    // Get a category ID
    const categoryResult = await db.query("SELECT id FROM categories WHERE name = 'Furniture' LIMIT 1");
    const categoryId = categoryResult.rows[0].id;
    
    // Delete existing test auctions first
    await db.query("DELETE FROM auctions WHERE title LIKE 'Test Admin%'");
    
    // Create new pending auction
    const auctionResult = await db.query(`
      INSERT INTO auctions (
        title, description, category_id, starting_bid, reserve_price,
        start_time, end_time, seller_id, approval_status, status
      ) VALUES (
        'Test Admin Auction - Pending Approval',
        'This auction is created for testing admin approval functionality. It should appear in the admin dashboard for approval.',
        $1,
        25.00,
        100.00,
        $2,
        $3,
        $4,
        'pending',
        'pending'
      ) RETURNING id, title
    `, [
      categoryId,
      new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      userId
    ]);
    
    console.log('✅ Pending auction created:', auctionResult.rows[0].title);

    // 3. Create another test auction for variety
    const ceramicsCategory = await db.query("SELECT id FROM categories WHERE name = 'Ceramics' LIMIT 1");
    const ceramicsCategoryId = ceramicsCategory.rows[0].id;
    
    await db.query(`
      INSERT INTO auctions (
        title, description, category_id, starting_bid, reserve_price,
        start_time, end_time, seller_id, approval_status, status
      ) VALUES (
        'Test Admin Auction - Victorian Vase',
        'Another test auction to demonstrate admin functionality',
        $1,
        40.00,
        200.00,
        $2,
        $3,
        $4,
        'pending',
        'pending'
      )
    `, [
      ceramicsCategoryId,
      new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
      new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      userId
    ]);
    
    console.log('✅ Second pending auction created');

    // 4. Check pending auctions count
    const pendingCount = await db.query("SELECT COUNT(*) as count FROM auctions WHERE approval_status = 'pending'");
    console.log(`✅ Total pending auctions: ${pendingCount.rows[0].count}`);

    console.log('\n🎯 Demo Setup Complete!');
    console.log('═════════════════════════════════════════════');
    console.log('🔑 Admin Login:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');
    console.log('');
    console.log('👤 Test User Login:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('📋 What to Test:');
    console.log('1. Login as admin and verify "Admin" button appears in navbar');
    console.log('2. Click "Admin" button to access admin dashboard');
    console.log('3. View pending auctions in admin panel');
    console.log('4. Test approve/reject auction functionality');
    console.log('5. Check other admin features (users, system stats, etc.)');
    console.log('6. Login as test user to create more auctions');

  } catch (error) {
    console.error('❌ Error setting up demo:', error);
  } finally {
    process.exit();
  }
}

setupDemo();
