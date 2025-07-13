const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { query } = require('../db');
const { authenticate } = require('../middleware/auth');
const { Web3Storage, File } = require('web3.storage');

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
    const tokenResult = await query(
      'SELECT owner_address FROM tokens WHERE contract_address = $1',
      [metadata.tokenAddress.toLowerCase()]
    );
    
    if (tokenResult.rows.length === 0) {
      return res.status(404).json({ error: 'Token not found' });
    }
    
    const tokenOwner = tokenResult.rows[0].owner_address.toLowerCase();
    
    // Check if user is the token owner
    if (tokenOwner !== userAddress) {
      return res.status(403).json({ error: 'Only the token owner can update metadata' });
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
          whitepaper_url, github_url, tags)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
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
          metadata.tags
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
      return res.status(403).json({ error: 'Only the token owner can upload a logo' });
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
    await query(
      `UPDATE token_metadata 
       SET logo_url = $1, updated_at = CURRENT_TIMESTAMP
       WHERE token_address = $2`,
      [logoUrl, tokenAddress.toLowerCase()]
    );
    
    res.json({ logoUrl });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ error: 'Failed to upload logo', details: error.message });
  }
});

module.exports = router;