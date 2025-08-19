#!/bin/bash

echo "🎭 COMPLETE AUCTION DEMO FLOW"
echo "=============================="

# Setup admin user
echo "1. Setting up admin user..."
psql -h localhost -U milan -d antique_auction -c "
INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified)
VALUES ('admin@example.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Admin User', 'admin', true, true)
ON CONFLICT (email) DO NOTHING;
" > /dev/null

# Setup regular user
echo "2. Setting up regular user..."
psql -h localhost -U milan -d antique_auction -c "
INSERT INTO users (email, password_hash, full_name, role, is_active, is_verified)
VALUES ('user@example.com', '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeVMpYkqGxpnq3fmG', 'Test User', 'user', true, true)
ON CONFLICT (email) DO NOTHING;
" > /dev/null

# Get user IDs
ADMIN_ID=$(psql -h localhost -U milan -d antique_auction -t -c "SELECT id FROM users WHERE email = 'admin@example.com';" | xargs)
USER_ID=$(psql -h localhost -U milan -d antique_auction -t -c "SELECT id FROM users WHERE email = 'user@example.com';" | xargs)

echo "3. Creating demo auction..."
AUCTION_ID=$(psql -h localhost -U milan -d antique_auction -t -c "
INSERT INTO auctions (title, description, starting_bid, current_bid, status, seller_id, end_time, image_url, approval_status)
VALUES ('Antique Victorian Vase', 'Beautiful hand-painted Victorian vase from 1890s', 100, 100, 'active', '$ADMIN_ID', NOW() + INTERVAL '1 hour', 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400', 'approved')
RETURNING id;
" | xargs)

echo "4. Placing initial bid..."
psql -h localhost -U milan -d antique_auction -c "
INSERT INTO bids (auction_id, bidder_id, amount)
VALUES ('$AUCTION_ID', '$USER_ID', 150);
" > /dev/null

echo "5. Ending auction..."
psql -h localhost -U milan -d antique_auction -c "
UPDATE auctions SET status = 'ended', end_time = NOW() - INTERVAL '1 minute' WHERE id = '$AUCTION_ID';
" > /dev/null

echo ""
echo "✅ Demo setup complete!"
echo ""
echo "📋 DEMO CREDENTIALS:"
echo "Admin: admin@example.com / password123"
echo "User:  user@example.com / password123"
echo ""
echo "🎯 DEMO FLOW:"
echo "1. Login as user@example.com"
echo "2. Go to Payments page"
echo "3. See winning auction: 'Antique Victorian Vase'"
echo "4. Click 'Complete Payment' to test eSewa"
echo "5. Payment will redirect to success page"
echo ""
echo "Auction ID: $AUCTION_ID"
echo "Winner: $USER_ID"