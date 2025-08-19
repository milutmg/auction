#!/usr/bin/env node

// Use server's database configuration
const db = require('./server/config/database');

async function setupNotifications() {
  console.log('🔧 Setting up notifications table...');
  
  try {
    // Check if table exists
    const checkResult = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'notifications'
      );
    `);
    
    if (checkResult.rows[0].exists) {
      console.log('✅ Notifications table already exists');
      return true;
    }
    
    // Create the table
    console.log('📝 Creating notifications table...');
    await db.query(`
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
    
    console.log('📝 Creating indexes...');
    await db.query(`
      CREATE INDEX idx_notifications_user_id ON notifications(user_id);
      CREATE INDEX idx_notifications_read ON notifications(read);
    `);
    
    console.log('✅ Notifications table created successfully!');
    return true;
    
  } catch (error) {
    console.error('❌ Error setting up notifications:', error.message);
    return false;
  } finally {
    process.exit(0);
  }
}

setupNotifications();
