/*
  # Solana Integration

  1. New Tables
    - `solana_tokens` - Stores SPL token information
    - `solana_token_accounts` - Stores token account information
    - `solana_transactions` - Stores transaction history
  2. Changes
    - Add support for Solana networks and wallets
  3. Security
    - Add proper relationships and constraints
*/

-- Create solana_tokens table
CREATE TABLE IF NOT EXISTS solana_tokens (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(44) NOT NULL UNIQUE,
  name VARCHAR(100),
  symbol VARCHAR(20),
  decimals INTEGER NOT NULL DEFAULT 9,
  supply NUMERIC,
  owner_address VARCHAR(44),
  freeze_authority BOOLEAN DEFAULT false,
  metadata_address VARCHAR(44),
  network_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create solana_token_accounts table
CREATE TABLE IF NOT EXISTS solana_token_accounts (
  id SERIAL PRIMARY KEY,
  account_address VARCHAR(44) NOT NULL UNIQUE,
  mint_address VARCHAR(44) NOT NULL,
  owner_address VARCHAR(44) NOT NULL,
  amount NUMERIC DEFAULT 0,
  is_frozen BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT solana_token_accounts_mint_fk FOREIGN KEY (mint_address) REFERENCES solana_tokens(mint_address) ON DELETE CASCADE
);

-- Create solana_transactions table
CREATE TABLE IF NOT EXISTS solana_transactions (
  id SERIAL PRIMARY KEY,
  signature VARCHAR(88) NOT NULL UNIQUE,
  transaction_type VARCHAR(20) NOT NULL,
  from_address VARCHAR(44),
  to_address VARCHAR(44),
  amount NUMERIC,
  mint_address VARCHAR(44),
  network_id VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  slot BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT solana_transactions_mint_fk FOREIGN KEY (mint_address) REFERENCES solana_tokens(mint_address) ON DELETE SET NULL
);

-- Create solana_airdrops table
CREATE TABLE IF NOT EXISTS solana_airdrops (
  id SERIAL PRIMARY KEY,
  sender_address VARCHAR(44) NOT NULL,
  mint_address VARCHAR(44) NOT NULL,
  recipient_count INTEGER NOT NULL,
  total_amount NUMERIC NOT NULL,
  signature VARCHAR(88),
  network_id VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT solana_airdrops_mint_fk FOREIGN KEY (mint_address) REFERENCES solana_tokens(mint_address) ON DELETE CASCADE
);

-- Create solana_networks table
CREATE TABLE IF NOT EXISTS solana_networks (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  endpoint VARCHAR(255) NOT NULL,
  explorer_url VARCHAR(255) NOT NULL,
  is_testnet BOOLEAN DEFAULT false,
  icon VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial Solana networks
INSERT INTO solana_networks (id, name, endpoint, explorer_url, is_testnet, icon)
VALUES
  ('solana-mainnet', 'Solana Mainnet', 'https://api.mainnet-beta.solana.com', 'https://explorer.solana.com', false, '☀️'),
  ('solana-devnet', 'Solana Devnet', 'https://api.devnet.solana.com', 'https://explorer.solana.com/?cluster=devnet', true, '🌤️'),
  ('solana-testnet', 'Solana Testnet', 'https://api.testnet.solana.com', 'https://explorer.solana.com/?cluster=testnet', true, '🌥️')
ON CONFLICT (id) DO NOTHING;

-- Create solana_token_metadata table
CREATE TABLE IF NOT EXISTS solana_token_metadata (
  id SERIAL PRIMARY KEY,
  mint_address VARCHAR(44) NOT NULL UNIQUE,
  name VARCHAR(100),
  symbol VARCHAR(20),
  description VARCHAR(300),
  image_url TEXT,
  external_url VARCHAR(255),
  creators JSONB,
  attributes JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT solana_token_metadata_mint_fk FOREIGN KEY (mint_address) REFERENCES solana_tokens(mint_address) ON DELETE CASCADE
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_solana_tokens_owner ON solana_tokens(owner_address);
CREATE INDEX IF NOT EXISTS idx_solana_token_accounts_owner ON solana_token_accounts(owner_address);
CREATE INDEX IF NOT EXISTS idx_solana_token_accounts_mint ON solana_token_accounts(mint_address);
CREATE INDEX IF NOT EXISTS idx_solana_transactions_from ON solana_transactions(from_address);
CREATE INDEX IF NOT EXISTS idx_solana_transactions_to ON solana_transactions(to_address);
CREATE INDEX IF NOT EXISTS idx_solana_transactions_mint ON solana_transactions(mint_address);
CREATE INDEX IF NOT EXISTS idx_solana_airdrops_sender ON solana_airdrops(sender_address);
CREATE INDEX IF NOT EXISTS idx_solana_airdrops_mint ON solana_airdrops(mint_address);

-- Add function to update timestamp on record update
CREATE OR REPLACE FUNCTION update_solana_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to update timestamp
CREATE TRIGGER update_solana_tokens_modtime
BEFORE UPDATE ON solana_tokens
FOR EACH ROW
EXECUTE FUNCTION update_solana_modified_column();

CREATE TRIGGER update_solana_token_accounts_modtime
BEFORE UPDATE ON solana_token_accounts
FOR EACH ROW
EXECUTE FUNCTION update_solana_modified_column();

CREATE TRIGGER update_solana_token_metadata_modtime
BEFORE UPDATE ON solana_token_metadata
FOR EACH ROW
EXECUTE FUNCTION update_solana_modified_column();