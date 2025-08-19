// Test admin functionality without running server
require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function testAdminSetup() {
  try {
    console.log('🧪 Testing Admin Panel Setup...\n');

    // 1. Check admin user exists
    console.log('1️⃣ Checking admin user...');
    const adminQuery = await db.query("SELECT id, email, full_name, role FROM users WHERE role = 'admin'");
    
    if (adminQuery.rows.length === 0) {
      console.log('❌ No admin user found!');
      console.log('Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
        VALUES ('admin@example.com', $1, 'Admin User', 'admin', true, true)
      `, [hashedPassword]);
      
      console.log('✅ Admin user created: admin@example.com / admin123');
    } else {
      console.log('✅ Admin user found:', adminQuery.rows[0]);
    }

    // 2. Test password for existing admin (try common passwords)
    console.log('\n2️⃣ Testing admin password...');
    const admin = adminQuery.rows[0] || (await db.query("SELECT id, email, password_hash FROM users WHERE role = 'admin'")).rows[0];
    
    const commonPasswords = ['admin123', 'password', 'admin', '123456'];
    let validPassword = null;
    
    for (const pwd of commonPasswords) {
      const isValid = await bcrypt.compare(pwd, admin.password_hash);
      if (isValid) {
        validPassword = pwd;
        break;
      }
    }
    
    if (validPassword) {
      console.log(`✅ Found working password: ${validPassword}`);
    } else {
      console.log('⚠️ None of the common passwords work. Updating password to admin123...');
      const newHash = await bcrypt.hash('admin123', 10);
      await db.query('UPDATE users SET password_hash = $1 WHERE role = $2', [newHash, 'admin']);
      console.log('✅ Password updated to: admin123');
    }

    // 3. Create test user for auction creation
    console.log('\n3️⃣ Creating test user...');
    const testUserResult = await db.query("SELECT id FROM users WHERE email = 'testuser@example.com'");
    
    if (testUserResult.rows.length === 0) {
      const testHash = await bcrypt.hash('password123', 10);
      await db.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
        VALUES ('testuser@example.com', $1, 'Test User', 'user', true, true)
      `, [testHash]);
      console.log('✅ Test user created: testuser@example.com / password123');
    } else {
      console.log('✅ Test user already exists');
    }

    // 4. Create pending auction for testing admin approval
    console.log('\n4️⃣ Creating pending auction...');
    const testUser = await db.query("SELECT id FROM users WHERE email = 'testuser@example.com'");
    const userId = testUser.rows[0].id;
    
    const existingAuction = await db.query("SELECT id FROM auctions WHERE title = 'Test Admin Auction'");
    
    if (existingAuction.rows.length === 0) {
      await db.query(`
        INSERT INTO auctions (
          title, description, category, starting_bid, reserve_price,
          start_time, end_time, seller_id, approval_status, status,
          condition, dimensions, provenance
        ) VALUES (
          'Test Admin Auction',
          'This auction is created for testing admin approval functionality',
          'Test Category',
          25.00,
          100.00,
          $1,
          $2,
          $3,
          'pending',
          'draft',
          'Good',
          '10x10x10 cm',
          'Test provenance'
        )
      `, [
        new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        userId
      ]);
      console.log('✅ Pending auction created for admin testing');
    } else {
      console.log('✅ Test auction already exists');
    }

    // 5. Check database tables needed for admin functionality
    console.log('\n5️⃣ Verifying database tables...');
    const tables = ['users', 'auctions', 'bids', 'admin_actions'];
    
    for (const table of tables) {
      try {
        const result = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`   ${table}: ${result.rows[0].count} records`);
      } catch (error) {
        console.log(`   ${table}: table may not exist - ${error.message}`);
      }
    }

    console.log('\n🎯 Setup Complete! Here\'s what you need to test:');
    console.log('═════════════════════════════════════════════════════════════');
    console.log('🖥️ Frontend: http://localhost:8080 (or current Vite port)');
    console.log('🔧 Backend: http://localhost:3001');
    console.log('');
    console.log('🔑 Admin Credentials:');
    console.log('   Email: admin@example.com');
    console.log(`   Password: ${validPassword || 'admin123'}`);
    console.log('');
    console.log('👤 Test User Credentials:');
    console.log('   Email: testuser@example.com');
    console.log('   Password: password123');
    console.log('');
    console.log('📝 Testing Steps:');
    console.log('1. Make sure both server and client are running');
    console.log('2. Go to frontend URL and click "Sign In"');
    console.log('3. Login as admin user');
    console.log('4. Look for "Admin" button in top right navigation');
    console.log('5. Click "Admin" to access admin dashboard');
    console.log('6. You should see pending auction waiting for approval');
    console.log('7. Test approve/reject functionality');
    console.log('8. Test other admin features (user management, reports, etc.)');
    
    console.log('\n🔍 If admin panel still not visible:');
    console.log('- Check browser console for JavaScript errors');
    console.log('- Verify the user role is correctly set to "admin"');
    console.log('- Check if ProtectedRoute component is working');
    console.log('- Ensure JWT token includes correct role information');

  } catch (error) {
    console.error('❌ Error during admin setup test:', error);
  } finally {
    process.exit();
  }
}

testAdminSetup();
