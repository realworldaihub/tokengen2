import { useState, useEffect, useCallback } from 'react';
import { MODE_STORAGE_KEY, DEFAULT_MODE } from '../config/constants';
import { web3Service } from '../services/web3Service';

type NetworkMode = 'mainnet' | 'testnet';

export const useNetworkMode = () => {
  // Initialize from localStorage or default
  const [mode, setMode] = useState<NetworkMode>(() => {
    const savedMode = localStorage.getItem(MODE_STORAGE_KEY);
    return (savedMode === 'mainnet' || savedMode === 'testnet') 
      ? savedMode 
      : DEFAULT_MODE;
  });

  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');


  // Toggle between mainnet and testnet
  const toggleMode = useCallback(async () => {
    const newMode: NetworkMode = mode === 'mainnet' ? 'testnet' : 'mainnet';
    
    // Save to localStorage immediately
    localStorage.setItem(MODE_STORAGE_KEY, newMode);
    
    // Update state
    setMode(newMode);
    
    // Show banner notification
    setBannerMessage(`${newMode === 'mainnet' ? 'Mainnet' : 'Testnet'} Mode Activated`);
    setShowBanner(true);
    
    // Try to switch network automatically based on new mode
    try {
      const currentNetwork = await web3Service.getCurrentNetwork();
      if (currentNetwork) {
        // Get appropriate networks based on new mode
        const targetNetworks = newMode === 'testnet' 
          ? [5, 97, 80001, 421614, 4002, 43113, 338, 7771, 25062019] // Testnet chain IDs
          : [1, 56, 137, 42161, 250, 43114, 25, 1116, 2000, 369, 7000, 130, 7171, 3797, 1071, 8453, 25062019]; // Mainnet chain IDs
        
        // If current network doesn't match the new mode, switch to first network of appropriate type
        const isCurrentNetworkCorrectType = newMode === 'testnet'
          ? targetNetworks.includes(currentNetwork.chainId)
          : !targetNetworks.includes(currentNetwork.chainId);
          
        if (!isCurrentNetworkCorrectType && targetNetworks.length > 0) {
          await web3Service.switchNetwork({
            id: newMode === 'testnet' ? 'goerli' : 'ethereum',
            name: newMode === 'testnet' ? 'Goerli' : 'Ethereum',
            symbol: 'ETH',
            chainId: targetNetworks[0],
            rpcUrl: '',
            explorerUrl: '',
            gasPrice: ''
          });
        }
      }
    } catch (error) {
      console.error('Failed to switch network after mode change:', error);
    }
    
    // Hide banner after 3 seconds
    setTimeout(() => {
      setShowBanner(false);
    }, 3000);
  }, [mode]);

  // Check if we're in testnet mode
  const isTestnetMode = mode === 'testnet';

  return {
    mode,
    isTestnetMode,
    toggleMode,
    showBanner,
    bannerMessage,
    setShowBanner
  };
};