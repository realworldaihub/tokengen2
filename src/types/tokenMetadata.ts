export interface TokenMetadata {
  id?: number;
  tokenAddress: string;
  sessionId?: string;
  name?: string;
  symbol?: string;
  description?: string;
  logoUrl?: string;
  logoData?: string; // Base64 encoded image for preview
  websiteUrl?: string;
  twitterUrl?: string;
  telegramUrl?: string;
  discordUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
  updateCount?: number;
  lastUpdatedBy?: string;
  verified?: boolean;
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

export interface MetadataPreview {
  type: 'launchpad' | 'explorer' | 'dex';
  title: string;
  description: string;
}

export const METADATA_PREVIEWS: MetadataPreview[] = [
  {
    type: 'launchpad',
    title: 'Launchpad Preview',
    description: 'How your token will appear on the launchpad'
  },
  {
    type: 'explorer',
    title: 'Explorer Preview',
    description: 'How your token will appear in the token explorer'
  },
  {
    type: 'dex',
    title: 'DEX Preview',
    description: 'How your token will appear on DEX interfaces'
  }
];