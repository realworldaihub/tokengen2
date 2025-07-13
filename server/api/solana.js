const express = require('express');
const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const { 
  createMint, 
  getOrCreateAssociatedTokenAccount, 
  mintTo, 
  transfer, 
  getMint, 
  getAccount 
} = require('@solana/spl-token');
const { authenticate } = require('../middleware/auth');
const { query } = require('../db');
const { encrypt, decrypt } = require('../utils/encryption');

const router = express.Router();

// Get Solana connection based on network
const getConnection = (networkId) => {
  let endpoint;
  
  switch (networkId) {
    case 'solana-mainnet':
      endpoint = process.env.SOLANA_MAINNET_RPC_URL || 'https://api.mainnet-beta.solana.com';
      break;
    case 'solana-devnet':
      endpoint = process.env.SOLANA_DEVNET_RPC_URL || 'https://api.devnet.solana.com';
      break;
    case 'solana-testnet':
      endpoint = process.env.SOLANA_TESTNET_RPC_URL || 'https://api.testnet.solana.com';
      break;
    default:
      endpoint = 'https://api.devnet.solana.com'; // Default to devnet
  }
  
  return new Connection(endpoint, 'confirmed');
};

// Create SPL token
router.post('/token', authenticate, async (req, res) => {
  try {
    const { 
      name, 
      symbol, 
      decimals, 
      initialSupply, 
      freezeAuthority, 
      metadata, 
      network 
    } = req.body;
    
    const userId = req.user.id;
    
    // Validate request
    if (!name || !symbol || decimals === undefined || !initialSupply || !network) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Get connection
    const connection = getConnection(network.id);
    
    // In a real implementation, you would:
    // 1. Get the user's private key securely (or use a signing API)
    // 2. Create the token mint
    // 3. Create token account
    // 4. Mint initial supply
    // 5. Create metadata if enabled
    
    // For this demo, we'll simulate a successful token creation
    const mockMint = 'So1ana' + Date.now().toString(36);
    const mockTokenAccount = 'TokenAccount' + Date.now().toString(36);
    
    // Save token to database
    await query(
      `INSERT INTO solana_tokens 
       (mint_address, name, symbol, decimals, supply, owner_address, freeze_authority, network_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        mockMint,
        name,
        symbol,
        decimals,
        initialSupply,
        userId,
        freezeAuthority,
        network.id
      ]
    );
    
    // Save metadata if enabled
    if (metadata?.enabled) {
      await query(
        `INSERT INTO solana_token_metadata 
         (mint_address, name, symbol, description, external_url) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          mockMint,
          name,
          symbol,
          metadata.description || '',
          metadata.externalUrl || ''
        ]
      );
    }
    
    // Return token details
    res.json({
      success: true,
      mint: mockMint,
      tokenAccount: mockTokenAccount,
      transactionSignature: 'signature' + Date.now().toString(36),
      network: network,
      explorerUrl: `${network.explorerUrl}/address/${mockMint}`,
      metadataAddress: metadata?.enabled ? 'metadata' + Date.now().toString(36) : undefined
    });
    
  } catch (error) {
    console.error('Error creating SPL token:', error);
    res.status(500).json({ error: 'Failed to create token', details: error.message });
  }
});

// Get token info
router.get('/token/:mintAddress', async (req, res) => {
  try {
    const { mintAddress } = req.params;
    const { networkId } = req.query;
    
    // Validate mint address
    if (!mintAddress) {
      return res.status(400).json({ error: 'Mint address is required' });
    }
    
    // Get token from database
    const tokenResult = await query(
      'SELECT * FROM solana_tokens WHERE mint_address = $1',
      [mintAddress]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = tokenResult.rows[0];
    
    // Get metadata if available
    const metadataResult = await query(
      'SELECT * FROM solana_token_metadata WHERE mint_address = $1',
      [mintAddress]
    );
    
    const metadata = metadataResult.rows.length > 0 ? metadataResult.rows[0] : null;
    
    // Return token info
    res.json({
      mint: token.mint_address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: token.supply,
      owner: token.owner_address,
      freezeAuthority: token.freeze_authority,
      network: token.network_id,
      metadata: metadata ? {
        name: metadata.name,
        symbol: metadata.symbol,
        description: metadata.description,
        image: metadata.image_url,
        externalUrl: metadata.external_url,
        creators: metadata.creators,
        attributes: metadata.attributes
      } : null
    });
    
  } catch (error) {
    console.error('Error getting token info:', error);
    res.status(500).json({ error: 'Failed to get token info', details: error.message });
  }
});

// Get user's tokens
router.get('/tokens', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get tokens from database
    const tokensResult = await query(
      `SELECT t.*, m.description, m.image_url 
       FROM solana_tokens t 
       LEFT JOIN solana_token_metadata m ON t.mint_address = m.mint_address 
       WHERE t.owner_address = $1 
       ORDER BY t.created_at DESC`,
      [userId]
    );
    
    // Format tokens
    const tokens = tokensResult.rows.map(token => ({
      mint: token.mint_address,
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      supply: token.supply,
      owner: token.owner_address,
      freezeAuthority: token.freeze_authority,
      network: token.network_id,
      createdAt: token.created_at,
      metadata: token.description || token.image_url ? {
        description: token.description,
        image: token.image_url
      } : null
    }));
    
    res.json(tokens);
    
  } catch (error) {
    console.error('Error getting user tokens:', error);
    res.status(500).json({ error: 'Failed to get tokens', details: error.message });
  }
});

// Send tokens
router.post('/send', authenticate, async (req, res) => {
  try {
    const { mintAddress, recipient, amount } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!mintAddress || !recipient || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate recipient address
    try {
      new PublicKey(recipient);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid recipient address' });
    }
    
    // Get token from database
    const tokenResult = await query(
      'SELECT * FROM solana_tokens WHERE mint_address = $1',
      [mintAddress]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = tokenResult.rows[0];
    
    // In a real implementation, you would:
    // 1. Get the user's private key securely (or use a signing API)
    // 2. Get token accounts
    // 3. Send tokens
    
    // For this demo, we'll simulate a successful transfer
    const mockSignature = 'signature' + Date.now().toString(36);
    
    // Save transaction to database
    await query(
      `INSERT INTO solana_transactions 
       (signature, transaction_type, from_address, to_address, amount, mint_address, network_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        mockSignature,
        'TRANSFER',
        userId,
        recipient,
        amount,
        mintAddress,
        token.network_id
      ]
    );
    
    res.json({
      success: true,
      signature: mockSignature,
      explorerUrl: `${token.network_id === 'solana-mainnet' ? 'https://explorer.solana.com' : 'https://explorer.solana.com/?cluster=devnet'}/tx/${mockSignature}`
    });
    
  } catch (error) {
    console.error('Error sending tokens:', error);
    res.status(500).json({ error: 'Failed to send tokens', details: error.message });
  }
});

// Batch send tokens (airdrop)
router.post('/airdrop', authenticate, async (req, res) => {
  try {
    const { mintAddress, recipients } = req.body;
    const userId = req.user.id;
    
    // Validate request
    if (!mintAddress || !recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }
    
    // Get token from database
    const tokenResult = await query(
      'SELECT * FROM solana_tokens WHERE mint_address = $1',
      [mintAddress]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const token = tokenResult.rows[0];
    
    // Calculate total amount
    const totalAmount = recipients.reduce((sum, recipient) => sum + parseFloat(recipient.amount), 0);
    
    // In a real implementation, you would:
    // 1. Get the user's private key securely (or use a signing API)
    // 2. Batch send tokens to all recipients
    
    // For this demo, we'll simulate a successful airdrop
    const mockSignature = 'signature' + Date.now().toString(36);
    
    // Save airdrop to database
    await query(
      `INSERT INTO solana_airdrops 
       (sender_address, mint_address, recipient_count, total_amount, signature, network_id) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        userId,
        mintAddress,
        recipients.length,
        totalAmount,
        mockSignature,
        token.network_id
      ]
    );
    
    res.json({
      success: true,
      signature: mockSignature,
      recipientCount: recipients.length,
      totalAmount,
      explorerUrl: `${token.network_id === 'solana-mainnet' ? 'https://explorer.solana.com' : 'https://explorer.solana.com/?cluster=devnet'}/tx/${mockSignature}`
    });
    
  } catch (error) {
    console.error('Error performing airdrop:', error);
    res.status(500).json({ error: 'Failed to perform airdrop', details: error.message });
  }
});

// Request SOL airdrop (devnet/testnet only)
router.post('/request-airdrop', authenticate, async (req, res) => {
  try {
    const { amount, networkId } = req.body;
    const userId = req.user.id;
    
    // Validate network (only allow devnet/testnet)
    if (networkId === 'solana-mainnet') {
      return res.status(400).json({ error: 'Airdrops are only available on devnet and testnet' });
    }
    
    // Get connection
    const connection = getConnection(networkId);
    
    // Request airdrop
    const publicKey = new PublicKey(userId);
    const signature = await connection.requestAirdrop(
      publicKey,
      (amount || 1) * LAMPORTS_PER_SOL
    );
    
    // Confirm transaction
    await connection.confirmTransaction(signature);
    
    res.json({
      success: true,
      signature,
      amount: amount || 1,
      explorerUrl: `${networkId === 'solana-mainnet' ? 'https://explorer.solana.com' : 'https://explorer.solana.com/?cluster=devnet'}/tx/${signature}`
    });
    
  } catch (error) {
    console.error('Error requesting airdrop:', error);
    res.status(500).json({ error: 'Failed to request airdrop', details: error.message });
  }
});

module.exports = router;