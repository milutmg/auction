-- Create database tables for antique auction system

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    phone VARCHAR(20),
    address TEXT,
    google_id VARCHAR(255),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auctions table
CREATE TABLE IF NOT EXISTS auctions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    starting_bid DECIMAL(10,2) NOT NULL,
    current_bid DECIMAL(10,2),
    reserve_price DECIMAL(10,2),
    estimated_value_min DECIMAL(10,2),
    estimated_value_max DECIMAL(10,2),
    category_id UUID REFERENCES categories(id),
    seller_id UUID REFERENCES users(id) NOT NULL,
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'ended', 'cancelled', 'rejected', 'paused')),
    approval_status VARCHAR(30) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    bid_increment DECIMAL(10,2) DEFAULT 1.00,
    auto_extend_minutes INTEGER DEFAULT 5, -- Auto-extend if bid in last X minutes
    payment_deadline_hours INTEGER DEFAULT 72, -- Hours to pay after winning
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bids table
CREATE TABLE IF NOT EXISTS bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) NOT NULL,
    bidder_id UUID REFERENCES users(id) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_category ON auctions(category_id);
CREATE INDEX IF NOT EXISTS idx_auctions_seller ON auctions(seller_id);
CREATE INDEX IF NOT EXISTS idx_bids_auction ON bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder ON bids(bidder_id);
CREATE INDEX IF NOT EXISTS idx_bids_created_at ON bids(created_at);

-- Insert default categories
INSERT INTO categories (name, description) VALUES
    ('Furniture', 'Antique furniture pieces including chairs, tables, cabinets, and more'),
    ('Jewelry', 'Vintage and antique jewelry including rings, necklaces, brooches, and watches'),
    ('Art', 'Fine art including paintings, sculptures, prints, and decorative art'),
    ('Collectibles', 'Rare collectible items including coins, stamps, books, and memorabilia'),
    ('Ceramics', 'Antique pottery, porcelain, and ceramic pieces'),
    ('Textiles', 'Vintage textiles including clothing, tapestries, and linens')
ON CONFLICT (name) DO NOTHING;

-- Comments table for auction questions/comments
CREATE TABLE IF NOT EXISTS auction_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    comment TEXT NOT NULL,
    parent_id UUID REFERENCES auction_comments(id), -- For replies
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-bidding table
CREATE TABLE IF NOT EXISTS auto_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auction_id UUID REFERENCES auctions(id) NOT NULL,
    user_id UUID REFERENCES users(id) NOT NULL,
    max_amount DECIMAL(10,2) NOT NULL,
    increment DECIMAL(10,2) DEFAULT 1.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders table for winners
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

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) NOT NULL,
    reviewer_id UUID REFERENCES users(id) NOT NULL,
    reviewed_user_id UUID REFERENCES users(id) NOT NULL, -- seller or buyer
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    type VARCHAR(20) CHECK (type IN ('seller', 'buyer', 'product')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'outbid', 'won', 'payment_due', 'system', etc.
    is_read BOOLEAN DEFAULT false,
    related_auction_id UUID REFERENCES auctions(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin actions log
CREATE TABLE IF NOT EXISTS admin_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES users(id) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50) NOT NULL, -- 'user', 'auction', 'bid', etc.
    target_id UUID NOT NULL,
    details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table for suspicious activity
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID REFERENCES users(id),
    reported_user_id UUID REFERENCES users(id),
    auction_id UUID REFERENCES auctions(id),
    type VARCHAR(50) NOT NULL, -- 'fake_bid', 'suspicious_user', 'inappropriate_content'
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'investigating', 'resolved', 'dismissed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES users(id)
);

-- Function to update current_bid when a new bid is placed
CREATE OR REPLACE FUNCTION update_auction_current_bid()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auctions 
    SET current_bid = NEW.amount,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.auction_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update current_bid
DROP TRIGGER IF EXISTS trigger_update_current_bid ON bids;
CREATE TRIGGER trigger_update_current_bid
    AFTER INSERT ON bids
    FOR EACH ROW
    EXECUTE FUNCTION update_auction_current_bid();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS trigger_users_updated_at ON users;
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_auctions_updated_at ON auctions;
CREATE TRIGGER trigger_auctions_updated_at
    BEFORE UPDATE ON auctions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_orders_updated_at ON orders;
CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_auto_bids_updated_at ON auto_bids;
CREATE TRIGGER trigger_auto_bids_updated_at
    BEFORE UPDATE ON auto_bids
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_auctions_approval_status ON auctions(approval_status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_orders_winner ON orders(winner_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_auction_comments_auction ON auction_comments(auction_id);
CREATE INDEX IF NOT EXISTS idx_auto_bids_auction_user ON auto_bids(auction_id, user_id);

-- Create default admin user (password: admin123)
INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified) VALUES
    ('admin@antiqueauc.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'System Administrator', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;
