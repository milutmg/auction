const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'antique_auction',
  user: process.env.DB_USER || 'milan',
  password: process.env.DB_PASSWORD || 'password'
});

async function createAdmin() {
  console.log('🔧 Creating Admin User...');
  
  const adminData = {
    email: 'admin@antique-bidderly.com',
    password: 'admin123',
    full_name: 'System Administrator',
    phone_number: '+1234567890',
    role: 'admin'
  };

  try {
    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT id, email FROM users WHERE email = $1',
      [adminData.email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('   ✅ Admin user already exists:', adminData.email);
      console.log('   📧 Email:', adminData.email);
      console.log('   🔑 Password: admin123');
      return;
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminData.password, saltRounds);

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, phone_number, role, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, email, role`,
      [adminData.email, hashedPassword, adminData.full_name, adminData.phone_number, adminData.role]
    );

    console.log('   ✅ Admin user created successfully!');
    console.log('   📧 Email:', result.rows[0].email);
    console.log('   🔑 Password: admin123');
    console.log('   👤 Role:', result.rows[0].role);
    console.log('   🆔 ID:', result.rows[0].id);

  } catch (error) {
    console.error('   ❌ Error creating admin user:', error.message);
  } finally {
    await pool.end();
  }
}

createAdmin();
