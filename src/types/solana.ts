import { PublicKey, Connection, Commitment } from '@solana/web3.js';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';

export interface SolanaNetwork {
  id: string;
  name: string;
  endpoint: string;
  explorerUrl: string;
  network: WalletAdapterNetwork;
  icon: string;
  isTestnet: boolean;
}

export interface SolanaTokenInfo {
  mint: PublicKey;
  name: string;
  symbol: string;
  decimals: number;
  supply: string;
  owner: PublicKey;
  frozenState: boolean;
  metadata?: SolanaTokenMetadata;
}

export interface SolanaTokenMetadata {
  name: string;
  symbol: string;
  description?: string;
  image?: string;
  externalUrl?: string;
  creators?: { address: string; share: number }[];
  attributes?: { trait_type: string; value: string }[];
}

export interface SolanaTokenConfig {
  name: string;
  symbol: string;
  decimals: number;
  initialSupply: string;
  freezeAuthority: boolean;
  metadata: {
    enabled: boolean;
    description?: string;
    image?: string;
    externalUrl?: string;
  };
  network: SolanaNetwork;
}

export interface SolanaTokenDeploymentResult {
  mint: string;
  tokenAccount: string;
  transactionSignature: string;
  network: SolanaNetwork;
  explorerUrl: string;
  metadataAddress?: string;
}

export interface SolanaAirdropRecipient {
  address: string;
  amount: string;
  valid: boolean;
  error?: string;
}

export interface SolanaWalletState {
  isConnected: boolean;
  publicKey: string | null;
  balance: string | null;
  network: SolanaNetwork | null;
  error?: string | null;
}

export interface SolanaConnectionConfig {
  endpoint: string;
  commitment: Commitment;
}