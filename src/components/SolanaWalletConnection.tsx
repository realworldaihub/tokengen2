import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Wallet, LogOut, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { solanaNetworks } from '../config/solanaNetworks';

export const SolanaWalletConnection: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balance, 
    network, 
    error, 
    isConnecting,
    disconnectWallet,
    switchNetwork,
    refreshBalance
  } = useSolanaWallet();
  
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyToClipboard = () => {
    if (publicKey) {
      navigator.clipboard.writeText(publicKey);
      setCopied(true); 
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleNetworkChange = (network: any) => {
    switchNetwork(network);
    setShowNetworkDropdown(false);
  };

  if (isConnected && publicKey) {
    return (
      <div className="flex items-center space-x-4 flex-wrap">
        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{network?.icon || '☀️'}</span>
              <span 
                className="text-sm font-medium text-white cursor-pointer"
                onClick={copyToClipboard}
                title="Click to copy"
              >
                {formatAddress(publicKey)}
                {copied && <span className="ml-2 text-green-400 text-xs">Copied!</span>}
              </span>
              <div className="flex flex-col ml-2">
                <span className="text-xs text-yellow-300">
                  {balance} SOL
                </span>
                <span className="text-xs text-gray-400">
                  {network?.name || 'Unknown Network'}
                </span>
              </div>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <div className="text-lg">{network?.icon || '☀️'}</div>
            </button>
            
            {showNetworkDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-white/10 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  <h3 className="text-white font-medium text-sm px-2 py-1">Select Network</h3>
                  {solanaNetworks.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => handleNetworkChange(net)}
                      className={`w-full flex items-center space-x-2 p-2 rounded-lg transition-colors ${
                        network?.id === net.id
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'text-white hover:bg-white/10'
                      }`}
                    >
                      <span className="text-lg">{net.icon}</span>
                      <span className="text-sm">{net.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => refreshBalance && refreshBalance()}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Refresh balance"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={disconnectWallet}
            className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Disconnect wallet"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center space-x-2">
        <div className="text-red-400 text-xs mr-2 max-w-[200px] truncate bg-red-500/10 px-2 py-1 rounded">
          <AlertTriangle className="w-4 h-4 inline mr-1" />
          <span>{error.length > 30 ? error.slice(0, 30) + '...' : error}</span>
        </div>
        <WalletMultiButton className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-4">
      {isConnecting ? (
        <div className="flex items-center space-x-2 px-6 py-2 bg-yellow-500/20 text-yellow-300 rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-white">Connecting...</span>
        </div>
      ) : (
        <WalletMultiButton className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50" />
      )}
    </div>
  );
};