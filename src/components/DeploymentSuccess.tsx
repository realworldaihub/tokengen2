import React from 'react';
import { CheckCircle, ExternalLink, Copy, Share2, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { DeploymentResult } from '../types';
import { TokenMetadataForm } from './TokenMetadataForm';
import { metadataService } from '../services/metadataService';
import { TokenMetadata } from '../types/tokenMetadata';

interface DeploymentSuccessProps {
  result: DeploymentResult;
  onStartNew: () => void;
}

export const DeploymentSuccess: React.FC<DeploymentSuccessProps> = ({ result, onStartNew }) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = React.useState(false);
  const [tokenMetadata, setTokenMetadata] = React.useState<TokenMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = React.useState(false);

  // Check if metadata already exists
  React.useEffect(() => {
    const checkMetadata = async () => {
      if (result.contractAddress) {
        setIsLoadingMetadata(true);
        try {
          const metadata = await metadataService.getTokenMetadata(result.contractAddress);
          setTokenMetadata(metadata);
          // If metadata exists, don't show the form by default
          if (metadata) {
            setShowMetadataForm(false);
          }
        } catch (error) {
          console.error('Error fetching token metadata:', error);
        } finally {
          setIsLoadingMetadata(false);
        }
      }
    };
    
    checkMetadata();
  }, [result.contractAddress]);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareContract = async () => {
    if (navigator.share) {
      try {
        // Use Web Share API if available
        await navigator.share({
          title: 'Token Contract Deployed',
          text: `Check out my new token contract: ${result.contractAddress}`,
          url: result.explorerUrl
        });
      } catch (err) {
        console.error('Error sharing:', err);
        // Fallback to clipboard if sharing fails
        copyToClipboard(result.explorerUrl, 'share');
      }
    } else {
      // Fallback for browsers without Web Share API
      copyToClipboard(result.explorerUrl, 'share');
    }
  };

  const handleMetadataSave = (metadata: TokenMetadata) => {
    setTokenMetadata(metadata);
    // Hide form after successful save
    setShowMetadataForm(false);
  };
  
  // Function to add token to MetaMask
  const addTokenToMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed');
      return;
    }
    
    try {
      // Request to add token to MetaMask
      await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: result.contractAddress,
            symbol: result.symbol || 'TOKEN', // Use token symbol if available
            decimals: result.decimals || 18,   // Use token decimals if available
            image: '' // Optional token logo
          }
        }
      });
    } catch (error) {
      console.error('Error adding token to MetaMask:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back to Home Button */}
        <div className="mb-6">
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
        
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">Token Deployed Successfully!</h1>
          <p className="text-gray-300 text-lg">
            Your token contract has been deployed and verified on {result.network.name}
          </p>
        </div>

        {/* Contract Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Contract Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Contract Address</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.contractAddress}
                </code>
                <button
                  onClick={() => copyToClipboard(result.contractAddress, 'address')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'address' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Hash</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.transactionHash.slice(0, 20)}...
                </code>
                <button
                  onClick={() => copyToClipboard(result.transactionHash, 'tx')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'tx' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <div className="text-white font-medium">{result.network.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Gas Used</label>
              <div className="text-white font-medium">{result.gasUsed}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Deployment Cost</label>
              <div className="text-white font-medium">{result.deploymentCost} {result.network.symbol}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-medium">Verified</span>
              </div>
            </div>
          </div>
        </div>

        {/* Token Metadata */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Token Metadata</h2>
            {!isLoadingMetadata && (
              <button
                onClick={() => setShowMetadataForm(!showMetadataForm)}
                className="text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                {showMetadataForm ? 'Hide Form' : tokenMetadata ? 'Edit Metadata' : 'Add Metadata'}
              </button>
            )}
          </div>
          
          {isLoadingMetadata ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : showMetadataForm ? (
            <TokenMetadataForm
              tokenAddress={result.contractAddress}
              tokenName={result.tokenName}
              tokenSymbol={result.tokenSymbol}
              isOwner={true}
              initialMetadata={tokenMetadata || undefined}
              onSave={handleMetadataSave}
            />
          ) : tokenMetadata ? (
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center space-x-4 mb-4">
                {tokenMetadata.logoUrl ? (
                  <img 
                    src={tokenMetadata.logoUrl} 
                    alt={tokenMetadata.name || 'Token logo'} 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                    <Coins className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-semibold text-white">{tokenMetadata.name || result.tokenName}</h3>
                  <p className="text-gray-300">{tokenMetadata.symbol || result.tokenSymbol}</p>
                </div>
              </div>
              
              {tokenMetadata.description && (
                <p className="text-gray-300 mb-4">{tokenMetadata.description}</p>
              )}
              
              {tokenMetadata.tags && tokenMetadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {tokenMetadata.tags.map(tag => (
                    <span 
                      key={tag} 
                      className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {tokenMetadata.websiteUrl && (
                  <a 
                    href={tokenMetadata.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                
                {tokenMetadata.twitterUrl && (
                  <a 
                    href={tokenMetadata.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                  </a>
                )}
                
                {tokenMetadata.telegramUrl && (
                  <a 
                    href={tokenMetadata.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Telegram</span>
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-300 mb-4">
                Add metadata to your token to make it more discoverable and provide information to users.
              </p>
              <button
                onClick={() => setShowMetadataForm(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
              >
                Add Token Metadata
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">View on Explorer</h3>
            <p className="text-gray-300 text-sm mb-4">
              View your token contract on the blockchain explorer
            </p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open {result.network.name === 'Ethereum' ? 'Etherscan' : 
                result.network.name === 'Binance Smart Chain' ? 'BscScan' : 
                `${result.network.name} Explorer`}</span>
            </a>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add to Wallet</h3>
            <p className="text-gray-300 text-sm mb-4">
              Add your token to MetaMask or other wallets for easy access
            </p>
            <button
              onClick={addTokenToMetaMask}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" alt="MetaMask" className="w-4 h-4" />
              <span>Add to MetaMask</span>
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Manage Token</h3>
            <p className="text-gray-300 text-sm mb-4">
              Access token management features like minting, burning, and fee configuration
            </p>
            <button
              onClick={() => window.location.href = `/manage/${result.contractAddress}`}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <Settings className="w-4 h-4" />
              <span>Manage Token</span>
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Share Contract</h3>
            <p className="text-gray-300 text-sm mb-4">
              Share your token contract with others
            </p>
            <button
              onClick={shareContract}
              className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Share Contract</span>
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Next Steps</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Add to Wallet</h4>
              <p className="text-sm text-gray-300">
                Import your token to MetaMask or other wallets using the contract address
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Create Logo</h4>
              <p className="text-sm text-gray-300">
                Add a logo to your token for better recognition on exchanges
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">List on DEX</h4>
              <p className="text-sm text-gray-300">
                Create liquidity pools on Uniswap, PancakeSwap, or other DEXs
              </p>
            </div>
          </div>
        </div>

        {/* Create Another Token */}
        <div className="text-center">
          <button
            onClick={onStartNew}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Create Another Token</span>
          </button>
        </div>
      </div>
    </div>
  );
};