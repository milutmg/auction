-- Insert test data for admin panel testing

-- Insert some test categories first (if they don't exist)
INSERT INTO categories (name, description) VALUES
    ('Antique Vases', 'Beautiful antique vases from various eras')
ON CONFLICT (name) DO NOTHING;

-- Insert some test users (sellers/bidders)
INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified) VALUES
    ('seller1@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'John Seller', 'user', true, true),
    ('seller2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Mary Collector', 'user', true, true),
    ('bidder1@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Bob Bidder', 'user', true, true),
    ('bidder2@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Alice Buyer', 'user', true, true),
    ('suspicious@test.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Suspicious User', 'user', false, false)
ON CONFLICT (email) DO NOTHING;

-- Get the category and user IDs for our test data
WITH category_info AS (
    SELECT id as cat_id FROM categories WHERE name = 'Antique Vases' LIMIT 1
),
user_info AS (
    SELECT 
        (SELECT id FROM users WHERE email = 'seller1@test.com') as seller1_id,
        (SELECT id FROM users WHERE email = 'seller2@test.com') as seller2_id,
        (SELECT id FROM users WHERE email = 'bidder1@test.com') as bidder1_id,
        (SELECT id FROM users WHERE email = 'bidder2@test.com') as bidder2_id,
        (SELECT id FROM users WHERE email = 'suspicious@test.com') as suspicious_id
)
-- Insert test auctions (some pending approval)
INSERT INTO auctions (
    title, description, starting_bid, current_bid, category_id, seller_id, 
    status, approval_status, start_time, end_time
)
SELECT 
    'Ming Dynasty Vase', 
    'Authentic Ming Dynasty ceramic vase with beautiful blue and white patterns. Excellent condition.',
    500.00, 0, cat_id, seller1_id, 'pending', 'pending',
    NOW(), NOW() + INTERVAL '7 days'
FROM category_info, user_info
UNION ALL
SELECT 
    'Victorian Crystal Decanter', 
    'Elegant Victorian crystal decanter with intricate engravings. Perfect for collectors.',
    200.00, 0, cat_id, seller2_id, 'pending', 'pending',
    NOW(), NOW() + INTERVAL '5 days'
FROM category_info, user_info
UNION ALL
SELECT 
    'Antique Porcelain Tea Set', 
    'Complete porcelain tea set from the 1800s. Some minor chips but overall excellent condition.',
    150.00, 250.00, cat_id, seller1_id, 'active', 'approved',
    NOW() - INTERVAL '2 days', NOW() + INTERVAL '3 days'
FROM category_info, user_info;

-- Insert some test bids
WITH auction_info AS (
    SELECT id as auction_id FROM auctions WHERE title = 'Antique Porcelain Tea Set' LIMIT 1
),
user_info AS (
    SELECT 
        (SELECT id FROM users WHERE email = 'bidder1@test.com') as bidder1_id,
        (SELECT id FROM users WHERE email = 'bidder2@test.com') as bidder2_id
)
INSERT INTO bids (auction_id, bidder_id, amount)
SELECT auction_id, bidder1_id, 200.00 FROM auction_info, user_info
UNION ALL
SELECT auction_id, bidder2_id, 250.00 FROM auction_info, user_info;

-- Insert some test reports
WITH user_info AS (
    SELECT 
        (SELECT id FROM users WHERE email = 'bidder1@test.com') as reporter_id,
        (SELECT id FROM users WHERE email = 'suspicious@test.com') as reported_id
),
auction_info AS (
    SELECT id as auction_id FROM auctions WHERE title = 'Antique Porcelain Tea Set' LIMIT 1
)
INSERT INTO reports (reporter_id, reported_user_id, auction_id, type, description, status)
SELECT 
    reporter_id, reported_id, auction_id,
    'suspicious_user', 'This user has been bidding suspiciously high amounts immediately after other bids.', 'pending'
FROM user_info, auction_info
UNION ALL
SELECT 
    reporter_id, NULL, auction_id,
    'fake_bid', 'I believe there are fake bids on this auction to drive up the price.', 'investigating'
FROM user_info, auction_info;

-- Insert some test orders (for revenue calculation)
WITH auction_info AS (
    SELECT id as auction_id FROM auctions WHERE title = 'Antique Porcelain Tea Set' LIMIT 1
),
user_info AS (
    SELECT (SELECT id FROM users WHERE email = 'bidder2@test.com') as winner_id
)
INSERT INTO orders (auction_id, winner_id, final_amount, status, payment_deadline)
SELECT auction_id, winner_id, 250.00, 'paid', NOW() + INTERVAL '72 hours'
FROM auction_info, user_info;

-- Insert some notifications
WITH user_info AS (
    SELECT 
        (SELECT id FROM users WHERE email = 'bidder1@test.com') as user1_id,
        (SELECT id FROM users WHERE email = 'bidder2@test.com') as user2_id
)
INSERT INTO notifications (user_id, title, message, type, is_read)
SELECT user1_id, 'Welcome to AntiquaBid', 'Thank you for joining our antique auction platform!', 'system', false
FROM user_info
UNION ALL
SELECT user2_id, 'Bid Update', 'You have been outbid on the Antique Porcelain Tea Set.', 'outbid', false
FROM user_info;

COMMIT;
