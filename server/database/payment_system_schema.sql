-- Enhanced Payment System Schema
-- Comprehensive payment gateway integration with multiple providers

-- Payment providers configuration
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    provider_type VARCHAR(50) NOT NULL, -- 'gateway', 'wallet', 'bank_transfer', 'crypto'
    is_active BOOLEAN DEFAULT true,
    supported_currencies JSONB DEFAULT '["USD", "NPR"]',
    configuration JSONB NOT NULL, -- Provider-specific config
    fee_structure JSONB DEFAULT '{}', -- Commission/fee structure
    min_amount DECIMAL(10,2) DEFAULT 0.01,
    max_amount DECIMAL(10,2) DEFAULT 100000.00,
    processing_time VARCHAR(100), -- '1-2 business days', 'instant', etc.
    countries_supported JSONB DEFAULT '[]',
    payment_methods JSONB DEFAULT '[]', -- ['card', 'bank', 'wallet', etc.]
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced payment transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id),
    auction_id UUID REFERENCES auctions(id),
    payer_id UUID REFERENCES users(id),
    recipient_id UUID REFERENCES users(id),
    
    -- Transaction details
    transaction_id VARCHAR(255) UNIQUE NOT NULL,
    external_transaction_id VARCHAR(255), -- Provider's transaction ID
    
    -- Payment provider info
    payment_provider_id UUID REFERENCES payment_providers(id),
    payment_method VARCHAR(50) NOT NULL, -- 'esewa', 'stripe', 'paypal', 'bank_transfer'
    payment_type VARCHAR(50) DEFAULT 'auction_payment', -- 'auction_payment', 'commission', 'refund'
    
    -- Amount details
    gross_amount DECIMAL(10,2) NOT NULL,
    net_amount DECIMAL(10,2) NOT NULL, -- After fees
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    payment_gateway_fee DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(10) DEFAULT 'USD',
    
    -- Status and tracking
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN (
        'pending', 'processing', 'completed', 'failed', 
        'cancelled', 'refunded', 'partially_refunded', 'disputed'
    )),
    
    -- Provider response data
    provider_response JSONB,
    error_details JSONB,
    
    -- Timestamps
    initiated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    completed_at TIMESTAMP,
    expires_at TIMESTAMP,
    
    -- URLs for redirects
    success_url TEXT,
    failure_url TEXT,
    callback_url TEXT,
    
    -- Additional metadata
    metadata JSONB DEFAULT '{}',
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment methods for users (saved payment options)
CREATE TABLE IF NOT EXISTS user_payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES payment_providers(id),
    
    -- Method details
    method_type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', 'wallet'
    display_name VARCHAR(255), -- User-friendly name like "Visa ending in 1234"
    
    -- Tokenized data (no sensitive info stored)
    provider_method_id VARCHAR(255), -- Provider's token/ID for this method
    last_four VARCHAR(10), -- Last 4 digits for cards
    brand VARCHAR(50), -- Visa, Mastercard, etc.
    expires_at DATE, -- For cards
    
    -- Settings
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    verified BOOLEAN DEFAULT false,
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment webhooks and callbacks
CREATE TABLE IF NOT EXISTS payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES payment_transactions(id),
    provider_name VARCHAR(100) NOT NULL,
    webhook_type VARCHAR(100) NOT NULL, -- 'payment.completed', 'payment.failed', etc.
    payload JSONB NOT NULL,
    headers JSONB,
    signature VARCHAR(500),
    verified BOOLEAN DEFAULT false,
    processed BOOLEAN DEFAULT false,
    processing_result JSONB,
    received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP
);

-- Refunds and chargebacks
CREATE TABLE IF NOT EXISTS payment_refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_transaction_id UUID REFERENCES payment_transactions(id),
    refund_transaction_id UUID REFERENCES payment_transactions(id),
    
    -- Refund details
    refund_amount DECIMAL(10,2) NOT NULL,
    refund_reason VARCHAR(255) NOT NULL,
    refund_type VARCHAR(50) DEFAULT 'manual' CHECK (refund_type IN ('manual', 'automatic', 'chargeback')),
    
    -- Status
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    
    -- Processing details
    external_refund_id VARCHAR(255),
    provider_response JSONB,
    processed_by UUID REFERENCES users(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID REFERENCES payment_transactions(id),
    order_id UUID REFERENCES orders(id),
    
    -- Dispute details
    dispute_type VARCHAR(50) NOT NULL, -- 'chargeback', 'inquiry', 'claim'
    dispute_reason VARCHAR(255) NOT NULL,
    disputed_amount DECIMAL(10,2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'accepted', 'declined', 'closed')),
    
    -- External dispute tracking
    external_dispute_id VARCHAR(255),
    provider_case_id VARCHAR(255),
    
    -- Evidence and documentation
    evidence JSONB DEFAULT '[]',
    correspondence JSONB DEFAULT '[]',
    
    -- Important dates
    dispute_date TIMESTAMP NOT NULL,
    response_due_date TIMESTAMP,
    resolved_date TIMESTAMP,
    
    -- Resolution
    resolution VARCHAR(50), -- 'won', 'lost', 'settled'
    resolution_amount DECIMAL(10,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment analytics and reporting
CREATE TABLE IF NOT EXISTS payment_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE NOT NULL,
    provider_name VARCHAR(100),
    
    -- Volume metrics
    transaction_count INTEGER DEFAULT 0,
    successful_transactions INTEGER DEFAULT 0,
    failed_transactions INTEGER DEFAULT 0,
    
    -- Amount metrics
    total_volume DECIMAL(12,2) DEFAULT 0.00,
    successful_volume DECIMAL(12,2) DEFAULT 0.00,
    total_fees DECIMAL(10,2) DEFAULT 0.00,
    platform_revenue DECIMAL(10,2) DEFAULT 0.00,
    
    -- Performance metrics
    success_rate DECIMAL(5,2) DEFAULT 0.00,
    average_processing_time INTERVAL,
    
    -- Dispute metrics
    dispute_count INTEGER DEFAULT 0,
    dispute_rate DECIMAL(5,2) DEFAULT 0.00,
    chargeback_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(date, provider_name)
);

-- Insert default payment providers
INSERT INTO payment_providers (name, display_name, provider_type, is_active, configuration, fee_structure, payment_methods) VALUES 
('esewa', 'eSewa Digital Wallet', 'wallet', true, 
 '{"merchant_id": "", "secret_key": "", "base_url": "https://uat.esewa.com.np/epay/", "api_version": "v1"}',
 '{"percentage": 2.0, "fixed": 0, "max_fee": 100}',
 '["wallet", "bank_transfer"]'),

('stripe', 'Stripe Payment Gateway', 'gateway', true,
 '{"publishable_key": "", "secret_key": "", "webhook_secret": "", "api_version": "2023-10-16"}',
 '{"percentage": 2.9, "fixed": 0.30, "international": 3.9}',
 '["card", "bank_transfer", "wallet"]'),

('paypal', 'PayPal', 'gateway', true,
 '{"client_id": "", "client_secret": "", "mode": "sandbox", "webhook_id": ""}',
 '{"percentage": 3.49, "fixed": 0.49, "international": 4.99}',
 '["paypal", "card"]'),

('bank_transfer', 'Direct Bank Transfer', 'bank_transfer', true,
 '{"account_number": "", "account_name": "", "bank_name": "", "swift_code": ""}',
 '{"percentage": 0, "fixed": 0}',
 '["bank_transfer"]'),

('khalti', 'Khalti Digital Wallet', 'wallet', true,
 '{"public_key": "", "secret_key": "", "base_url": "https://khalti.com/api/v2/", "widget_url": "https://khalti.com/static/khalti-checkout.js"}',
 '{"percentage": 3.0, "fixed": 0}',
 '["wallet", "card", "bank_transfer"]');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_auction ON payment_transactions(auction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payer ON payment_transactions(payer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_method ON payment_transactions(payment_method);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created ON payment_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_transaction ON payment_webhooks(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_webhooks_processed ON payment_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_user_payment_methods_user ON user_payment_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_original ON payment_refunds(original_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_disputes_transaction ON payment_disputes(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_analytics_date ON payment_analytics(date);

-- Update existing orders table to link with new payment system
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_transaction_id UUID REFERENCES payment_transactions(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_provider VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_fees DECIMAL(10,2) DEFAULT 0.00;
