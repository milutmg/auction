-- Basic Admin Features Setup
-- Only create essential admin tables

-- System settings table for configurable rules
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User suspensions tracking  
CREATE TABLE IF NOT EXISTS user_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    suspended_by UUID,
    reason TEXT NOT NULL,
    suspension_type VARCHAR(20) DEFAULT 'temporary',
    suspended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    lifted_at TIMESTAMP,
    lifted_by UUID,
    is_active BOOLEAN DEFAULT true
);

-- Auction quality metrics
CREATE TABLE IF NOT EXISTS auction_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID,
    image_quality_score INTEGER,
    description_completeness_score INTEGER,
    authenticity_confidence INTEGER,
    overall_quality_score DECIMAL(3,2),
    flagged_issues JSONB DEFAULT '[]',
    reviewed_by UUID,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email campaign tracking
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    created_by UUID,
    recipient_type VARCHAR(50) NOT NULL,
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    scheduled_at TIMESTAMP,
    sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('bidding_rules', '{
  "min_starting_bid": 1.00,
  "max_auction_duration_hours": 168,
  "min_bid_increment_percentage": 5,
  "auto_extend_minutes": 10,
  "payment_deadline_hours": 48,
  "max_bids_per_user_per_auction": 100,
  "bid_sniping_protection_minutes": 5
}', 'Global bidding rules and constraints')
ON CONFLICT (setting_key) DO NOTHING;
