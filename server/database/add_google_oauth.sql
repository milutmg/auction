-- Add Google OAuth support to users table
-- Migration: Add google_id column and make password_hash optional

-- Add google_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255) UNIQUE;

-- Make password_hash optional (for users who sign up with Google)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index on google_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Update the table comment
COMMENT ON COLUMN users.google_id IS 'Google OAuth user ID for users who sign up with Google';
COMMENT ON COLUMN users.password_hash IS 'Password hash - can be null for OAuth users';
