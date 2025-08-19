const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'antique_auction',
  user: 'milan',
  password: 'password'
});

(async () => {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await pool.query(`
      INSERT INTO users (email, password_hash, full_name, role, created_at, updated_at)
      VALUES ('admin@test.com', $1, 'Admin User', 'admin', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
    `, [hashedPassword]);
    console.log('✅ Admin created: admin@test.com / admin123');
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
