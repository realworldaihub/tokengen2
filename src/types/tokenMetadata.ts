export interface TokenMetadata {
  id?: number;
  tokenAddress: string;
  name?: string;
  symbol?: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export const TOKEN_CATEGORIES = [
  { id: 'defi', name: 'DeFi' },
  { id: 'gaming', name: 'Gaming' },
  { id: 'utility', name: 'Utility' },
  { id: 'meme', name: 'Meme' },
  { id: 'launchpad', name: 'Launchpad' },
  { id: 'stablecoin', name: 'Stablecoin' },
  { id: 'nft', name: 'NFT' },
  { id: 'governance', name: 'Governance' },
  { id: 'social', name: 'Social' },
  { id: 'privacy', name: 'Privacy' },
  { id: 'infrastructure', name: 'Infrastructure' }
];