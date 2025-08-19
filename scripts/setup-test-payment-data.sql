-- Setup test payment data for user@example.com

-- Insert test user if not exists
INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified)
VALUES ('user@example.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Test User', 'user', true, true)
ON CONFLICT (email) DO NOTHING;

-- Get user ID
DO $$
DECLARE
    user_id UUID;
    auction_id UUID;
    transaction_id VARCHAR(255);
BEGIN
    -- Get user ID
    SELECT id INTO user_id FROM users WHERE email = 'user@example.com';
    
    -- Create test auction
    INSERT INTO auctions (title, description, starting_bid, current_bid, status, seller_id, end_time, image_url)
    VALUES ('Vintage Pocket Watch', 'Beautiful antique pocket watch from 1920s', 150, 250, 'ended', user_id, NOW() - INTERVAL '1 day', 'https://images.unsplash.com/photo-1509048191080-d2e2678e67b4?w=400')
    RETURNING id INTO auction_id;
    
    -- Create winning bid
    INSERT INTO bids (auction_id, bidder_id, amount)
    VALUES (auction_id, user_id, 250);
    
    -- Create payment transaction
    transaction_id := 'test-' || EXTRACT(EPOCH FROM NOW())::bigint;
    INSERT INTO payment_transactions (auction_id, winner_id, transaction_id, amount, status)
    VALUES (auction_id, user_id, transaction_id, 250, 'pending');
    
    -- Create order
    INSERT INTO orders (auction_id, winner_id, final_amount, status, payment_status, transaction_id)
    VALUES (auction_id, user_id, 250, 'pending', 'pending', transaction_id);
    
    RAISE NOTICE 'Test data created successfully for user: user@example.com';
    RAISE NOTICE 'Auction ID: %', auction_id;
    RAISE NOTICE 'Transaction ID: %', transaction_id;
END $$;