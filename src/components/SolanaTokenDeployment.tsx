import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, AlertTriangle, Shield, Zap } from 'lucide-react';
import { SolanaTokenConfig, SolanaTokenDeploymentResult } from '../types/solana';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { solanaService } from '../services/solanaService';

interface SolanaTokenDeploymentProps {
  config: SolanaTokenConfig;
  onBack: () => void;
  onDeploy: (result: SolanaTokenDeploymentResult) => void;
}

export const SolanaTokenDeployment: React.FC<SolanaTokenDeploymentProps> = ({ 
  config, 
  onBack, 
  onDeploy 
}) => {
  const { publicKey, balance, network } = useSolanaWallet();
  const [isDeploying, setIsDeploying] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estimatedFee, setEstimatedFee] = useState('0.00001');

  // Check if user has enough SOL for deployment
  const hasEnoughBalance = () => {
    if (!balance) return false;
    return parseFloat(balance) >= parseFloat(estimatedFee);
  };

  // Estimate deployment fee based on network and features
  useEffect(() => {
    // This is a simplified estimate - in a real app, you'd calculate this more precisely
    let baseFee = 0.00001; // Base fee for token creation
    
    if (config.metadata.enabled) {
      baseFee += 0.00002; // Additional fee for metadata
    }
    
    setEstimatedFee(baseFee.toFixed(5));
  }, [config]);

  const handleDeploy = async () => {
    if (!agreed || !publicKey || !hasEnoughBalance()) return;
    
    setIsDeploying(true);
    setError(null);
    
    try {
      // In a real implementation, you would:
      // 1. Get the user's private key securely (or use a signing API)
      // 2. Call solanaService.createToken with the config and private key
      // 3. Handle the result
      
      // For this demo, we'll simulate a successful deployment
      const mockResult: SolanaTokenDeploymentResult = {
        mint: 'So1ana111111111111111111111111111111111111111',
        tokenAccount: 'TokenAccount111111111111111111111111111111',
        transactionSignature: 'signature111111111111111111111111111111111111111111',
        network: config.network,
        explorerUrl: `${config.network.explorerUrl}/address/So1ana111111111111111111111111111111111111111`,
        metadataAddress: config.metadata.enabled ? 'metadata111111111111111111111111111111' : undefined
      };
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      onDeploy(mockResult);
    } catch (error) {
      console.error('Deployment failed:', error);
      setError((error as Error).message || 'Failed to deploy token');
    } finally {
      setIsDeploying(false);
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
            <span>Back to Token Builder</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white mb-2">Review & Deploy</h1>
          <p className="text-gray-300">Review your SPL token configuration before deployment</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Token Details */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Token Details</h2>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Name</label>
                  <div className="text-white font-medium">{config.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
                  <div className="text-white font-medium">{config.symbol}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Decimals</label>
                  <div className="text-white font-medium">{config.decimals}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Initial Supply</label>
                  <div className="text-white font-medium">{parseInt(config.initialSupply).toLocaleString()}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Network</label>
                  <div className="text-white font-medium">{config.network.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Freeze Authority</label>
                  <div className="text-white font-medium">{config.freezeAuthority ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
            </div>

            {/* Metadata */}
            {config.metadata.enabled && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h2 className="text-xl font-semibold text-white mb-4">Token Metadata</h2>
                
                <div className="space-y-3">
                  {config.metadata.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <div className="text-white">{config.metadata.description}</div>
                    </div>
                  )}
                  
                  {config.metadata.externalUrl && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">External URL</label>
                      <div className="text-white">{config.metadata.externalUrl}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Terms */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Terms & Conditions</h2>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="agree"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="agree" className="text-white text-sm">
                    I understand that deployed tokens cannot be modified and I am responsible for the contract
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deployment Summary */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Deployment Summary</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Network</span>
                  <div className="flex items-center">
                    <span className="text-white font-medium">{config.network.name}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Estimated Fee</span>
                  <span className="text-white font-medium">{estimatedFee} SOL</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Your Balance</span>
                  <span className={`font-medium ${hasEnoughBalance() ? 'text-green-400' : 'text-red-400'}`}>
                    {balance || '0'} SOL
                  </span>
                </div>
                <div className="border-t border-white/20 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">Status</span>
                    {hasEnoughBalance() ? (
                      <span className="text-green-400 font-medium">Ready to deploy</span>
                    ) : (
                      <span className="text-red-400 font-medium">Insufficient balance</span>
                    )}
                  </div>
                </div>
              </div>
              
              {!hasEnoughBalance() && (
                <div className="mt-4 p-3 bg-red-500/20 rounded-lg">
                  <p className="text-red-300 text-sm">
                    You need at least {estimatedFee} SOL to deploy this token.
                    {config.network.isTestnet && " You can request an airdrop on this testnet."}
                  </p>
                </div>
              )}
            </div>

            {/* Features */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">What's Included</h3>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Shield className="w-4 h-4 text-green-400" />
                  <span className="text-white text-sm">SPL token standard</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <span className="text-white text-sm">Fast Solana transactions</span>
                </div>
                {config.metadata.enabled && (
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">On-chain metadata</span>
                  </div>
                )}
                {config.freezeAuthority && (
                  <div className="flex items-center space-x-3">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <span className="text-white text-sm">Freeze authority</span>
                  </div>
                )}
              </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/20 border border-amber-500/50 rounded-xl p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5" />
                <div>
                  <h3 className="font-medium text-amber-400 mb-1">Final Warning</h3>
                  <p className="text-amber-300 text-sm">
                    Once deployed, your token parameters cannot be modified. Please review all settings carefully.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between mt-8">
          <button
            onClick={onBack}
            className="px-6 py-3 text-gray-300 hover:text-white transition-colors"
          >
            Back
          </button>
          
          <button
            onClick={handleDeploy}
            disabled={!agreed || !hasEnoughBalance() || isDeploying}
            className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeploying ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deploying...</span>
              </>
            ) : (
              <>
                <span>Deploy Token</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-400 mb-1">Deployment Failed</h4>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};