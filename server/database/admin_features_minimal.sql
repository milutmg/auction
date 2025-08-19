-- Minimal Admin Features Migration
-- Only create new tables, don't modify existing ones

-- System settings table for configurable rules
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User suspensions tracking
CREATE TABLE IF NOT EXISTS user_suspensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    suspended_by UUID REFERENCES users(id),
    reason TEXT NOT NULL,
    suspension_type VARCHAR(20) DEFAULT 'temporary' CHECK (suspension_type IN ('temporary', 'permanent')),
    suspended_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    lifted_at TIMESTAMP,
    lifted_by UUID REFERENCES users(id),
    is_active BOOLEAN DEFAULT true
);

-- Auction quality metrics
CREATE TABLE IF NOT EXISTS auction_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    image_quality_score INTEGER CHECK (image_quality_score >= 1 AND image_quality_score <= 10),
    description_completeness_score INTEGER CHECK (description_completeness_score >= 1 AND description_completeness_score <= 10),
    authenticity_confidence INTEGER CHECK (authenticity_confidence >= 1 AND authenticity_confidence <= 10),
    overall_quality_score DECIMAL(3,2),
    flagged_issues JSONB DEFAULT '[]',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bidding analytics table
CREATE TABLE IF NOT EXISTS bidding_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    bid_pattern_score DECIMAL(3,2), -- Suspicious activity score (0-1)
    bid_frequency INTEGER DEFAULT 0,
    bid_timing_pattern VARCHAR(50), -- 'normal', 'sniping', 'suspicious'
    ip_address INET,
    user_agent TEXT,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(auction_id, user_id)
);

-- Financial tracking for admin reports
CREATE TABLE IF NOT EXISTS financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id),
    order_id UUID REFERENCES orders(id),
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'commission', 'refund', 'chargeback'
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'NPR',
    commission_rate DECIMAL(5,4) DEFAULT 0.10,
    commission_amount DECIMAL(10,2),
    payment_processor VARCHAR(50), -- 'esewa', 'khalti', 'bank_transfer'
    processor_fee DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email campaign tracking
CREATE TABLE IF NOT EXISTS email_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    template_id VARCHAR(100),
    created_by UUID REFERENCES users(id),
    recipient_type VARCHAR(50) NOT NULL, -- 'all', 'active_bidders', 'sellers', 'specific'
    recipient_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled')),
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
}', 'Global bidding rules and constraints'),
('commission_rates', '{
  "default_rate": 0.10,
  "premium_seller_rate": 0.08,
  "high_value_rate": 0.12,
  "threshold_amounts": {
    "premium_seller": 10000,
    "high_value": 50000
  }
}', 'Commission rates for different seller tiers')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_quality_metrics_auction ON auction_quality_metrics(auction_id);
CREATE INDEX IF NOT EXISTS idx_bidding_analytics_auction_user ON bidding_analytics(auction_id, user_id);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
