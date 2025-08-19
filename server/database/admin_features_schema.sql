-- Enhanced Admin Features Database Schema
-- Additional tables and columns for comprehensive admin dashboard

-- Add admin feedback and quality scoring to auctions (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='admin_feedback') THEN
        ALTER TABLE auctions ADD COLUMN admin_feedback TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='quality_score') THEN
        ALTER TABLE auctions ADD COLUMN quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 10);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='auctions' AND column_name='review_priority') THEN
        ALTER TABLE auctions ADD COLUMN review_priority VARCHAR(20) DEFAULT 'normal' CHECK (review_priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END
$$;

-- Enhanced reports table with resolution details (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='resolution') THEN
        ALTER TABLE reports ADD COLUMN resolution TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='action_taken') THEN
        ALTER TABLE reports ADD COLUMN action_taken TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='compensation') THEN
        ALTER TABLE reports ADD COLUMN compensation DECIMAL(10,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='reports' AND column_name='priority') THEN
        ALTER TABLE reports ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
END
$$;

-- System settings table for configurable rules
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by UUID REFERENCES users(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced notifications with priority and email tracking (only if columns don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='priority') THEN
        ALTER TABLE notifications ADD COLUMN priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='email_sent') THEN
        ALTER TABLE notifications ADD COLUMN email_sent BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='email_sent_at') THEN
        ALTER TABLE notifications ADD COLUMN email_sent_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='notifications' AND column_name='read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at TIMESTAMP;
    END IF;
END
$$;

-- User ban/suspension tracking
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
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Admin dashboard widgets configuration
CREATE TABLE IF NOT EXISTS admin_widgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB DEFAULT '{}',
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 1,
    height INTEGER DEFAULT 1,
    is_visible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Audit log for sensitive operations
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    risk_level VARCHAR(20) DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
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
}', 'Commission rates for different seller tiers'),
('moderation_settings', '{
  "auto_approval_threshold": 8,
  "manual_review_threshold": 6,
  "auto_reject_threshold": 3,
  "require_manual_review_for_high_value": true,
  "high_value_threshold": 25000
}', 'Automated moderation thresholds'),
('notification_settings', '{
  "email_enabled": true,
  "sms_enabled": false,
  "push_enabled": true,
  "batch_size": 100,
  "rate_limit_per_hour": 1000
}', 'Notification system configuration')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_auction_quality_metrics_auction ON auction_quality_metrics(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_quality_metrics_score ON auction_quality_metrics(overall_quality_score);
CREATE INDEX IF NOT EXISTS idx_bidding_analytics_auction_user ON bidding_analytics(auction_id, user_id);
CREATE INDEX IF NOT EXISTS idx_bidding_analytics_pattern ON bidding_analytics(bid_pattern_score);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_user ON user_suspensions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_suspensions_active ON user_suspensions(is_active);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_risk ON audit_log(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);

-- Function to calculate auction quality score
CREATE OR REPLACE FUNCTION calculate_auction_quality_score(auction_id_param UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    quality_record RECORD;
    final_score DECIMAL(3,2) := 0.0;
BEGIN
    SELECT * INTO quality_record 
    FROM auction_quality_metrics 
    WHERE auction_id = auction_id_param;
    
    IF quality_record IS NOT NULL THEN
        -- Calculate weighted average
        final_score := (
            quality_record.image_quality_score * 0.3 +
            quality_record.description_completeness_score * 0.4 +
            quality_record.authenticity_confidence * 0.3
        ) / 10.0;
    END IF;
    
    RETURN final_score;
END;
$$ LANGUAGE plpgsql;

-- Function to detect suspicious bidding patterns
CREATE OR REPLACE FUNCTION analyze_bidding_pattern(user_id_param UUID, auction_id_param UUID)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    bid_count INTEGER;
    time_pattern VARCHAR(50) := 'normal';
    suspicion_score DECIMAL(3,2) := 0.0;
BEGIN
    -- Count bids by this user on this auction
    SELECT COUNT(*) INTO bid_count
    FROM bids
    WHERE bidder_id = user_id_param AND auction_id = auction_id_param;
    
    -- Check for excessive bidding
    IF bid_count > 20 THEN
        suspicion_score := suspicion_score + 0.3;
    END IF;
    
    -- Check for bid sniping pattern (bids in last 5 minutes)
    IF EXISTS (
        SELECT 1 FROM bids b
        JOIN auctions a ON b.auction_id = a.id
        WHERE b.bidder_id = user_id_param 
        AND b.auction_id = auction_id_param
        AND b.created_at > a.end_time - INTERVAL '5 minutes'
    ) THEN
        suspicion_score := suspicion_score + 0.2;
        time_pattern := 'sniping';
    END IF;
    
    -- Check for rapid successive bids
    IF EXISTS (
        SELECT 1 FROM bids b1
        JOIN bids b2 ON b1.auction_id = b2.auction_id
        WHERE b1.bidder_id = user_id_param 
        AND b2.bidder_id = user_id_param
        AND b1.auction_id = auction_id_param
        AND b2.created_at - b1.created_at < INTERVAL '30 seconds'
    ) THEN
        suspicion_score := suspicion_score + 0.3;
    END IF;
    
    -- Update or insert analysis
    INSERT INTO bidding_analytics (auction_id, user_id, bid_pattern_score, bid_frequency, bid_timing_pattern)
    VALUES (auction_id_param, user_id_param, suspicion_score, bid_count, time_pattern)
    ON CONFLICT (auction_id, user_id) 
    DO UPDATE SET 
        bid_pattern_score = suspicion_score,
        bid_frequency = bid_count,
        bid_timing_pattern = time_pattern,
        calculated_at = CURRENT_TIMESTAMP;
    
    RETURN suspicion_score;
END;
$$ LANGUAGE plpgsql;

-- Trigger to log high-risk admin actions
CREATE OR REPLACE FUNCTION log_high_risk_action()
RETURNS TRIGGER AS $$
BEGIN
    -- Log certain admin actions as high-risk
    IF NEW.action IN ('delete_auction', 'suspend_user', 'delete_suspicious_bid', 'resolve_dispute') THEN
        INSERT INTO audit_log (admin_id, action, resource_type, resource_id, new_values, risk_level)
        VALUES (NEW.admin_id, NEW.action, NEW.target_type, NEW.target_id::UUID, NEW.details, 'high');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for admin actions
DROP TRIGGER IF EXISTS trigger_log_high_risk_admin_action ON admin_actions;
CREATE TRIGGER trigger_log_high_risk_admin_action
    AFTER INSERT ON admin_actions
    FOR EACH ROW
    EXECUTE FUNCTION log_high_risk_action();

-- Function to automatically suspend users with high suspicion scores
CREATE OR REPLACE FUNCTION auto_suspend_suspicious_users()
RETURNS VOID AS $$
BEGIN
    -- Find users with consistently high suspicion scores
    INSERT INTO user_suspensions (user_id, reason, suspension_type, suspended_by)
    SELECT DISTINCT 
        ba.user_id,
        'Automatically suspended due to suspicious bidding patterns',
        'temporary',
        (SELECT id FROM users WHERE role = 'admin' LIMIT 1)
    FROM bidding_analytics ba
    WHERE ba.bid_pattern_score > 0.7
    AND ba.calculated_at > NOW() - INTERVAL '24 hours'
    AND NOT EXISTS (
        SELECT 1 FROM user_suspensions us 
        WHERE us.user_id = ba.user_id 
        AND us.is_active = true
    );
    
    -- Deactivate the users
    UPDATE users 
    SET is_active = false
    WHERE id IN (
        SELECT user_id FROM user_suspensions 
        WHERE is_active = true 
        AND created_at > NOW() - INTERVAL '1 minute'
    );
END;
$$ LANGUAGE plpgsql;
