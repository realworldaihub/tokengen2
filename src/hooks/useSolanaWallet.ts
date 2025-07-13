import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';
import { SolanaWalletState, SolanaNetwork } from '../types/solana';
import { solanaService } from '../services/solanaService';
import { getDefaultSolanaNetwork } from '../config/solanaNetworks';

export const useSolanaWallet = () => {
  const { 
    publicKey, 
    connected, 
    connecting, 
    disconnect, 
    select, 
    wallets, 
    wallet 
  } = useWallet();
  
  const [state, setState] = useState<SolanaWalletState>({
    isConnected: false,
    publicKey: null,
    balance: null,
    network: getDefaultSolanaNetwork()
  });
  
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize connection with the default network
  useEffect(() => {
    if (state.network) {
      try {
        solanaService.initializeConnection(state.network);
      } catch (error) {
        console.error('Failed to initialize Solana connection:', error);
        setError('Failed to connect to Solana network');
      }
    }
  }, [state.network]);

  // Update state when wallet connection changes
  useEffect(() => {
    if (connected && publicKey) {
      setState(prev => ({
        ...prev,
        isConnected: true,
        publicKey: publicKey.toString()
      }));
      
      // Fetch balance
      fetchBalance(publicKey.toString());
    } else {
      setState(prev => ({
        ...prev,
        isConnected: false,
        publicKey: null,
        balance: null
      }));
    }
  }, [connected, publicKey]);

  // Fetch SOL balance
  const fetchBalance = async (address: string) => {
    try {
      if (solanaService.getConnection()) {
        const balance = await solanaService.getBalance(address);
        setState(prev => ({ ...prev, balance }));
      }
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  // Connect to wallet
  const connectWallet = useCallback(async (walletName?: WalletName) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      if (walletName) {
        select(walletName);
      } else if (wallets.length > 0) {
        // Default to first available wallet
        select(wallets[0].adapter.name);
      } else {
        throw new Error('No wallets available');
      }
      
      // Note: The actual connection happens through the wallet adapter
      // and will be reflected in the 'connected' state
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError((error as Error).message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [select, wallets]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    disconnect();
  }, [disconnect]);

  // Switch network
  const switchNetwork = useCallback((network: SolanaNetwork) => {
    try {
      solanaService.initializeConnection(network);
      setState(prev => ({ ...prev, network }));
      
      // Save to localStorage
      localStorage.setItem('solana-network-id', network.id);
      
      // Refresh balance if connected
      if (state.publicKey) {
        fetchBalance(state.publicKey);
      }
      
      return true;
    } catch (error) {
      console.error('Error switching network:', error);
      setError((error as Error).message || 'Failed to switch network');
      return false;
    }
  }, [state.publicKey]);

  // Request airdrop (devnet/testnet only)
  const requestAirdrop = useCallback(async (amount: number = 1): Promise<string | null> => {
    if (!state.publicKey) {
      setError('Wallet not connected. Please connect your wallet first.');
      return null;
    }
    
    if (!state.network?.isTestnet) {
      setError('Airdrops are only available on Devnet or Testnet. Please switch networks.');
      return null;
    }
    
    try {
      const signature = await solanaService.requestAirdrop(state.publicKey, amount);
      await fetchBalance(state.publicKey);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      setError((error as Error).message || 'Failed to request airdrop');
      return null;
    }
  }, [state.publicKey]);

  return {
    ...state,
    isConnecting,
    error: error as string | null,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    requestAirdrop,
    refreshBalance: state.publicKey ? () => fetchBalance(state.publicKey) : undefined,
    availableWallets: wallets,
    currentWallet: wallet
  };
};