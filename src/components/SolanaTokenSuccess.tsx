import React, { useState } from 'react';
import { CheckCircle, ExternalLink, Copy, Share2, Download, RefreshCw, ArrowLeft } from 'lucide-react';
import { SolanaTokenDeploymentResult } from '../types/solana';
import { TokenMetadataForm } from './TokenMetadataForm';
import { metadataService } from '../services/metadataService';
import { TokenMetadata } from '../types/tokenMetadata';

interface SolanaTokenSuccessProps {
  result: SolanaTokenDeploymentResult;
  onStartNew: () => void;
}

export const SolanaTokenSuccess: React.FC<SolanaTokenSuccessProps> = ({ result, onStartNew }) => {
  const [copied, setCopied] = useState<string | null>(null);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const shareToken = async () => {
    if (navigator.share) {
      try {
        // Use Web Share API if available
        await navigator.share({
          title: 'SPL Token Deployed',
          text: `Check out my new Solana token: ${result.mint}`,
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

  // Function to add token to Phantom wallet
  const addTokenToPhantom = async () => {
    try {
      if (typeof window.solana === 'undefined') {
        alert('Phantom wallet is not installed');
        return;
      }
      
      // Request to add token to Phantom
      await window.solana.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'spl-token',
          options: {
            address: result.mint,
            symbol: tokenMetadata?.symbol || 'TOKEN',
            decimals: 9,
            image: tokenMetadata?.logoUrl || ''
          }
        }
      });
    } catch (error) {
      console.error('Error adding token to Phantom:', error);
      alert('Failed to add token to wallet');
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
            Your SPL token has been deployed on {result.network.name}
          </p>
        </div>

        {/* Token Details */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Token Details</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Mint Address</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.mint}
                </code>
                <button
                  onClick={() => copyToClipboard(result.mint, 'mint')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'mint' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Token Account</label>
              <div className="flex items-center space-x-2 bg-white/10 rounded-lg p-3">
                <code className="text-white font-mono text-sm flex-1">
                  {result.tokenAccount}
                </code>
                <button
                  onClick={() => copyToClipboard(result.tokenAccount, 'account')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'account' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Network</label>
              <div className="text-white font-medium">{result.network.name}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Transaction Signature</label>
              <div className="flex items-center space-x-2">
                <code className="text-white font-mono text-sm">
                  {result.transactionSignature.slice(0, 10)}...{result.transactionSignature.slice(-8)}
                </code>
                <button
                  onClick={() => copyToClipboard(result.transactionSignature, 'tx')}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
              {copied === 'tx' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
            </div>

            {result.metadataAddress && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Metadata Address</label>
                <div className="flex items-center space-x-2">
                  <code className="text-white font-mono text-sm">
                    {result.metadataAddress.slice(0, 10)}...{result.metadataAddress.slice(-8)}
                  </code>
                  <button
                    onClick={() => copyToClipboard(result.metadataAddress, 'metadata')}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copied === 'metadata' && <p className="text-green-400 text-sm mt-1">Copied!</p>}
              </div>
            )}
          </div>
        </div>

        {/* Token Metadata */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-white">Token Metadata</h2>
            <button
              onClick={() => setShowMetadataForm(!showMetadataForm)}
              className="text-blue-400 hover:text-blue-300 text-sm font-medium"
            >
              {showMetadataForm ? 'Hide Form' : tokenMetadata ? 'Edit Metadata' : 'Add Metadata'}
            </button>
          </div>
          
          {showMetadataForm ? (
            <TokenMetadataForm
              tokenAddress={result.mint}
              isOwner={true}
              isPreDeployment={false}
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
                    <span className="text-2xl">☀️</span>
                  </div>
                )}
                
                <div>
                  <h3 className="text-xl font-semibold text-white">{tokenMetadata.name}</h3>
                  <p className="text-gray-300">{tokenMetadata.symbol}</p>
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
                    <span>Website</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                
                {tokenMetadata.twitterUrl && (
                  <a 
                    href={tokenMetadata.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <span>Twitter</span>
                    <ExternalLink className="w-4 h-4" />
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

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">View on Explorer</h3>
            <p className="text-gray-300 text-sm mb-4">
              View your token on the Solana Explorer
            </p>
            <a
              href={result.explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open Explorer</span>
            </a>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-4">Add to Wallet</h3>
            <p className="text-gray-300 text-sm mb-4">
              Add your token to Phantom or other Solana wallets
            </p>
            <button
              onClick={addTokenToPhantom}
              className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 w-full justify-center"
            >
              <span>Add to Wallet</span>
            </button>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Next Steps</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Share2 className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Share Your Token</h4>
              <p className="text-sm text-gray-300">
                Share your token with others via social media or messaging apps
              </p>
              <button
                onClick={shareToken}
                className="mt-3 text-blue-400 hover:text-blue-300 text-sm font-medium"
              >
                Share Token →
              </button>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Create Liquidity</h4>
              <p className="text-sm text-gray-300">
                Add liquidity to DEXes like Raydium or Orca to make your token tradable
              </p>
              <a
                href="https://raydium.io/liquidity/"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 text-green-400 hover:text-green-300 text-sm font-medium"
              >
                Add Liquidity →
              </a>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                <ExternalLink className="w-6 h-6 text-white" />
              </div>
              <h4 className="font-medium text-white mb-2">Manage Token</h4>
              <p className="text-sm text-gray-300">
                Use our token management tools to mint, transfer, or burn tokens
              </p>
              <button
                onClick={() => window.location.href = `/solana/manage/${result.mint}`}
                className="mt-3 text-purple-400 hover:text-purple-300 text-sm font-medium"
              >
                Manage Token →
              </button>
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