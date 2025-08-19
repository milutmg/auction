-- Add admin-configurable columns to auctions table
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS min_bid_increment DECIMAL(10,2) DEFAULT 5.00,
ADD COLUMN IF NOT EXISTS auto_extend_minutes INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS payment_deadline_hours INTEGER DEFAULT 48;

-- Create bidding_rules table for platform-wide settings
CREATE TABLE IF NOT EXISTS bidding_rules (
  id SERIAL PRIMARY KEY,
  min_starting_bid DECIMAL(10,2) DEFAULT 10.00,
  max_starting_bid DECIMAL(10,2) DEFAULT 10000.00,
  default_duration_hours INTEGER DEFAULT 168, -- 7 days
  min_bid_increment DECIMAL(10,2) DEFAULT 5.00,
  auto_extend_minutes INTEGER DEFAULT 10,
  payment_deadline_hours INTEGER DEFAULT 48,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default bidding rules
INSERT INTO bidding_rules (min_starting_bid, max_starting_bid, default_duration_hours, min_bid_increment, auto_extend_minutes, payment_deadline_hours)
VALUES (10.00, 10000.00, 168, 5.00, 10, 48)
ON CONFLICT DO NOTHING;

-- Create admin_actions table for logging admin activities
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL, -- 'auction', 'user', 'bid', 'system', etc.
  target_id TEXT, -- Can be UUID or other identifier
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for admin_actions
CREATE INDEX IF NOT EXISTS idx_admin_actions_admin_id ON admin_actions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_actions_target_type ON admin_actions(target_type);
CREATE INDEX IF NOT EXISTS idx_admin_actions_created_at ON admin_actions(created_at);

-- Add admin approval tracking to auctions
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Create platform_settings table for flexible admin configurations
CREATE TABLE IF NOT EXISTS platform_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add trigger for platform_settings updated_at
CREATE OR REPLACE FUNCTION update_platform_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_platform_settings_updated_at 
    BEFORE UPDATE ON platform_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_platform_settings_updated_at();

-- Insert default platform settings
INSERT INTO platform_settings (key, value, category, description) VALUES
('bidding_rules', '{"min_starting_bid": 10, "max_starting_bid": 10000, "default_duration_hours": 168, "min_bid_increment": 5, "auto_extend_minutes": 10, "payment_deadline_hours": 48}', 'bidding', 'Default bidding rules for the platform'),
('fee_structure', '{"listing_fee": 0, "success_fee_percentage": 10, "payment_processing_fee": 2.9}', 'financial', 'Platform fee structure'),
('moderation_settings', '{"auto_approve_trusted_sellers": false, "require_admin_approval": true, "max_images_per_listing": 10}', 'moderation', 'Content moderation settings')
ON CONFLICT (key) DO NOTHING;

-- Add user suspension tracking
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- Create user activity tracking view
CREATE OR REPLACE VIEW user_activity_stats AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.role,
  u.is_active,
  u.created_at,
  COALESCE(bid_stats.total_bids, 0) as total_bids,
  COALESCE(bid_stats.total_spent, 0) as total_spent,
  COALESCE(auction_stats.total_auctions, 0) as total_auctions,
  COALESCE(auction_stats.total_earned, 0) as total_earned
FROM users u
LEFT JOIN (
  SELECT 
    b.bidder_id,
    COUNT(*) as total_bids,
    SUM(CASE WHEN b.amount = a.current_bid AND a.status = 'ended' THEN b.amount ELSE 0 END) as total_spent
  FROM bids b
  LEFT JOIN auctions a ON b.auction_id = a.id
  GROUP BY b.bidder_id
) bid_stats ON u.id = bid_stats.bidder_id
LEFT JOIN (
  SELECT 
    a.seller_id,
    COUNT(*) as total_auctions,
    SUM(CASE WHEN a.status = 'ended' THEN a.current_bid ELSE 0 END) as total_earned
  FROM auctions a
  GROUP BY a.seller_id
) auction_stats ON u.id = auction_stats.seller_id;
