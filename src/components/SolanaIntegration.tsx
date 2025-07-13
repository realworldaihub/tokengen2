import React, { useState } from 'react';
import { 
  Coins, 
  Send, 
  Plus, 
  ArrowLeft, 
  ExternalLink, 
  Wallet, 
  RefreshCw,
  Download,
  AlertTriangle
} from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { SolanaWalletConnection } from './SolanaWalletConnection';
import { SolanaNetworkSelector } from './SolanaNetworkSelector';
import { SolanaTokenConfig, SolanaTokenDeploymentResult } from '../types/solana';
import { SolanaTokenBuilder } from './SolanaTokenBuilder';
import { SolanaTokenDeployment } from './SolanaTokenDeployment';
import { SolanaTokenSuccess } from './SolanaTokenSuccess';
import { getDefaultSolanaNetwork } from '../config/solanaNetworks';

export const SolanaIntegration: React.FC = () => {
  const { 
    isConnected, 
    publicKey, 
    balance, 
    network, 
    requestAirdrop, 
    switchNetwork 
  } = useSolanaWallet();
  
  const [currentStep, setCurrentStep] = useState<'dashboard' | 'builder' | 'deployment' | 'success'>('dashboard');
  const [tokenConfig, setTokenConfig] = useState<SolanaTokenConfig | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<SolanaTokenDeploymentResult | null>(null);
  const [isAirdropping, setIsAirdropping] = useState(false);
  const [airdropSuccess, setAirdropSuccess] = useState<string | null>(null);
  const [airdropError, setAirdropError] = useState<string | null>(null);

  const handleCreateToken = () => {
    setCurrentStep('builder');
  };

  const handleTokenConfigComplete = (config: SolanaTokenConfig) => {
    setTokenConfig(config);
    setCurrentStep('deployment');
  };

  const handleDeploy = (result: SolanaTokenDeploymentResult) => {
    setDeploymentResult(result);
    setCurrentStep('success');
  };

  const handleStartNew = () => {
    setCurrentStep('dashboard');
    setTokenConfig(null);
    setDeploymentResult(null);
  };

  const handleRequestAirdrop = async () => {
    if (!isConnected || !publicKey || !network?.isTestnet) return;
    
    setIsAirdropping(true); 
    setAirdropSuccess(null);
    setAirdropError(null);
    
    try {
      const signature = await requestAirdrop(1);
      if (signature) {
        setAirdropSuccess('Successfully requested 1 SOL airdrop');
      } else {
        throw new Error('Airdrop request failed. The network may be congested, please try again.');
      }
    } catch (error) {
      console.error('Airdrop error:', error);
      setAirdropError((error as Error).message || 'Failed to request airdrop');
    } finally {
      setIsAirdropping(false);
    }
  };

  // Render different steps
  if (currentStep === 'builder') {
    return (
      <SolanaTokenBuilder
        onBack={handleStartNew}
        onNext={handleTokenConfigComplete}
        initialConfig={tokenConfig || undefined}
      />
    );
  }

  if (currentStep === 'deployment' && tokenConfig) {
    return (
      <SolanaTokenDeployment
        config={tokenConfig}
        onBack={() => setCurrentStep('builder')}
        onDeploy={handleDeploy}
      />
    );
  }

  if (currentStep === 'success' && deploymentResult) {
    return (
      <SolanaTokenSuccess
        result={deploymentResult}
        onStartNew={handleStartNew}
      />
    );
  }

  // Dashboard view
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Solana Dashboard</h1>
              <p className="text-gray-300">Create and manage SPL tokens on the Solana blockchain</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <SolanaNetworkSelector
                selectedNetwork={network}
                onNetworkSelect={switchNetwork}
              />
              <SolanaWalletConnection />
            </div>
          </div>
        </div>

        {/* Wallet Status */}
        {isConnected ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Wallet Connected</h2>
                  <p className="text-gray-300">
                    {publicKey?.slice(0, 6)}...{publicKey?.slice(-4)}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="text-2xl font-bold text-white">{balance} SOL</div>
                <div className="text-gray-300 text-sm">{network?.name || 'Unknown Network'}</div>
                
                {network?.isTestnet && isConnected && (
                  <button
                    onClick={handleRequestAirdrop}
                    disabled={isAirdropping}
                    className="mt-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors flex items-center space-x-1"
                  >
                    {isAirdropping ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Requesting...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3 h-3" />
                        <span>Request Airdrop</span>
                      </>
                    )}
                  </button>
                )}
                
                {airdropSuccess && (
                  <div className="mt-2 text-green-400 text-xs">{airdropSuccess}</div>
                )}
                
                {airdropError && (
                  <div className="mt-2 text-red-400 text-xs">{airdropError}</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8 text-center">
            <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-gray-300 mb-6">
              Connect your Solana wallet to create and manage SPL tokens
            </p>
            <SolanaWalletConnection />
          </div>
        )}

        {/* Main Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Create Token Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Create Solana SPL Token</h3>
            <p className="text-gray-300 mb-6">
              Create a new SPL token on the Solana blockchain with custom parameters
            </p>
            <button
              onClick={handleCreateToken}
              disabled={!isConnected}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>Create Token</span>
            </button>
          </div>

          {/* Airdrop Tool Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
              <Send className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">SPL Token Airdrop</h3>
            <p className="text-gray-300 mb-6">
              Send SPL tokens to multiple addresses in a single transaction
            </p>
            <a
              href="/solana/airdrop"
              className={`bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${!isConnected ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Send className="w-4 h-4" />
              <span>Airdrop Tokens</span>
            </a>
          </div>

          {/* Token Explorer Card */}
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mb-4">
              <Coins className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">My SPL Tokens</h3>
            <p className="text-gray-300 mb-6">
              View and manage your SPL tokens on the Solana blockchain
            </p>
            <button
              onClick={() => alert('This would show your tokens')}
              disabled={!isConnected}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
            >
              <Coins className="w-4 h-4" />
              <span>View Tokens</span>
            </button>
          </div>
        </div>

        {/* Resources Section */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Solana Developer Resources</h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Solana Website</h3>
              <p className="text-gray-300 mb-4">
                Official website for the Solana blockchain
              </p>
              <div className="flex items-center text-blue-400 text-sm">
                <span>Visit Website</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </div>
            </a>
            
            <a
              href="https://docs.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Solana Docs</h3>
              <p className="text-gray-300 mb-4">
                Documentation for developers building on Solana
              </p>
              <div className="flex items-center text-blue-400 text-sm">
                <span>Read Docs</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </div>
            </a>
            
            <a
              href="https://explorer.solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
            >
              <h3 className="text-lg font-semibold text-white mb-2">Solana Explorer</h3>
              <p className="text-gray-300 mb-4">
                Explore transactions, accounts, and tokens on Solana
              </p>
              <div className="flex items-center text-blue-400 text-sm">
                <span>Open Explorer</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </div>
            </a>
          </div>
        </div>

        {/* Network Warning */}
        {network && !network.isTestnet && (
          <div className="mt-8 p-4 bg-amber-500/20 border border-amber-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-amber-400 mb-1">Mainnet Selected</h3>
                <p className="text-amber-300 text-sm">
                  You are currently connected to Solana Mainnet. All transactions will use real SOL.
                  Switch to Devnet or Testnet for testing.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};