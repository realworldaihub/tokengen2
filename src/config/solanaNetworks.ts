import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { SolanaNetwork } from '../types/solana';

export const SOLANA_MAINNET: SolanaNetwork = {
  id: 'solana-mainnet',
  name: 'Solana Mainnet',
  endpoint: 'https://api.mainnet-beta.solana.com',
  explorerUrl: 'https://explorer.solana.com',
  network: WalletAdapterNetwork.Mainnet,
  icon: '☀️',
  isTestnet: false
};

export const SOLANA_DEVNET: SolanaNetwork = {
  id: 'solana-devnet',
  name: 'Solana Devnet',
  endpoint: 'https://api.devnet.solana.com',
  explorerUrl: 'https://explorer.solana.com/?cluster=devnet',
  network: WalletAdapterNetwork.Devnet,
  icon: '🌤️',
  isTestnet: true
};

export const SOLANA_TESTNET: SolanaNetwork = {
  id: 'solana-testnet',
  name: 'Solana Testnet',
  endpoint: 'https://api.testnet.solana.com',
  explorerUrl: 'https://explorer.solana.com/?cluster=testnet',
  network: WalletAdapterNetwork.Testnet,
  icon: '🌥️',
  isTestnet: true
};

export const solanaNetworks: SolanaNetwork[] = [
  SOLANA_MAINNET,
  SOLANA_DEVNET,
  SOLANA_TESTNET
];

export const getSolanaNetworkById = (id: string): SolanaNetwork => {
  const network = solanaNetworks.find(n => n.id === id);
  if (!network) {
    return SOLANA_DEVNET; // Default to devnet if not found
  }
  return network;
};

export const getSolanaNetworkByName = (name: WalletAdapterNetwork): SolanaNetwork => {
  const network = solanaNetworks.find(n => n.network === name);
  if (!network) {
    return SOLANA_DEVNET; // Default to devnet if not found
  }
  return network;
};

export const getDefaultSolanaNetwork = (): SolanaNetwork => {
  const savedNetworkId = localStorage.getItem('solana-network-id');
  if (savedNetworkId) {
    const network = getSolanaNetworkById(savedNetworkId);
    return network;
  }
  return SOLANA_DEVNET; // Default to devnet
};