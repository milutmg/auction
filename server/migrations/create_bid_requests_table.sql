-- Create bid_requests table
CREATE TABLE IF NOT EXISTS bid_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  starting_bid DECIMAL(10,2) NOT NULL CHECK (starting_bid > 0),
  estimated_value VARCHAR(100),
  category VARCHAR(100),
  condition VARCHAR(50),
  provenance TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  auction_id UUID REFERENCES auctions(id) ON DELETE SET NULL,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_bid_requests_user_id ON bid_requests(user_id);
CREATE INDEX idx_bid_requests_status ON bid_requests(status);
CREATE INDEX idx_bid_requests_created_at ON bid_requests(created_at);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bid_requests_updated_at 
    BEFORE UPDATE ON bid_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for demo
INSERT INTO bid_requests (user_id, title, description, starting_bid, estimated_value, category, condition, provenance, image_url) 
SELECT 
  id as user_id,
  'Vintage Victorian Tea Set',
  'Beautiful hand-painted porcelain tea set from the Victorian era. Complete with teapot, cups, saucers, and serving tray. Minor chips on one cup handle but otherwise in excellent condition.',
  150.00,
  '$200-$400',
  'Ceramics',
  'Very Good',
  'Inherited from grandmother, family has had it since 1920s',
  'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400'
FROM users 
WHERE email = 'user@example.com' 
LIMIT 1;

INSERT INTO bid_requests (user_id, title, description, starting_bid, estimated_value, category, condition, provenance, image_url) 
SELECT 
  id as user_id,
  'Antique Mahogany Writing Desk',
  'Solid mahogany writing desk with brass hardware. Features multiple drawers and compartments. Some wear on the writing surface but structurally sound.',
  500.00,
  '$800-$1200',
  'Furniture',
  'Good',
  'Purchased from estate sale, believed to be from 1800s',
  'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'
FROM users 
WHERE email = 'user@example.com' 
LIMIT 1;
