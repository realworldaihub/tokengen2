import { ethers } from 'ethers';
import { Network } from '../types';
import { AppError, ErrorType, reportError } from './errorHandler';
import { CHAIN_CONFIG } from '../config/chainConfig';

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;
  private network: Network | null = null;
  private providerListeners: { [key: string]: (...args: any[]) => void } = {};

  async connect(): Promise<string> {
    if (typeof window.ethereum === 'undefined') {
      throw new AppError('MetaMask is not installed. Please install MetaMask or another Web3 wallet.', ErrorType.WALLET);
    }

    try {
      // Remove any existing listeners
      this.removeAllListeners();
      
      // Create provider
      this.provider = new ethers.BrowserProvider(window.ethereum, 'any');
      
      // Request accounts
      await this.provider.send('eth_requestAccounts', []);
      this.signer = await this.provider.getSigner();
      
      // Get network information
      const network = await this.provider.getNetwork();
      this.network = {
        id: network.name,
        name: this.getNetworkName(Number(network.chainId)),
        symbol: this.getNetworkSymbol(Number(network.chainId)),
        chainId: Number(network.chainId),
        rpcUrl: window.ethereum.rpcUrls?.[0] || '',
        explorerUrl: this.getExplorerUrl(Number(network.chainId)),
        gasPrice: await this.getGasPrice()
      };
      
      // Setup event listeners
      this.setupEventListeners();
      
      return await this.signer.getAddress();
    } catch (error) {
      console.error('Error connecting to wallet:', error);
      
      // Clean up on error
      this.removeAllListeners();
      this.provider = null;
      this.signer = null;
      this.network = null;
      
      throw new AppError(
        (error as Error).message || 'Failed to connect to wallet',
        ErrorType.WALLET,
        error
      );
    }
  }
  
  private setupEventListeners() {
    if (!window.ethereum) return;
    
    // Account changed
    this.providerListeners.accountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        console.log('Wallet disconnected');
        this.disconnect();
      } else {
        console.log('Account changed:', accounts[0]);
        // Refresh signer
        if (this.provider) {
          this.provider.getSigner().then(signer => {
            this.signer = signer;
          }).catch(error => {
            console.error('Error updating signer:', error);
          });
        }
      }
    };
    
    // Chain changed
    this.providerListeners.chainChanged = (chainIdHex: string) => {
      const chainId = parseInt(chainIdHex, 16);
      console.log('Chain changed to:', chainId);
      
      // Update network info
      if (this.provider) {
        this.provider.getNetwork().then(network => {
          this.network = {
            id: network.name,
            name: this.getNetworkName(chainId),
            symbol: this.getNetworkSymbol(chainId),
            chainId: chainId,
            rpcUrl: window.ethereum.rpcUrls?.[0] || '',
            explorerUrl: this.getExplorerUrl(chainId),
            gasPrice: '0.0' // Will be updated
          };
          
          // Update gas price
          this.getGasPrice().then(gasPrice => {
            if (this.network) {
              this.network.gasPrice = gasPrice;
            }
          });
        }).catch(error => {
          console.error('Error updating network:', error);
        });
      }
    };
    
    // Disconnect
    this.providerListeners.disconnect = (error: { code: number; message: string }) => {
      console.log('Wallet disconnected:', error);
      this.disconnect();
    };
    
    // Add listeners
    window.ethereum.on('accountsChanged', this.providerListeners.accountsChanged);
    window.ethereum.on('chainChanged', this.providerListeners.chainChanged);
    window.ethereum.on('disconnect', this.providerListeners.disconnect);
  }
  
  private removeAllListeners() {
    if (!window.ethereum) return;
    
    // Remove all listeners
    if (this.providerListeners.accountsChanged) {
      window.ethereum.removeListener('accountsChanged', this.providerListeners.accountsChanged);
    }
    
    if (this.providerListeners.chainChanged) {
      window.ethereum.removeListener('chainChanged', this.providerListeners.chainChanged);
    }
    
    if (this.providerListeners.disconnect) {
      window.ethereum.removeListener('disconnect', this.providerListeners.disconnect);
    }
    
    // Clear listeners
    this.providerListeners = {};
  }

  async getBalance(address: string): Promise<string> {
    if (!this.provider) throw new AppError('Provider not connected', ErrorType.WALLET);
    
    try {
      const balance = await this.provider.getBalance(address);
      return ethers.formatEther(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      throw new AppError('Failed to get wallet balance', ErrorType.NETWORK, error);
    }
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string> {
    if (!this.provider) throw new AppError('Provider not connected', ErrorType.WALLET);
    
    try {
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)'],
        this.provider
      );
      
      const [balance, decimals] = await Promise.all([
        tokenContract.balanceOf(userAddress),
        tokenContract.decimals()
      ]);
      
      return ethers.formatUnits(balance, decimals);
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw new AppError('Failed to get token balance', ErrorType.CONTRACT, error);
    }
  }

  async transferToken(tokenAddress: string, recipient: string, amount: number): Promise<string> {
    if (!this.signer) throw new AppError('Signer not available', ErrorType.WALLET);
    
    try {
      // Create token contract instance
      const tokenContract = new ethers.Contract(
        tokenAddress,
        [
          'function transfer(address to, uint256 amount) returns (bool)',
          'function decimals() view returns (uint8)'
        ],
        this.signer
      );
      
      // Get token decimals
      const decimals = await tokenContract.decimals();
      
      // Convert amount to wei
      const amountWei = ethers.parseUnits(amount.toString(), decimals);
      
      // Send transaction
      const tx = await tokenContract.transfer(recipient, amountWei);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (receipt.status !== 1) {
        throw new AppError('Token transfer failed', ErrorType.CONTRACT);
      }
      
      return tx.hash;
    } catch (error) {
      console.error('Error transferring tokens:', error);
      
      // Handle specific error cases
      if ((error as any).code === 'ACTION_REJECTED') {
        throw new AppError('Token transfer rejected by user', ErrorType.WALLET, error);
      } else if ((error as any).code === 'INSUFFICIENT_FUNDS') {
        throw new AppError('Insufficient token balance for transfer', ErrorType.WALLET, error);
      } else {
        throw new AppError('Token transfer failed', ErrorType.CONTRACT, error);
      }
    }
  }

  async switchNetwork(network: Network): Promise<void> {
    if (!window.ethereum) throw new AppError('MetaMask not found', ErrorType.WALLET);
    
    const chainIdHex = `0x${network.chainId.toString(16)}`;
    
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
      
      // Update current network
      this.network = network;
    } catch (error: any) {
      if (error.code === 4902) {
        // Chain not added to MetaMask, try to add it
        const chainConfig = CHAIN_CONFIG[network.chainId];
        
        if (!chainConfig) {
          throw new AppError(`Chain configuration not found for ${network.name}`, ErrorType.VALIDATION);
        }
        
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: chainConfig.chainId,
              chainName: chainConfig.chainName,
              nativeCurrency: chainConfig.nativeCurrency,
              rpcUrls: chainConfig.rpcUrls,
              blockExplorerUrls: chainConfig.blockExplorerUrls
            }
          ]
        });
        
        // Try switching again after adding
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainIdHex }],
        });
        
        // Update current network
        this.network = network;
      } else {
        throw new AppError(`Failed to switch to ${network.name} network`, ErrorType.WALLET, error);
      }
    }
  }

  async getCurrentNetwork(): Promise<Network | null> {
    if (!this.provider) {
      return null;
    }
    
    try {
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      return {
        id: network.name,
        name: this.getNetworkName(chainId),
        symbol: this.getNetworkSymbol(chainId),
        chainId: chainId,
        rpcUrl: window.ethereum?.rpcUrls?.[0] || '',
        explorerUrl: this.getExplorerUrl(chainId),
        gasPrice: await this.getGasPrice()
      };
    } catch (error) {
      console.error('Error getting current network:', error);
      reportError(new AppError('Failed to get network information', ErrorType.NETWORK, error));
      return null;
    }
  }

  private getNetworkName(chainId: number): string {
    const networks: Record<number, string> = {
      1: 'Ethereum',
      5: 'Goerli',
      56: 'Binance Smart Chain',
      97: 'BSC Testnet',
      137: 'Polygon',
      80001: 'Mumbai',
      42161: 'Arbitrum',
      421614: 'Arbitrum Sepolia',
      250: 'Fantom',
      4002: 'Fantom Testnet',
      43114: 'Avalanche',
      43113: 'Avalanche Fuji',
      25: 'Cronos',
      338: 'Cronos Testnet',
      1116: 'Core',
      2000: 'DogeChain',
      369: 'PulseChain',
      7000: 'ZetaChain',
      130: 'Unichain',
      7171: 'Bitrock',
      7771: 'Bitrock Testnet',
      3797: 'AlveyChain',
      1071: 'OpenGPU',
      8453: 'Base',
      25062019: 'Estar Testnet'
    };
    
    return networks[chainId] || `Chain ${chainId}`;
  }

  private getNetworkSymbol(chainId: number): string {
    const symbols: Record<number, string> = {
      1: 'ETH',
      5: 'ETH',
      56: 'BNB',
      97: 'tBNB',
      137: 'MATIC',
      80001: 'MATIC',
      42161: 'ETH',
      421614: 'ETH',
      250: 'FTM',
      4002: 'FTM',
      43114: 'AVAX',
      43113: 'AVAX',
      25: 'CRO',
      338: 'CRO',
      1116: 'CORE',
      2000: 'DOGE',
      369: 'PLS',
      7000: 'ZETA',
      130: 'UNI',
      7171: 'BROCK',
      7771: 'BROCK',
      3797: 'ALV',
      1071: 'GPU',
      8453: 'ETH',
      25062019: 'ESR'
    };
    
    return symbols[chainId] || 'ETH';
  }

  private getExplorerUrl(chainId: number): string {
    const explorers: Record<number, string> = {
      1: 'https://etherscan.io',
      5: 'https://goerli.etherscan.io',
      56: 'https://bscscan.com',
      97: 'https://testnet.bscscan.com',
      137: 'https://polygonscan.com',
      80001: 'https://mumbai.polygonscan.com',
      42161: 'https://arbiscan.io',
      421614: 'https://sepolia.arbiscan.io',
      250: 'https://ftmscan.com',
      4002: 'https://testnet.ftmscan.com',
      43114: 'https://snowtrace.io',
      43113: 'https://testnet.snowtrace.io',
      25: 'https://cronoscan.com',
      338: 'https://testnet.cronoscan.com',
      1116: 'https://scan.coredao.org',
      2000: 'https://explorer.dogechain.dog',
      369: 'https://scan.pulsechain.com',
      7000: 'https://explorer.zetachain.com',
      130: 'https://uniscan.xyz',
      7171: 'https://scan.bit-rock.io',
      7771: 'https://testnet-scan.bit-rock.io',
      3797: 'https://alveyscan.com',
      1071: 'https://explorer.opengpu.io',
      8453: 'https://basescan.org',
      25062019: 'https://esrscan.com'
    };
    
    return explorers[chainId] || 'https://etherscan.io';
  }

  async estimateGas(transaction: any): Promise<string> {
    if (!this.provider) throw new AppError('Provider not connected', ErrorType.WALLET);
    
    try {
      const gasEstimate = await this.provider.estimateGas(transaction);
      const gasPrice = await this.provider.getFeeData();
      
      // Use maxFeePerGas if available (EIP-1559), otherwise use gasPrice
      const effectiveGasPrice = gasPrice.maxFeePerGas || gasPrice.gasPrice || 0n;
      
      // Calculate total cost
      const totalCost = gasEstimate * effectiveGasPrice;
      return ethers.formatEther(totalCost);
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new AppError('Failed to estimate gas', ErrorType.CONTRACT, error);
    }
  }
  
  async estimateTokenDeploymentGas(contractType: string, constructorArgs: any[]): Promise<{
    gasEstimate: bigint;
    gasCost: string;
    gasCostUsd: string;
    timeEstimate: string;
  }> {
    if (!this.provider) throw new AppError('Provider not connected', ErrorType.WALLET);
    if (!this.network) throw new AppError('Network not detected', ErrorType.NETWORK);
    
    try {
      // Get contract bytecode and ABI
      const contractSource = await import('../services/contractSource');
      const source = contractSource.getContractSource(contractType);
      
      // Use solc.js to compile the contract
      const solc = await import('solc');
      
      const input = {
        language: 'Solidity',
        sources: {
          'contract.sol': {
            content: source
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };
      
      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      
      if (output.errors) {
        const errors = output.errors.filter((error: any) => error.severity === 'error');
        if (errors.length > 0) {
          throw new AppError(`Compilation errors: ${errors.map((e: any) => e.message).join(', ')}`, ErrorType.CONTRACT);
        }
      }
      
      const contract = output.contracts['contract.sol'][contractType];
      const abi = contract.abi;
      const bytecode = contract.evm.bytecode.object;
      
      // Create contract factory
      const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
      
      // Estimate gas for deployment
      const deploymentData = factory.interface.encodeDeploy(constructorArgs);
      const gasEstimate = await this.provider.estimateGas({
        data: bytecode + deploymentData.slice(2)
      });
      
      // Get gas price
      const feeData = await this.provider.getFeeData();
      const effectiveGasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
      
      // Calculate total cost
      const totalCost = gasEstimate * effectiveGasPrice;
      const gasCost = ethers.formatEther(totalCost);
      
      // Estimate USD cost based on current token price
      // This would ideally use a price oracle, but for now we'll use a simple estimate
      const tokenPriceUsd = this.getTokenPriceEstimate(this.network.symbol);
      const gasCostUsd = (parseFloat(gasCost) * tokenPriceUsd).toFixed(2);
      
      // Estimate time based on network congestion
      const timeEstimate = this.getTimeEstimate(this.network.chainId);
      
      return {
        gasEstimate,
        gasCost,
        gasCostUsd: `$${gasCostUsd}`,
        timeEstimate
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      reportError(new AppError('Failed to estimate deployment gas', ErrorType.CONTRACT, error));
      
      // Return fallback estimates
      return {
        gasEstimate: 0n,
        gasCost: '0.0',
        gasCostUsd: '$0.00',
        timeEstimate: 'unknown'
      };
    }
  }
  
  private getTokenPriceEstimate(symbol: string): number {
    // These would ideally come from a price oracle
    // Implement real price feed integration
    // Fallback prices if API call fails
    const fallbackPrices: Record<string, number> = {
      'ETH': 3500,
      'BNB': 550,
      'MATIC': 1.20,
      'FTM': 0.65,
      'AVAX': 35,
      'CRO': 0.15,
      'CORE': 0.80,
      'DOGE': 0.12,
      'PLS': 0.0005,
      'ZETA': 1.50,
      'UNI': 5.00,
      'BROCK': 0.10,
      'ALV': 0.05,
      'GPU': 0.20,
      'ESR': 0.50
    };
    
    return fallbackPrices[symbol] || 0;
  }
  
  private getTimeEstimate(chainId: number): string {
    // Estimated deployment times based on network
    const times: Record<number, string> = {
      1: '2-5 minutes',    // Ethereum
      5: '30-60 seconds',  // Goerli
      56: '30-60 seconds', // BSC
      97: '15-30 seconds', // BSC Testnet
      137: '30-60 seconds', // Polygon
      80001: '15-30 seconds', // Mumbai
      42161: '30-60 seconds', // Arbitrum
      421614: '15-30 seconds', // Arbitrum Sepolia
      250: '15-30 seconds', // Fantom
      43114: '30-60 seconds', // Avalanche
      25062019: '5-15 seconds' // Estar Testnet
    };
    
    return times[chainId] || '1-3 minutes';
  }

  private symbolToId(symbol: string): string {
    const mapping: Record<string, string> = {
      'ETH': 'ethereum',
      'BNB': 'binancecoin',
      'MATIC': 'matic-network',
      'FTM': 'fantom',
      'AVAX': 'avalanche-2',
      'ESR': 'estar'
    };
    return mapping[symbol] || symbol.toLowerCase();
  }
  

  async sendTransaction(transaction: any): Promise<string> {
    if (!this.signer) throw new AppError('Signer not available', ErrorType.WALLET);
    
    try {
      const tx = await this.signer.sendTransaction(transaction);
      
      // Log transaction for debugging
      console.log(`Transaction sent: ${tx.hash}`);
      console.log(`Gas limit: ${tx.gasLimit.toString()}`);
      console.log(`Gas price: ${tx.gasPrice?.toString() || 'unknown'}`);
      
      return tx.hash;
    } catch (error) {
      console.error('Error sending transaction:', error);
      
      // Handle specific error cases
      if ((error as any).code === 'ACTION_REJECTED') {
        throw new AppError('Transaction rejected by user', ErrorType.WALLET, error);
      } else if ((error as any).code === 'INSUFFICIENT_FUNDS') {
        throw new AppError('Insufficient funds for transaction', ErrorType.WALLET, error);
      } else {
        throw new AppError('Transaction failed', ErrorType.CONTRACT, error);
      }
    }
  }

  async waitForTransaction(txHash: string): Promise<ethers.TransactionReceipt> {
    if (!this.provider) throw new AppError('Provider not connected', ErrorType.WALLET);
    
    try {
      console.log(`Waiting for transaction ${txHash} to be mined...`);
      const receipt = await this.provider.waitForTransaction(txHash);
      
      if (!receipt) throw new AppError('Transaction failed', ErrorType.CONTRACT);
      
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      console.log(`Gas used: ${receipt.gasUsed.toString()}`);
      
      return receipt;
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw new AppError('Transaction confirmation failed', ErrorType.NETWORK, error);
    }
  }

  async getGasPrice(): Promise<string> {
    if (!this.provider) return '0.0';
    
    try {
      const feeData = await this.provider.getFeeData();
      
      // Use maxFeePerGas if available (EIP-1559), otherwise use gasPrice
      const gasPrice = feeData.maxFeePerGas || feeData.gasPrice || 0n;
      
      // Format gas price to human-readable format
      const gasPriceInGwei = ethers.formatUnits(gasPrice, 'gwei');
      
      return `${gasPriceInGwei} Gwei`;
    } catch (error) {
      console.error('Error getting gas price:', error);
      reportError(new AppError('Failed to get gas price', ErrorType.NETWORK, error));
      return '0.0';
    }
  }

  getProvider(): ethers.BrowserProvider | null {
    return this.provider;
  }

  getSigner(): ethers.JsonRpcSigner | null {
    return this.signer;
  }

  getNetworkInfo(): Network | null {
    return this.network;
  }

  async deployContract(abi: any, bytecode: string, args: any[]): Promise<{address: string, txHash: string}> {
    if (!this.signer) throw new AppError('Signer not available', ErrorType.WALLET);
    
    try {
      // Create contract factory
      const factory = new ethers.ContractFactory(abi, bytecode, this.signer);
      
      // Deploy contract
      const contract = await factory.deploy(...args);
      await contract.waitForDeployment();
      
      const address = await contract.getAddress();
      const deploymentTx = contract.deploymentTransaction();
      
      if (!deploymentTx) throw new AppError('Deployment transaction not found', ErrorType.CONTRACT);
      
      return {
        address,
        txHash: deploymentTx.hash
      };
    } catch (error) {
      console.error('Error deploying contract:', error);
      
      // Handle specific error cases
      if ((error as any).code === 'ACTION_REJECTED') {
        throw new AppError('Deployment rejected by user', ErrorType.WALLET, error);
      } else if ((error as any).code === 'INSUFFICIENT_FUNDS') {
        throw new AppError('Insufficient funds for deployment', ErrorType.WALLET, error);
      } else {
        throw new AppError('Contract deployment failed', ErrorType.CONTRACT, error);
      }
    }
  }

  async verifyContract(address: string, contractName: string, source: string, args: any[]): Promise<boolean> {
    // In a real implementation, this would call the explorer's API to verify the contract
    // For now, we'll just simulate a successful verification
    console.log(`Verifying contract ${contractName} at ${address}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return true;
  }

  disconnect(): void {
    this.removeAllListeners();
    this.provider = null;
    this.signer = null;
    this.network = null;
    
    // Clear local storage
    localStorage.removeItem('authToken');
    localStorage.removeItem('walletAddress');
    
    console.log('Wallet disconnected');
  }
}

export const web3Service = new Web3Service();