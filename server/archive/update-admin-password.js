require('dotenv').config();
const db = require('./config/database');
const bcrypt = require('bcryptjs');

async function updateAdminPassword() {
  try {
    console.log('Updating admin password...');
    
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.query(
      "UPDATE users SET password_hash = $1 WHERE role = 'admin' RETURNING email",
      [hashedPassword]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Admin password updated successfully');
      console.log('Email:', result.rows[0].email);
      console.log('Password:', password);
    } else {
      console.log('❌ No admin user found');
    }
    
  } catch (error) {
    console.error('Error updating password:', error);
  } finally {
    process.exit();
  }
}

updateAdminPassword();
