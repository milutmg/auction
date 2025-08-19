const bcrypt = require('bcrypt');
const db = require('./config/database');

async function resetAdminPassword() {
  try {
    // Hash the password admin123
    const passwordHash = await bcrypt.hash('admin123', 12);
    
    // Update admin user password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2',
      [passwordHash, 'admin@example.com']
    );
    
    console.log('✅ Admin password reset to: admin123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetAdminPassword();
