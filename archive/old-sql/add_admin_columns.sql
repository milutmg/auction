-- Add missing columns to auctions table for admin functionality
ALTER TABLE auctions 
ADD COLUMN IF NOT EXISTS approval_status VARCHAR(30) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS bid_increment DECIMAL(10,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS auto_extend_minutes INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS payment_deadline_hours INTEGER DEFAULT 72;

-- Update status column constraint to include all needed statuses
ALTER TABLE auctions 
DROP CONSTRAINT IF EXISTS auctions_status_check;

ALTER TABLE auctions 
ADD CONSTRAINT auctions_status_check 
CHECK (status IN ('pending', 'approved', 'active', 'ended', 'cancelled', 'rejected', 'paused'));

-- Create index for approval_status
CREATE INDEX IF NOT EXISTS idx_auctions_approval_status ON auctions(approval_status);

-- Make sure we have the admin_actions table for logging
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make sure we have the reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    auction_id UUID REFERENCES auctions(id),
    type VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- Make sure we have the notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    related_auction_id UUID REFERENCES auctions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Make sure we have the orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) NOT NULL,
    winner_id UUID REFERENCES users(id) NOT NULL,
    final_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
    payment_deadline TIMESTAMP,
    payment_method VARCHAR(50),
    shipping_address TEXT,
    tracking_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_orders_winner ON orders(winner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

COMMIT;
