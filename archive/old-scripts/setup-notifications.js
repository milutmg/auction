#!/usr/bin/env node
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'antique_auction',
  password: 'postgres',
  port: 5432,
});

async function createNotificationsTable() {
  console.log('🔧 Creating notifications table...');
  
  try {
    // First check if table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (checkTable.rows[0].exists) {
      console.log('✅ Notifications table already exists');
      
      // Check its structure
      const structure = await pool.query(`
        SELECT column_name, data_type, is_nullable 
        FROM information_schema.columns 
        WHERE table_name = 'notifications'
        ORDER BY ordinal_position;
      `);
      
      console.log('📋 Current table structure:');
      structure.rows.forEach(row => {
        console.log(`   - ${row.column_name}: ${row.data_type} (${row.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
      
      return true;
    }
    
    // Create the table
    await pool.query(`
      CREATE TABLE notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        auction_id INTEGER REFERENCES auctions(id) ON DELETE CASCADE,
        auction_title VARCHAR(255),
        read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Create indexes for better performance
    await pool.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_read ON notifications(read);
      CREATE INDEX idx_notifications_created_at ON notifications(created_at);
    `);
    
    console.log('✅ Notifications table created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Error creating notifications table:', error.message);
    return false;
  }
}

async function testNotificationOperations() {
  console.log('\n🧪 Testing notification operations...');
  
  try {
    // Get a test user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      console.log('❌ No users found for testing');
      return false;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`📝 Using test user ID: ${userId}`);
    
    // Create a test notification
    const insertResult = await pool.query(`
      INSERT INTO notifications (user_id, type, title, message)
      VALUES ($1, $2, $3, $4)
      RETURNING id, title, created_at
    `, [userId, 'test', 'Test Notification', 'This is a test notification']);
    
    console.log('✅ Test notification created:', insertResult.rows[0]);
    
    // Read the notification
    const selectResult = await pool.query(`
      SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [userId]);
    
    console.log('✅ Test notification retrieved:', selectResult.rows[0]);
    
    // Clean up test notification
    await pool.query('DELETE FROM notifications WHERE type = $1', ['test']);
    console.log('✅ Test notification cleaned up');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error testing notifications:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Notification Database Setup');
  console.log('================================');
  
  const tableCreated = await createNotificationsTable();
  
  if (tableCreated) {
    await testNotificationOperations();
  }
  
  await pool.end();
  console.log('\n✨ Database setup complete!');
}

main().catch(console.error);
