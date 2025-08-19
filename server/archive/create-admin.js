require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/database');

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await db.query("SELECT * FROM users WHERE role = 'admin'");
    
    if (existingAdmin.rows.length > 0) {
      console.log('Admin user already exists:', existingAdmin.rows[0].email);
      return;
    }

    // Create admin user
    const adminEmail = 'admin@auction.com';
    const adminPassword = 'admin123';
    const adminName = 'System Administrator';

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const result = await db.query(`
      INSERT INTO users (email, password_hash, full_name, role, is_active, email_verified)
      VALUES ($1, $2, $3, 'admin', true, true)
      RETURNING id, email, full_name, role
    `, [adminEmail, hashedPassword, adminName]);

    console.log('Admin user created successfully:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    console.log('User details:', result.rows[0]);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    process.exit();
  }
}

createAdminUser();
