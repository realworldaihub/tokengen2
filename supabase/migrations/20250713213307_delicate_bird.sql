/*
  # Add token metadata support

  1. New Tables
    - `token_metadata` - Stores metadata for tokens including logo, description, and social links
  2. Changes
    - Add foreign key relationship to tokens table
  3. Indexes
    - Create indexes for efficient queries
*/

-- Create token_metadata table
CREATE TABLE IF NOT EXISTS token_metadata (
  id SERIAL PRIMARY KEY,
  token_address VARCHAR(42) NOT NULL UNIQUE,
  name VARCHAR(100),
  symbol VARCHAR(20),
  description VARCHAR(300),
  logo_url TEXT,
  website_url VARCHAR(255),
  twitter_url VARCHAR(255),
  telegram_url VARCHAR(255),
  discord_url VARCHAR(255),
  whitepaper_url VARCHAR(255),
  github_url VARCHAR(255),
  tags TEXT[],
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT token_metadata_token_fk FOREIGN KEY (token_address) REFERENCES tokens(contract_address) ON DELETE CASCADE
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_token_metadata_token_address ON token_metadata(token_address);
CREATE INDEX IF NOT EXISTS idx_token_metadata_tags ON token_metadata USING GIN(tags);

-- Add function to update timestamp on record update
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to update timestamp
CREATE TRIGGER update_token_metadata_modtime
BEFORE UPDATE ON token_metadata
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();