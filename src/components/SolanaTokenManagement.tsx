import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Coins, 
  Send, 
  Wallet, 
  ExternalLink, 
  Copy, 
  AlertTriangle, 
  CheckCircle, 
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useSolanaWallet } from '../hooks/useSolanaWallet';
import { solanaService } from '../services/solanaService';
import { SolanaWalletConnection } from './SolanaWalletConnection';
import { SolanaTokenInfo } from '../types/solana';

export const SolanaTokenManagement: React.FC = () => {
  // Get token address from URL
  const tokenAddress = window.location.pathname.split('/solana/manage/')[1];
  const { isConnected, publicKey, network } = useSolanaWallet();
  const [tokenInfo, setTokenInfo] = useState<SolanaTokenInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  
  // Send token form
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  useEffect(() => {
    if (tokenAddress && isConnected) {
      loadTokenInfo();
    }
  }, [tokenAddress, isConnected, network]);

  const loadTokenInfo = async () => {
    if (!tokenAddress) return;
    
    setIsLoading(true); 
    setError(null);
    
    try {
      // Fetch token info from API
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/solana/token/${tokenAddress}?networkId=${network?.id || 'solana-devnet'}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Token not found');
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load token information');
      }
      
      const tokenData = await response.json();
      
      // Convert to SolanaTokenInfo format
      const tokenInfo: SolanaTokenInfo = {
        mint: new PublicKey(tokenData.mint),
        name: tokenData.name,
        symbol: tokenData.symbol,
        decimals: tokenData.decimals,
        supply: tokenData.supply,
        owner: new PublicKey(tokenData.owner),
        frozenState: tokenData.freezeAuthority,
        metadata: tokenData.metadata
      };
      
      setTokenInfo(tokenInfo);
      
      // Get user's balance of this token
      if (publicKey) {
        const balance = await solanaService.getTokenBalance(publicKey, tokenAddress);
        // Update UI with balance
      }
    } catch (error) {
      console.error('Error loading token info:', error);
      setError('Failed to load token information');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendTokens = async () => {
    if (!isConnected || !publicKey || !tokenInfo || !recipient || !amount) return;
    
    setIsSending(true); 
    setSendError(null);
    setSendSuccess(null);
    setTxSignature(null);
    
    try {
      // Validate recipient address
      try {
        new PublicKey(recipient);
      } catch (error) {
        throw new Error('Invalid recipient address');
      }
      
      // Validate amount
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error('Invalid amount');
      }
      
      // Call API to send tokens
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/solana/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          mintAddress: tokenInfo.mint.toString(),
          recipient,
          amount: parsedAmount
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send tokens');
      }
      
      const result = await response.json();
      setTxSignature(result.signature);
      setSendSuccess(`Successfully sent ${amount} ${tokenInfo.symbol} to ${recipient.slice(0, 6)}...${recipient.slice(-4)}`);
      
      // Clear form and refresh token info
      setAmount('');
      setRecipient('');
    } catch (error) {
      console.error('Error sending tokens:', error);
      setSendError((error as Error).message || 'Failed to send tokens');
    } finally {
      setIsSending(false);
    }
  };

  const isValidSolanaAddress = (address: string): boolean => {
    try {
      new PublicKey(address);
      return true;
    } catch (error) {
      return false;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
          <Wallet className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Connect Your Wallet</h2>
          <p className="text-gray-300 mb-6">
            Please connect your Solana wallet to manage your token
          </p>
          <SolanaWalletConnection />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!tokenInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-8 border border-white/10 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Token Not Found</h2>
          <p className="text-gray-300 mb-6">
            The token could not be loaded or does not exist.
          </p>
          <button
            onClick={() => window.location.href = '/solana'}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => window.location.href = '/solana'}
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
            <SolanaWalletConnection />
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Coins className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">{tokenInfo.name}</h1>
                  <p className="text-gray-300 text-lg">({tokenInfo.symbol})</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-sm text-gray-400">
                      Mint: {tokenInfo.mint.toString().slice(0, 6)}...{tokenInfo.mint.toString().slice(-4)}
                    </span>
                    <button
                      onClick={() => copyToClipboard(tokenInfo.mint.toString(), 'mint')}
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <a
                      href={`${network?.explorerUrl}/address/${tokenInfo.mint.toString()}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 text-gray-400 hover:text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  {copied === 'mint' && (
                    <div className="text-green-400 text-sm mt-1">Address copied!</div>
                  )}
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-white">
                  {/* This would be the user's balance of this token */}
                  {/* We would get this from solanaService.getTokenBalance */}
                  Loading...
                </div>
                <div className="text-gray-300">Your Balance</div>
                <button
                  onClick={loadTokenInfo}
                  className="mt-2 text-blue-400 hover:text-blue-300 text-sm flex items-center space-x-1 ml-auto"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Token Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Token Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Token Name</label>
                  <div className="text-white font-medium">{tokenInfo.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Symbol</label>
                  <div className="text-white font-medium">{tokenInfo.symbol}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Decimals</label>
                  <div className="text-white font-medium">{tokenInfo.decimals}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Total Supply</label>
                  <div className="text-white font-medium">
                    {parseInt(tokenInfo.supply).toLocaleString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Network</label>
                  <div className="text-white font-medium">{network?.name || 'Unknown'}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Freeze Authority</label>
                  <div className="text-white font-medium">{tokenInfo.frozenState ? 'Enabled' : 'Disabled'}</div>
                </div>
              </div>
              
              {tokenInfo.metadata?.description && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <div className="text-white">{tokenInfo.metadata.description}</div>
                </div>
              )}
            </div>

            {/* Send Tokens */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h2 className="text-xl font-semibold text-white mb-4">Send Tokens</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Recipient Address
                  </label>
                  <input
                    type="text"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter Solana address"
                  />
                  {recipient && !isValidSolanaAddress(recipient) && (
                    <p className="text-red-400 text-sm mt-1">Invalid Solana address</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    step="0.000000001"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.0"
                  />
                </div>

                <button
                  onClick={handleSendTokens}
                  disabled={
                    isSending || 
                    !recipient || 
                    !amount || 
                    !isValidSolanaAddress(recipient) || 
                    parseFloat(amount) <= 0
                  }
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Tokens</span>
                    </>
                  )}
                </button>
                
                {sendError && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
                      <p className="text-red-400 text-sm">{sendError}</p>
                    </div>
                  </div>
                )}
                
                {sendSuccess && (
                  <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
                      <div>
                        <p className="text-green-400 text-sm">{sendSuccess}</p>
                        {txSignature && (
                          <div className="flex items-center mt-2 space-x-2">
                            <code className="text-xs text-green-300 font-mono bg-green-500/10 px-2 py-1 rounded">
                              {txSignature.slice(0, 10)}...{txSignature.slice(-8)}
                            </code>
                            <button
                              onClick={() => copyToClipboard(txSignature, 'signature')}
                              className="p-1 text-green-400 hover:text-green-300 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            {copied === 'signature' && (
                              <span className="text-green-400 text-xs">Copied!</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                <a
                  href={`${network?.explorerUrl}/address/${tokenInfo.mint.toString()}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-white">View on Explorer</span>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </a>
                
                <a
                  href="/solana/airdrop"
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                >
                  <span className="text-white">Airdrop Tokens</span>
                  <Send className="w-4 h-4 text-gray-400" />
                </a>
                
                <button
                  onClick={() => {
                    // Add token to wallet
                    alert('This would add the token to your wallet');
                  }}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors w-full text-left"
                >
                  <span className="text-white">Add to Wallet</span>
                  <Wallet className="w-4 h-4 text-gray-400" />
                </button>
              </div>
            </div>

            {/* Token Stats */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Token Statistics</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Holders</span>
                  <span className="text-white font-medium">250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Transfers</span>
                  <span className="text-white font-medium">1,250</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Created</span>
                  <span className="text-white font-medium">
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Network Info */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Network Information</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-300">Network</span>
                  <span className="text-white font-medium">{network?.name || 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Type</span>
                  <span className="text-white font-medium">
                    {network?.isTestnet ? 'Testnet' : 'Mainnet'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-300">Explorer</span>
                  <a
                    href={network?.explorerUrl || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm"
                  >
                    View Explorer
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};