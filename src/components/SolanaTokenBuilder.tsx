import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Info, AlertCircle } from 'lucide-react';
import { SolanaTokenConfig } from '../types/solana';
import { solanaNetworks, getDefaultSolanaNetwork } from '../config/solanaNetworks';
import { SolanaNetworkSelector } from './SolanaNetworkSelector';
import { useSolanaWallet } from '../hooks/useSolanaWallet';

interface SolanaTokenBuilderProps {
  onBack: () => void;
  onNext: (config: SolanaTokenConfig) => void;
  initialConfig?: Partial<SolanaTokenConfig>;
}

export const SolanaTokenBuilder: React.FC<SolanaTokenBuilderProps> = ({ 
  onBack, 
  onNext, 
  initialConfig 
}) => {
  const { network: connectedNetwork } = useSolanaWallet();
  
  const [config, setConfig] = useState<SolanaTokenConfig>({
    name: '',
    symbol: '',
    decimals: 9,
    initialSupply: '',
    freezeAuthority: false,
    metadata: {
      enabled: false,
      description: '',
      image: '',
      externalUrl: ''
    },
    network: connectedNetwork || getDefaultSolanaNetwork(),
    ...initialConfig
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConfig = (updates: Partial<SolanaTokenConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const updateMetadata = (updates: Partial<SolanaTokenConfig['metadata']>) => {
    setConfig(prev => ({
      ...prev,
      metadata: { ...prev.metadata, ...updates }
    }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!config.name.trim()) {
      newErrors.name = 'Please enter a token name';
    }

    if (!config.symbol.trim()) {
      newErrors.symbol = 'Please enter a token symbol';
    } else if (config.symbol.length > 10) {
      newErrors.symbol = 'Symbol must be 10 characters or less';
    }

    if (!config.initialSupply || parseFloat(config.initialSupply) <= 0) {
      newErrors.initialSupply = 'Initial supply must be greater than 0';
    }

    if (config.metadata.enabled) {
      if (config.metadata.description && config.metadata.description.length > 300) {
        newErrors.description = 'Description must be 300 characters or less';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onNext(config);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Solana Token Builder</h1>
          <p className="text-gray-300">Configure your SPL token parameters</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Token Info */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Basic Information</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => updateConfig({ name: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., My Solana Token"
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={config.symbol}
                  onChange={(e) => updateConfig({ symbol: e.target.value.toUpperCase() })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., MST"
                />
                {errors.symbol && <p className="text-red-400 text-sm mt-1">{errors.symbol}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Decimals
                </label>
                <select
                  value={config.decimals}
                  onChange={(e) => updateConfig({ decimals: parseInt(e.target.value) })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={9}>9 (Standard for Solana)</option>
                  <option value={6}>6</option>
                  <option value={0}>0</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Initial Supply
                </label>
                <input
                  type="number"
                  value={config.initialSupply}
                  onChange={(e) => updateConfig({ initialSupply: e.target.value })}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., 1000000"
                />
                {errors.initialSupply && <p className="text-red-400 text-sm mt-1">{errors.initialSupply}</p>}
              </div>
            </div>
          </div>

          {/* Network Selection */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Network Selection</h2>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {solanaNetworks.map((network) => (
                <div
                  key={network.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    config.network.id === network.id
                      ? 'border-blue-500 bg-blue-500/20 text-blue-400'
                      : 'border-white/20 bg-white/5 text-gray-300 hover:border-white/40'
                  }`}
                  onClick={() => updateConfig({ network })}
                >
                  <div className="text-center">
                    <div className="text-2xl mb-1">{network.icon}</div>
                    <div className="text-xs font-medium">{network.name}</div>
                    <div className="text-xs opacity-75">{network.isTestnet ? 'Testnet' : 'Mainnet'}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {config.network.isTestnet && (
              <div className="p-3 bg-green-500/20 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <Info className="w-4 h-4 text-green-400" />
                  <span className="text-green-400 font-medium">Testnet Selected</span>
                </div>
                <p className="text-green-300 text-sm mt-1">
                  You can request an airdrop of SOL for testing purposes on this network.
                </p>
              </div>
            )}
            
            {!config.network.isTestnet && (
              <div className="p-3 bg-amber-500/20 rounded-lg mb-4">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span className="text-amber-400 font-medium">Mainnet Selected</span>
                </div>
                <p className="text-amber-300 text-sm mt-1">
                  You are creating a token on the main Solana network. This will require SOL for transaction fees.
                </p>
              </div>
            )}
          </div>

          {/* Token Features */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10">
            <h2 className="text-xl font-semibold text-white mb-6">Token Features</h2>
            
            <div className="space-y-6">
              {/* Freeze Authority */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="freezeAuthority"
                      checked={config.freezeAuthority}
                      onChange={(e) => updateConfig({ freezeAuthority: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="freezeAuthority" className="text-white font-medium">
                      Freeze Authority
                    </label>
                  </div>
                  <Info className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm text-gray-400">
                  Allow freezing token accounts
                </span>
              </div>

              {/* Metadata */}
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="metadata"
                        checked={config.metadata.enabled}
                        onChange={(e) => updateMetadata({ enabled: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <label htmlFor="metadata" className="text-white font-medium">
                        Token Metadata
                      </label>
                    </div>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                  <span className="text-sm text-gray-400">
                    Add on-chain metadata
                  </span>
                </div>
                
                {config.metadata.enabled && (
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={config.metadata.description}
                        onChange={(e) => updateMetadata({ description: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Brief description of your token"
                        rows={3}
                        maxLength={300}
                      />
                      <div className="flex justify-between text-xs mt-1">
                        <span className={errors.description ? 'text-red-400' : 'text-gray-400'}>
                          {errors.description || `${config.metadata.description?.length || 0}/300 characters`}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        External URL
                      </label>
                      <input
                        type="text"
                        value={config.metadata.externalUrl}
                        onChange={(e) => updateMetadata({ externalUrl: e.target.value })}
                        className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Important Notice</h3>
                <p className="text-amber-300 text-sm">
                  Once deployed, token parameters cannot be changed. Please review all settings carefully 
                  before proceeding to the next step.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
            >
              Back
            </button>
            
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <span>Continue to Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};