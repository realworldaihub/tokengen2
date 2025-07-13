import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { SolanaNetwork } from '../types/solana';
import { solanaNetworks } from '../config/solanaNetworks';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface SolanaNetworkSelectorProps {
  selectedNetwork: SolanaNetwork | null;
  onNetworkSelect: (network: SolanaNetwork) => void;
  className?: string;
  compact?: boolean;
}

export const SolanaNetworkSelector: React.FC<SolanaNetworkSelectorProps> = ({
  selectedNetwork,
  onNetworkSelect,
  className = '',
  compact = false
}) => {
  const { network: connectedNetwork } = useSolanaWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Find current network from connected network
  useEffect(() => {
    if (connectedNetwork && !selectedNetwork) {
      onNetworkSelect(connectedNetwork);
    }
  }, [connectedNetwork, selectedNetwork, onNetworkSelect]);

  const handleNetworkSelect = (network: SolanaNetwork) => {
    onNetworkSelect(network);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center space-x-2 ${
          compact 
            ? 'px-3 py-1.5 text-sm' 
            : 'px-4 py-2'
        } bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors border border-white/20`}
      >
        {selectedNetwork ? (
          <>
            <span className="text-lg">{selectedNetwork.icon}</span>
            {!compact && <span>{selectedNetwork.name}</span>}
            {compact && <span className="text-xs">{selectedNetwork.name.replace('Solana ', '')}</span>}
          </>
        ) : (
          <>
            <span className="text-lg">☀️</span>
            <span>Select Solana Network</span>
          </>
        )}
        <ChevronDown className="w-4 h-4" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-64 bg-slate-800 border border-white/10 rounded-xl shadow-xl overflow-hidden">
          <div className="p-3 border-b border-white/10">
            <h3 className="text-white font-medium">Select Solana Network</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto p-2">
            {solanaNetworks.map((network) => (
              <button
                key={network.id}
                onClick={() => handleNetworkSelect(network)}
                className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                  selectedNetwork?.id === network.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{network.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{network.name}</div>
                    <div className="text-xs text-gray-400">{network.isTestnet ? 'Testnet' : 'Mainnet'}</div>
                  </div>
                </div>
                {selectedNetwork?.id === network.id && (
                  <Check className="w-4 h-4" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};