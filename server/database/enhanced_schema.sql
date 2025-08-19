-- Enhanced database schema for improved sign-up functionality
-- Run this after the main schema.sql

-- Add additional columns to users table for enhanced functionality
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMP,
ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(32),
ADD COLUMN IF NOT EXISTS profile_completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en',
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS marketing_emails BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS bidding_notifications BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS outbid_notifications BOOLEAN DEFAULT true;

-- Update existing users to have proper verification status
UPDATE users 
SET is_verified = true, 
    email_verified_at = created_at,
    profile_completion_percentage = 60
WHERE email_verified_at IS NULL;

-- Create improved indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email_verification ON users(email_verification_token);
CREATE INDEX IF NOT EXISTS idx_users_password_reset ON users(password_reset_token);
CREATE INDEX IF NOT EXISTS idx_users_locked ON users(locked_until);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified_at);

-- Add constraint to ensure email format
ALTER TABLE users ADD CONSTRAINT valid_email 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to ensure full_name is not just whitespace
ALTER TABLE users ADD CONSTRAINT valid_full_name 
CHECK (length(trim(full_name)) >= 2 AND length(trim(full_name)) <= 100);

-- User activity tracking table
CREATE TABLE IF NOT EXISTS user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL, -- 'login', 'logout', 'signup', 'password_change', etc.
    ip_address INET,
    user_agent TEXT,
    location_country VARCHAR(2),
    location_city VARCHAR(100),
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    theme VARCHAR(20) DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    currency VARCHAR(3) DEFAULT 'USD',
    bid_increment_preference DECIMAL(10,2) DEFAULT 1.00,
    auto_refresh_auctions BOOLEAN DEFAULT true,
    sound_notifications BOOLEAN DEFAULT true,
    desktop_notifications BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email verification table
CREATE TABLE IF NOT EXISTS email_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(user_id_param UUID)
RETURNS INTEGER AS $$
DECLARE
    completion_percentage INTEGER := 0;
    user_record RECORD;
BEGIN
    SELECT * INTO user_record FROM users WHERE id = user_id_param;
    
    IF user_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Base fields (40%)
    completion_percentage := completion_percentage + 20; -- email (always present)
    completion_percentage := completion_percentage + 20; -- full_name (always present)
    
    -- Additional fields
    IF user_record.avatar_url IS NOT NULL THEN
        completion_percentage := completion_percentage + 15;
    END IF;
    
    IF user_record.phone IS NOT NULL THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    IF user_record.address IS NOT NULL THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    IF user_record.is_verified = true THEN
        completion_percentage := completion_percentage + 15;
    END IF;
    
    -- Google account linked
    IF user_record.google_id IS NOT NULL THEN
        completion_percentage := completion_percentage + 10;
    END IF;
    
    -- Cap at 100%
    IF completion_percentage > 100 THEN
        completion_percentage := 100;
    END IF;
    
    RETURN completion_percentage;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile completion percentage
CREATE OR REPLACE FUNCTION update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.profile_completion_percentage := calculate_profile_completion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update profile completion
DROP TRIGGER IF EXISTS trigger_update_profile_completion ON users;
CREATE TRIGGER trigger_update_profile_completion
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_profile_completion();

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity(
    p_user_id UUID,
    p_activity_type VARCHAR(50),
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO user_activities (user_id, activity_type, ip_address, user_agent, details)
    VALUES (p_user_id, p_activity_type, p_ip_address, p_user_agent, p_details);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired tokens
CREATE OR REPLACE FUNCTION cleanup_expired_tokens()
RETURNS VOID AS $$
BEGIN
    -- Clean up email verification tokens
    DELETE FROM email_verifications WHERE expires_at < CURRENT_TIMESTAMP;
    
    -- Clean up password reset tokens
    UPDATE users 
    SET password_reset_token = NULL, 
        password_reset_expires = NULL 
    WHERE password_reset_expires < CURRENT_TIMESTAMP;
    
    -- Clean up email verification tokens in users table
    UPDATE users 
    SET email_verification_token = NULL 
    WHERE email_verification_token IS NOT NULL 
    AND created_at < CURRENT_TIMESTAMP - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_user_activities_user_type ON user_activities(user_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at);
CREATE INDEX IF NOT EXISTS idx_email_verifications_token ON email_verifications(token);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires ON email_verifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON user_preferences(user_id);

-- Insert default preferences for existing users
INSERT INTO user_preferences (user_id)
SELECT id FROM users
WHERE id NOT IN (SELECT user_id FROM user_preferences WHERE user_id IS NOT NULL)
ON CONFLICT (user_id) DO NOTHING;

-- Update profile completion for existing users
UPDATE users SET profile_completion_percentage = calculate_profile_completion(id);

-- Add trigger for user preferences updated_at
DROP TRIGGER IF EXISTS trigger_user_preferences_updated_at ON user_preferences;
CREATE TRIGGER trigger_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
