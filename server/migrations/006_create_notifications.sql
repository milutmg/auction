-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'outbid', 'won', 'auction_ending', 'new_bid', 'admin_message'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_auction_id ON notifications(auction_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Insert some sample notifications for testing
DO $$
DECLARE
    sample_user_id UUID;
    sample_auction_id UUID;
BEGIN
    -- Get a sample user (first regular user)
    SELECT id INTO sample_user_id FROM users WHERE role = 'user' LIMIT 1;
    
    -- Get a sample auction
    SELECT id INTO sample_auction_id FROM auctions LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Insert sample notifications
        INSERT INTO notifications (user_id, type, title, message, auction_id, read, created_at) VALUES
        (sample_user_id, 'outbid', 'You have been outbid!', 'Someone placed a higher bid on "Vintage Pocket Watch"', sample_auction_id, false, NOW() - INTERVAL '5 minutes'),
        (sample_user_id, 'won', 'Congratulations! You won!', 'You won the auction for "Antique Vase Collection"', sample_auction_id, false, NOW() - INTERVAL '1 hour'),
        (sample_user_id, 'auction_ending', 'Auction ending soon!', 'The auction for "Victorian Jewelry Set" ends in 30 minutes', sample_auction_id, true, NOW() - INTERVAL '30 minutes');
    END IF;
END $$;
