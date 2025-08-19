#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT || 5432,
});

async function runMigration() {
  console.log('🚀 Starting database migration for enhanced schema...');
  
  const client = await pool.connect();
  
  try {
    // Start transaction
    await client.query('BEGIN');
    
    console.log('📊 Reading enhanced schema file...');
    const schemaPath = path.join(__dirname, '../database/enhanced_schema.sql');
    const enhancedSchema = await fs.readFile(schemaPath, 'utf8');
    
    console.log('⚡ Applying enhanced schema changes...');
    
    // Execute the enhanced schema
    await client.query(enhancedSchema);
    
    console.log('✅ Enhanced schema applied successfully');
    
    // Verify that new tables and columns exist
    console.log('🔍 Verifying migration...');
    
    // Check if new columns exist
    const columnCheck = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name IN (
        'email_verified_at', 
        'profile_completion_percentage', 
        'marketing_emails',
        'preferred_language'
      )
      ORDER BY column_name;
    `);
    
    console.log('📋 New user columns:', columnCheck.rows);
    
    // Check if new tables exist
    const tableCheck = await client.query(`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user_activities', 'user_preferences', 'email_verifications')
      ORDER BY table_name;
    `);
    
    console.log('📋 New tables:', tableCheck.rows);
    
    // Check if functions exist
    const functionCheck = await client.query(`
      SELECT routine_name, routine_type 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_name IN (
        'calculate_profile_completion',
        'log_user_activity',
        'cleanup_expired_tokens'
      )
      ORDER BY routine_name;
    `);
    
    console.log('📋 New functions:', functionCheck.rows);
    
    // Update existing users' profile completion
    const updateResult = await client.query(`
      UPDATE users 
      SET profile_completion_percentage = calculate_profile_completion(id) 
      WHERE profile_completion_percentage IS NULL OR profile_completion_percentage = 0
    `);
    
    console.log(`✅ Updated profile completion for ${updateResult.rowCount} users`);
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('🎉 Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log(`   - Added ${columnCheck.rows.length} new columns to users table`);
    console.log(`   - Created ${tableCheck.rows.length} new tables`);
    console.log(`   - Created ${functionCheck.rows.length} new functions`);
    console.log(`   - Updated ${updateResult.rowCount} existing users`);
    
  } catch (error) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', error.message);
    console.error('🔄 Transaction rolled back');
    
    if (error.code) {
      console.error(`   Error Code: ${error.code}`);
    }
    if (error.detail) {
      console.error(`   Detail: ${error.detail}`);
    }
    
    process.exit(1);
  } finally {
    client.release();
  }
}

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  const client = await pool.connect();
  
  try {
    // Check if main schema exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'users'
    `);
    
    if (result.rows.length === 0) {
      throw new Error('Base schema not found. Please run the main schema.sql first.');
    }
    
    console.log('✅ Prerequisites met');
  } catch (error) {
    console.error('❌ Prerequisites not met:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🔧 Antique Bidderly Database Migration');
    console.log('=====================================\n');
    
    await checkPrerequisites();
    await runMigration();
    
  } catch (error) {
    console.error('💥 Migration script failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Migration interrupted');
  await pool.end();
  process.exit(0);
});

// Run the migration
if (require.main === module) {
  main();
}

module.exports = { runMigration, checkPrerequisites };
