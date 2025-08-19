const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function createTestUsers() {
  try {
    // Test user credentials (password: 'password123')
    const testPassword = 'password123';
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(testPassword, saltRounds);

    const testUsers = [
      {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: 'user'
      },
      {
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: 'admin'
      },
      {
        email: 'demo@auction.com',
        password: 'password123',
        fullName: 'Demo Bidder',
        role: 'user'
      }
    ];

    console.log('🔄 Creating/updating test users...');
    
    for (const user of testUsers) {
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Insert or update user
      await db.query(`
        INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified) 
        VALUES ($1, $2, $3, $4, true, true)
        ON CONFLICT (email) 
        DO UPDATE SET 
          password_hash = $2,
          full_name = $3,
          role = $4,
          is_active = true,
          is_verified = true,
          updated_at = CURRENT_TIMESTAMP
      `, [user.email, hashedPassword, user.fullName, user.role]);
      
      console.log(`✅ User created/updated: ${user.email}`);
    }

    console.log('\n🎉 Test users created successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('==================');
    testUsers.forEach(user => {
      console.log(`Email: ${user.email}`);
      console.log(`Password: ${user.password}`);
      console.log(`Role: ${user.role}`);
      console.log('---');
    });
    
    // Verify users can be authenticated
    console.log('\n🔍 Verifying users...');
    for (const user of testUsers) {
      const result = await db.query(
        'SELECT id, email, password_hash, full_name, role FROM users WHERE email = $1',
        [user.email]
      );
      
      if (result.rows.length > 0) {
        const dbUser = result.rows[0];
        const isValidPassword = await bcrypt.compare(user.password, dbUser.password_hash);
        console.log(`${user.email}: ${isValidPassword ? '✅ Password Valid' : '❌ Password Invalid'}`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
