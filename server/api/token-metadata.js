const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { Web3Storage, File } = require('web3.storage');
const { ethers } = require('ethers');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 // 1MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPG, PNG, and WebP files are allowed'));
    }
    cb(null, true);
  }
});

// Get Web3.Storage client
function getWeb3StorageClient() {
  const token = process.env.WEB3_STORAGE_TOKEN;
  if (!token) {
    console.warn('WEB3_STORAGE_TOKEN not set, IPFS uploads will not work');
    return null;
  }
  return new Web3Storage({ token });
}

// Save temporary metadata (pre-deployment)
router.post('/temporary', authenticate, async (req, res) => {
  try {
    const { sessionId, name, symbol, description, logoData, websiteUrl, twitterUrl, telegramUrl, discordUrl, whitepaperUrl, githubUrl, tags } = req.body;
    const userAddress = req.user.address.toLowerCase();
    
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    
    // Check if session already exists
    const existingResult = await query(
      'SELECT * FROM temporary_metadata WHERE session_id = $1',
      [sessionId]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing temporary metadata
      const result = await query(
        `UPDATE temporary_metadata 
         SET name = $1, symbol = $2, description = $3, logo_data = $4, 
             website_url = $5, twitter_url = $6, telegram_url = $7, 
             discord_url = $8, whitepaper_url = $9, github_url = $10, 
             tags = $11, expires_at = (CURRENT_TIMESTAMP + INTERVAL '24 hours')
         WHERE session_id = $12
         RETURNING *`,
        [
          name,
          symbol,
          description,
          logoData,
          websiteUrl,
          twitterUrl,
          telegramUrl,
          discordUrl,
          whitepaperUrl,
          githubUrl,
          tags,
          sessionId
        ]
      );
      
      res.json(result.rows[0]);
    } else {
      // Create new temporary metadata
      const result = await query(
        `INSERT INTO temporary_metadata 
         (session_id, creator_address, name, symbol, description, logo_data, 
          website_url, twitter_url, telegram_url, discord_url, 
          whitepaper_url, github_url, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING *`,
        [
          sessionId,
          userAddress,
          name,
          symbol,
          description,
          logoData,
          websiteUrl,
          twitterUrl,
          telegramUrl,
          discordUrl,
          whitepaperUrl,
          githubUrl,
          tags
        ]
      );
      
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error saving temporary metadata:', error);
    res.status(500).json({ error: 'Failed to save temporary metadata', details: error.message });
  }
});

// Link temporary metadata to token
router.post('/link', authenticate, async (req, res) => {
  try {
    const { tokenAddress, sessionId } = req.body;
    const userAddress = req.user.address.toLowerCase();
    
    if (!tokenAddress || !sessionId) {
      return res.status(400).json({ error: 'Token address and session ID are required' });
    }
    
    // Validate token ownership
    const tokenResult = await query(
      'SELECT owner_address FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
    
    // Check if user is the token owner
    if (tokenOwner !== userAddress) {
      return res.status(403).json({ error: 'Only the token owner can link metadata' });
    }
    
    // Get temporary metadata
    const tempResult = await query(
      'SELECT * FROM temporary_metadata WHERE session_id = $1 AND creator_address = $2',
      [sessionId, userAddress]
    );
    
    if (tempResult.rows.length === 0) {
      return res.status(404).json({ error: 'Temporary metadata not found' });
    }
    
    const tempMetadata = tempResult.rows[0];
    
    // Check if metadata already exists for this token
    const existingResult = await query(
      'SELECT * FROM token_metadata WHERE token_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    let logoUrl = null;
    
    // If there's a logo, upload it to IPFS
    if (tempMetadata.logo_data) {
      try {
        // Convert base64 to file
        const base64Data = tempMetadata.logo_data.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        
        // Create temporary file
        const tempFilePath = path.join(__dirname, '..', '..', 'uploads', `temp-${Date.now()}.png`);
        fs.writeFileSync(tempFilePath, buffer);
        
        // Upload to IPFS
        const client = getWeb3StorageClient();
        if (client) {
          const fileName = `token-logo-${tokenAddress.toLowerCase()}.png`;
          const files = [
            new File([fs.readFileSync(tempFilePath)], fileName)
          ];
          
          const cid = await client.put(files);
          logoUrl = `https://${cid}.ipfs.dweb.link/${fileName}`;
          
          // Clean up temp file
          fs.unlinkSync(tempFilePath);
        }
      } catch (error) {
        console.error('Error uploading logo to IPFS:', error);
        // Continue without logo if upload fails
      }
    }
    
    if (existingResult.rows.length > 0) {
      // Update existing metadata
      const result = await query(
        `UPDATE token_metadata 
         SET name = $1, symbol = $2, description = $3, logo_url = COALESCE($4, logo_url), 
             website_url = $5, twitter_url = $6, telegram_url = $7, 
             discord_url = $8, whitepaper_url = $9, github_url = $10, 
             tags = $11, last_updated_by = $12, update_count = update_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE token_address = $13
         RETURNING *`,
        [
          tempMetadata.name,
          tempMetadata.symbol,
          tempMetadata.description,
          logoUrl,
          tempMetadata.website_url,
          tempMetadata.twitter_url,
          tempMetadata.telegram_url,
          tempMetadata.discord_url,
          tempMetadata.whitepaper_url,
          tempMetadata.github_url,
          tempMetadata.tags,
          userAddress,
          tokenAddress.toLowerCase()
        ]
      );
      
      // Delete temporary metadata
      await query(
        'DELETE FROM temporary_metadata WHERE session_id = $1',
        [sessionId]
      );
      
      res.json(result.rows[0]);
    } else {
      // Create new metadata
      const result = await query(
        `INSERT INTO token_metadata 
         (token_address, name, symbol, description, logo_url, 
          website_url, twitter_url, telegram_url, discord_url, 
          whitepaper_url, github_url, tags, last_updated_by, update_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1)
         RETURNING *`,
        [
          tokenAddress.toLowerCase(),
          tempMetadata.name,
          tempMetadata.symbol,
          tempMetadata.description,
          logoUrl,
          tempMetadata.website_url,
          tempMetadata.twitter_url,
          tempMetadata.telegram_url,
          tempMetadata.discord_url,
          tempMetadata.whitepaper_url,
          tempMetadata.github_url,
          tempMetadata.tags,
          userAddress
        ]
      );
      
      // Delete temporary metadata
      await query(
        'DELETE FROM temporary_metadata WHERE session_id = $1',
        [sessionId]
      );
      
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error linking metadata:', error);
    res.status(500).json({ error: 'Failed to link metadata', details: error.message });
  }
});

// Get metadata history
router.get('/:tokenAddress/history', authenticate, async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const userAddress = req.user.address.toLowerCase();
    
    // Validate token ownership
    const tokenResult = await query(
      'SELECT owner_address FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
    
    // Only token owner can view history
    if (tokenOwner !== userAddress) {
      return res.status(403).json({ error: 'Only the token owner can view metadata history' });
    }
    
    // Get metadata history
    const result = await query(
      `SELECT * FROM token_metadata_history 
       WHERE token_address = $1 
       ORDER BY update_timestamp DESC`,
      [tokenAddress.toLowerCase()]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching metadata history:', error);
    res.status(500).json({ error: 'Failed to fetch metadata history', details: error.message });
  }
});

// Verify token metadata (admin only)
router.post('/:tokenAddress/verify', authenticate, async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const userAddress = req.user.address.toLowerCase();
    
    // Check if user is admin
    const adminAddresses = (process.env.ADMIN_ADDRESSES || '').split(',').map(a => a.toLowerCase());
    if (!adminAddresses.includes(userAddress)) {
      return res.status(403).json({ error: 'Only admins can verify metadata' });
    }
    
    // Update verification status
    const result = await query(
      `UPDATE token_metadata 
       SET verified = true, updated_at = CURRENT_TIMESTAMP
       WHERE token_address = $1
       RETURNING *`,
      [tokenAddress.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token metadata not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error verifying metadata:', error);
    res.status(500).json({ error: 'Failed to verify metadata', details: error.message });
  }
});

// Get token metadata by address
router.get('/:tokenAddress', async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    
    const result = await query(
      'SELECT * FROM token_metadata WHERE token_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token metadata not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching token metadata:', error);
    res.status(500).json({ error: 'Failed to fetch token metadata', details: error.message });
  }
});

// Create or update token metadata
router.post('/', authenticate, async (req, res) => {
  try {
    const metadata = req.body;
    const userAddress = req.user.address.toLowerCase();
    
    // Validate token ownership
    let tokenOwner = '';
    
    // If token address is provided, verify ownership
    if (metadata.tokenAddress) {
      const tokenResult = await query(
        'SELECT owner_address FROM tokens WHERE contract_address = $1',
        [metadata.tokenAddress.toLowerCase()]
      );
      
      if (tokenResult.rows.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
      
      // Check if user is the token owner
      if (tokenOwner !== userAddress) {
        return res.status(403).json({ error: 'Only the token owner can update metadata' });
      }
    }
    
    // Check if metadata already exists
    const existingResult = await query(
      'SELECT * FROM token_metadata WHERE token_address = $1',
      [metadata.tokenAddress.toLowerCase()]
    );
    
    if (existingResult.rows.length > 0) {
      // Update existing metadata
      const result = await query(
        `UPDATE token_metadata 
         SET name = $1, symbol = $2, description = $3, logo_url = $4, 
             website_url = $5, twitter_url = $6, telegram_url = $7, 
             discord_url = $8, whitepaper_url = $9, github_url = $10,
             tags = $11, last_updated_by = $12, update_count = update_count + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE token_address = $13
         RETURNING *`,
        [
          metadata.name,
          metadata.symbol,
          metadata.description,
          metadata.logoUrl,
          metadata.websiteUrl,
          metadata.twitterUrl,
          metadata.telegramUrl,
          metadata.discordUrl,
          metadata.whitepaperUrl,
          metadata.githubUrl,
          metadata.tags,
          userAddress,
          metadata.tokenAddress.toLowerCase()
        ]
      );
      
      res.json(result.rows[0]);
    } else {
      // Create new metadata
      const result = await query(
        `INSERT INTO token_metadata 
         (token_address, name, symbol, description, logo_url, 
          website_url, twitter_url, telegram_url, discord_url, 
          whitepaper_url, github_url, tags, last_updated_by, update_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 1)
         RETURNING *`,
        [
          metadata.tokenAddress.toLowerCase(),
          metadata.name,
          metadata.symbol,
          metadata.description,
          metadata.logoUrl,
          metadata.websiteUrl,
          metadata.twitterUrl,
          metadata.telegramUrl,
          metadata.discordUrl,
          metadata.whitepaperUrl,
          metadata.githubUrl,
          metadata.tags,
          userAddress
        ]
      );
      
      res.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error saving token metadata:', error);
    res.status(500).json({ error: 'Failed to save token metadata', details: error.message });
  }
});

// Update token metadata
router.put('/:tokenAddress', authenticate, async (req, res) => {
  try {
    const { tokenAddress } = req.params;
    const metadata = req.body;
    const userAddress = req.user.address.toLowerCase();
    
    // Validate token ownership
    const tokenResult = await query(
      'SELECT owner_address FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
    
    // Check if user is the token owner
    if (tokenOwner !== userAddress) {
      return res.status(403).json({ error: 'Only the token owner can update metadata' });
    }
    
    // Update metadata
    const result = await query(
      `UPDATE token_metadata 
       SET name = $1, symbol = $2, description = $3, logo_url = $4, 
           website_url = $5, twitter_url = $6, telegram_url = $7, 
           discord_url = $8, whitepaper_url = $9, github_url = $10, 
           tags = $11, updated_at = CURRENT_TIMESTAMP
       WHERE token_address = $12
       RETURNING *`,
      [
        metadata.name,
        metadata.symbol,
        metadata.description,
        metadata.logoUrl,
        metadata.websiteUrl,
        metadata.twitterUrl,
        metadata.telegramUrl,
        metadata.discordUrl,
        metadata.whitepaperUrl,
        metadata.githubUrl,
        metadata.tags,
        tokenAddress.toLowerCase()
      ]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Token metadata not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating token metadata:', error);
    res.status(500).json({ error: 'Failed to update token metadata', details: error.message });
  }
});

// Upload logo
router.post('/upload-logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    const { tokenAddress } = req.body;
    const userAddress = req.user.address.toLowerCase();
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    let tokenOwner = '';
    
    // If token address is provided, verify ownership
    if (tokenAddress) {
      const tokenResult = await query(
        'SELECT owner_address FROM tokens WHERE contract_address = $1',
        [tokenAddress.toLowerCase()]
      );
      
      if (tokenResult.rows.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }
      
      tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
      
      // Check if user is the token owner
      if (tokenOwner !== userAddress) {
        return res.status(403).json({ error: 'Only the token owner can upload a logo' });
      }
    }
    
    // Upload to IPFS if Web3.Storage is configured
    let logoUrl = '';
    const client = getWeb3StorageClient();
    
    if (client) {
      try {
        // Read file from disk
        const fileData = fs.readFileSync(req.file.path);
        const fileName = `token-logo-${tokenAddress.toLowerCase()}${path.extname(req.file.originalname)}`;
        
        // Create a File object
        const files = [
          new File([fileData], fileName)
        ];
        
        // Upload to IPFS
        const cid = await client.put(files);
        logoUrl = `https://${cid}.ipfs.dweb.link/${fileName}`;
        
        console.log(`Uploaded to IPFS with CID: ${cid}`);
      } catch (ipfsError) {
        console.error('Error uploading to IPFS:', ipfsError);
        // Fall back to local URL if IPFS upload fails
        logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
      }
    } else {
      // Use local URL if Web3.Storage is not configured
      logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }
    
    // Update logo URL in database
    if (tokenAddress) {
      await query(
        `UPDATE token_metadata 
         SET logo_url = $1, updated_at = CURRENT_TIMESTAMP, last_updated_by = $3
         WHERE token_address = $2`,
        [logoUrl, tokenAddress.toLowerCase(), userAddress]
      );
    }
    
    res.json({ logoUrl });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo', details: error.message });
  }
});

// Verify token ownership on-chain
async function verifyTokenOwnership(tokenAddress, walletAddress) {
  try {
    // Get network from token
    const tokenResult = await query(
      'SELECT network_id FROM tokens WHERE contract_address = $1',
      [tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return false;
    }
    
    const networkId = tokenResult.rows[0].network_id;
    const rpcUrl = process.env[`${networkId.toUpperCase()}_RPC_URL`];
    
    if (!rpcUrl) {
      console.warn(`No RPC URL configured for network: ${networkId}`);
      return false;
    }
    
    // Connect to the network
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Call owner() function on the token contract
    const ownerAbi = ['function owner() view returns (address)'];
    const contract = new ethers.Contract(tokenAddress, ownerAbi, provider);
    
    try {
      const owner = await contract.owner();
      return owner.toLowerCase() === walletAddress.toLowerCase();
    } catch (error) {
      console.error('Error calling owner() function:', error);
      return false;
    }
  } catch (error) {
    console.error('Error verifying token ownership:', error);
    return false;
  }
}

module.exports = router;