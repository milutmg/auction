-- Image verification MVP tables (additive, non-breaking)
CREATE TABLE IF NOT EXISTS auction_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id UUID NOT NULL REFERENCES auctions(id) ON DELETE CASCADE,
  url_original TEXT NOT NULL,
  url_medium TEXT,
  phash BIGINT,
  exif JSONB,
  flags JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_auction_images_auction ON auction_images(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_images_phash ON auction_images(phash);

CREATE TABLE IF NOT EXISTS auction_verification (
  auction_id UUID PRIMARY KEY REFERENCES auctions(id) ON DELETE CASCADE,
  risk_score INTEGER DEFAULT 0,
  needs_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION trg_av_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP; RETURN NEW; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_av_upd ON auction_verification;
CREATE TRIGGER trg_av_upd BEFORE UPDATE ON auction_verification FOR EACH ROW EXECUTE FUNCTION trg_av_updated_at();
