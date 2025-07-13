/*
  # Token Metadata Enhancements

  1. New Fields
    - `preview_metadata` - Stores temporary metadata before token deployment
    - `last_updated_by` - Tracks which address last updated the metadata
    - `update_count` - Tracks how many times metadata has been updated
  2. Changes
    - Add additional indexes for better query performance
  3. Security
    - Add audit trail for metadata changes
*/

-- Add new fields to token_metadata table
ALTER TABLE IF EXISTS token_metadata 
ADD COLUMN IF NOT EXISTS last_updated_by VARCHAR(42),
ADD COLUMN IF NOT EXISTS update_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;

-- Create token_metadata_history table for audit trail
CREATE TABLE IF NOT EXISTS token_metadata_history (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL,
  updated_by VARCHAR(42) NOT NULL,
  update_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  previous_data JSONB NOT NULL,
  
  CONSTRAINT token_metadata_history_token_fk FOREIGN KEY (token_address) REFERENCES tokens(contract_address) ON DELETE CASCADE
);

-- Create temporary_metadata table for pre-deployment metadata
CREATE TABLE IF NOT EXISTS temporary_metadata (
  id SERIAL PRIMARY KEY,
  session_id VARCHAR(64) NOT NULL UNIQUE,
  creator_address VARCHAR(42) NOT NULL,
  name VARCHAR(100),
  symbol VARCHAR(20),
  description VARCHAR(300),
  logo_data TEXT, -- Base64 encoded image data
  website_url VARCHAR(255),
  twitter_url VARCHAR(255),
  telegram_url VARCHAR(255),
  discord_url VARCHAR(255),
  whitepaper_url VARCHAR(255),
  github_url VARCHAR(255),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Create index for session lookup
CREATE INDEX IF NOT EXISTS idx_temporary_metadata_session ON temporary_metadata(session_id);
CREATE INDEX IF NOT EXISTS idx_temporary_metadata_creator ON temporary_metadata(creator_address);

-- Create function to link temporary metadata to token after deployment
CREATE OR REPLACE FUNCTION link_temporary_metadata()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's temporary metadata for this token's owner
  INSERT INTO token_metadata (
    token_address, name, symbol, description, logo_url, 
    website_url, twitter_url, telegram_url, discord_url, 
    whitepaper_url, github_url, tags, last_updated_by, update_count
  )
  SELECT 
    NEW.contract_address, t.name, t.symbol, t.description, NULL, 
    t.website_url, t.twitter_url, t.telegram_url, t.discord_url, 
    t.whitepaper_url, t.github_url, t.tags, NEW.owner_address, 1
  FROM temporary_metadata t
  WHERE t.creator_address = NEW.owner_address
  AND t.expires_at > CURRENT_TIMESTAMP
  ORDER BY t.created_at DESC
  LIMIT 1;
  
  -- Delete used temporary metadata
  DELETE FROM temporary_metadata 
  WHERE creator_address = NEW.owner_address
  AND expires_at > CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to link metadata on token creation
DROP TRIGGER IF EXISTS link_metadata_on_token_creation ON tokens;
CREATE TRIGGER link_metadata_on_token_creation
AFTER INSERT ON tokens
FOR EACH ROW
EXECUTE FUNCTION link_temporary_metadata();

-- Create function to track metadata updates
CREATE OR REPLACE FUNCTION track_metadata_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- Store previous version in history
  IF (TG_OP = 'UPDATE') THEN
    INSERT INTO token_metadata_history (
      token_address, updated_by, previous_data
    ) VALUES (
      OLD.token_address, 
      NEW.last_updated_by, 
      row_to_json(OLD)
    );
    
    -- Increment update count
    NEW.update_count := OLD.update_count + 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for metadata updates
DROP TRIGGER IF EXISTS track_token_metadata_updates ON token_metadata;
CREATE TRIGGER track_token_metadata_updates
BEFORE UPDATE ON token_metadata
FOR EACH ROW
EXECUTE FUNCTION track_metadata_updates();

-- Add function to clean up expired temporary metadata
CREATE OR REPLACE FUNCTION cleanup_expired_metadata()
RETURNS void AS $$
BEGIN
  DELETE FROM temporary_metadata WHERE expires_at < CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up expired metadata (would be set up in production)
-- SELECT cron.schedule('0 0 * * *', 'SELECT cleanup_expired_metadata()');