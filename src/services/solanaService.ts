import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Commitment
} from '@solana/web3.js';
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transfer,
  getMint,
  getAccount,
  createSetAuthorityInstruction,
  AuthorityType,
  TOKEN_PROGRAM_ID,
  createTransferInstruction
} from '@solana/spl-token';
import { SolanaNetwork, SolanaTokenInfo, SolanaTokenConfig, SolanaTokenDeploymentResult } from '../types/solana';
import { AppError, ErrorType } from './errorHandler';

class SolanaService {
  private connection: Connection | null = null;
  private network: SolanaNetwork | null = null;

  // Initialize connection with a specific network
  initializeConnection(network: SolanaNetwork): Connection {
    this.network = network;
    this.connection = new Connection(network.endpoint, 'confirmed');
    return this.connection;
  }

  // Get current connection or initialize with default
  getConnection(): Connection {
    if (!this.connection) {
      throw new AppError('Solana connection not initialized', ErrorType.NETWORK);
    }
    return this.connection;
  }

  // Get current network
  getNetwork(): SolanaNetwork | null {
    return this.network;
  }

  // Get SOL balance for an address
  async getBalance(publicKey: string): Promise<string> {
    try {
      const connection = this.getConnection();
      const key = new PublicKey(publicKey);
      const balance = await connection.getBalance(key);
      return (balance / LAMPORTS_PER_SOL).toFixed(9);
    } catch (error) {
      console.error('Error getting SOL balance:', error);
      throw new AppError('Failed to get SOL balance', ErrorType.NETWORK, error);
    }
  }

  // Request airdrop (only works on devnet/testnet)
  async requestAirdrop(publicKey: string, amount: number = 1): Promise<string> {
    try {
      const connection = this.getConnection();
      const key = new PublicKey(publicKey);
      
      if (!this.network?.isTestnet) {
        throw new AppError('Airdrops are only available on devnet and testnet', ErrorType.VALIDATION);
      }
      
      const signature = await connection.requestAirdrop(
        key,
        amount * LAMPORTS_PER_SOL
      );
      
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw new AppError('Failed to request airdrop', ErrorType.NETWORK, error);
    }
  }

  // Create a new SPL token
  async createToken(
    config: SolanaTokenConfig,
    payerSecret: Uint8Array
  ): Promise<SolanaTokenDeploymentResult> {
    try {
      const connection = this.getConnection();
      const payer = Keypair.fromSecretKey(payerSecret);
      
      // Create mint account
      const mintAuthority = payer.publicKey;
      const freezeAuthority = config.freezeAuthority ? payer.publicKey : null;
      
      console.log('Creating mint account...');
      const mint = await createMint(
        connection,
        payer,
        mintAuthority,
        freezeAuthority,
        config.decimals
      );
      
      console.log('Mint account created:', mint.toBase58());
      
      // Create associated token account for the payer
      console.log('Creating associated token account...');
      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        payer.publicKey
      );
      
      console.log('Token account created:', tokenAccount.address.toBase58());
      
      // Mint initial supply
      const initialSupply = parseFloat(config.initialSupply);
      if (initialSupply > 0) {
        console.log('Minting initial supply...');
        const mintAmount = initialSupply * Math.pow(10, config.decimals);
        await mintTo(
          connection,
          payer,
          mint,
          tokenAccount.address,
          mintAuthority,
          BigInt(mintAmount)
        );
        
        console.log('Initial supply minted:', initialSupply);
      }
      
      // Create metadata if enabled
      let metadataAddress: string | undefined;
      if (config.metadata.enabled) {
        // This would use Metaplex to create metadata
        // For now, we'll just log that it would be created
        console.log('Metadata would be created here using Metaplex');
        metadataAddress = "metadata_placeholder";
      }
      
      const explorerUrl = `${config.network.explorerUrl}/address/${mint.toBase58()}`;
      
      return {
        mint: mint.toBase58(),
        tokenAccount: tokenAccount.address.toBase58(),
        transactionSignature: 'signature_placeholder', // In a real implementation, this would be the actual signature
        network: config.network,
        explorerUrl,
        metadataAddress
      };
    } catch (error) {
      console.error('Error creating SPL token:', error);
      throw new AppError('Failed to create SPL token', ErrorType.CONTRACT, error);
    }
  }

  // Get token info
  async getTokenInfo(mintAddress: string): Promise<SolanaTokenInfo> {
    try {
      const connection = this.getConnection();
      let mintPublicKey;
      try {
        mintPublicKey = new PublicKey(mintAddress);
      } catch (error) {
        throw new AppError('Invalid mint address format', ErrorType.VALIDATION);
      }
      
      const mintInfo = await getMint(connection, mintPublicKey);
      
      // Try to get metadata (this would use Metaplex in a full implementation)
      let name = 'Unknown';
      let symbol = 'UNK';
      
      try {
        // This is a simplified approach - in production, use Metaplex to get metadata
        const metaplexId = await PublicKey.findProgramAddressSync(
          [
            Buffer.from('metadata'),
            new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s').toBuffer(),
            mintPublicKey.toBuffer(),
          ],
          new PublicKey('metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s')
        );
        
        // In a real implementation, we would fetch and decode the metadata account
        // For now, we'll just use placeholder values
      } catch (error) {
        console.log('Metadata not found, using default values');
      }
      
      return {
        mint: mintPublicKey,
        name,
        symbol,
        decimals: mintInfo.decimals,
        supply: mintInfo.supply.toString(),
        owner: mintInfo.mintAuthority || new PublicKey('11111111111111111111111111111111'),
        frozenState: mintInfo.freezeAuthority !== null
      };
    } catch (error) {
      console.error('Error getting token info:', error);
      throw new AppError('Failed to get token info', ErrorType.NETWORK, error);
    }
  }

  // Send SPL tokens
  async sendTokens(
    mintAddress: string,
    fromWalletSecret: Uint8Array,
    toWalletAddress: string,
    amount: number
  ): Promise<string> {
    try {
      const connection = this.getConnection();
      const fromWallet = Keypair.fromSecretKey(fromWalletSecret);
      const mint = new PublicKey(mintAddress);
      const toWallet = new PublicKey(toWalletAddress);
      
      // Get source token account
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
      );
      
      // Get destination token account (create if it doesn't exist)
      const toTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        toWallet
      );
      
      // Calculate amount with decimals
      const mintInfo = await getMint(connection, mint);
      const adjustedAmount = amount * Math.pow(10, mintInfo.decimals);
      
      // Send tokens
      const signature = await transfer(
        connection,
        fromWallet,
        fromTokenAccount.address,
        toTokenAccount.address,
        fromWallet.publicKey,
        BigInt(adjustedAmount)
      );
      
      return signature;
    } catch (error) {
      console.error('Error sending tokens:', error);
      throw new AppError('Failed to send tokens', ErrorType.TRANSACTION, error);
    }
  }

  // Batch send tokens to multiple recipients
  async batchSendTokens(
    mintAddress: string,
    fromWallet: Keypair,
    recipients: { address: string; amount: number }[]
  ): Promise<string> {
    try {
      const connection = this.getConnection();
      const mint = new PublicKey(mintAddress);
      
      // Get source token account
      const fromTokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        fromWallet,
        mint,
        fromWallet.publicKey
      );
      
      // Get mint info for decimals
      const mintInfo = await getMint(connection, mint);
      
      // Create transaction
      const transaction = new Transaction();
      
      // Add transfer instructions for each recipient
      for (const recipient of recipients) {
        const toWallet = new PublicKey(recipient.address);
        
        // Get destination token account (create if it doesn't exist)
        const toTokenAccount = await getOrCreateAssociatedTokenAccount(
          connection,
          fromWallet,
          mint,
          toWallet
        );
        
        // Calculate amount with decimals
        const adjustedAmount = recipient.amount * Math.pow(10, mintInfo.decimals);
        
        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            fromTokenAccount.address,
            toTokenAccount.address,
            fromWallet.publicKey,
            BigInt(adjustedAmount),
            [],
            TOKEN_PROGRAM_ID
          )
        );
      }
      
      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [fromWallet]
      );
      
      return signature;
    } catch (error) {
      console.error('Error batch sending tokens:', error);
      throw new AppError('Failed to batch send tokens', ErrorType.TRANSACTION, error);
    }
  }

  // Get token accounts for a wallet
  async getTokenAccounts(walletAddress: string): Promise<any[]> {
    try {
      const connection = this.getConnection();
      const wallet = new PublicKey(walletAddress);
      
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet,
        { programId: TOKEN_PROGRAM_ID }
      );
      
      return tokenAccounts.value.map(account => {
        const parsedInfo = account.account.data.parsed.info;
        return {
          mint: parsedInfo.mint,
          address: account.pubkey.toBase58(),
          amount: parsedInfo.tokenAmount.uiAmount,
          decimals: parsedInfo.tokenAmount.decimals
        };
      });
    } catch (error) {
      console.error('Error getting token accounts:', error);
      throw new AppError('Failed to get token accounts', ErrorType.NETWORK, error);
    }
  }

  // Check if a wallet has a specific token
  async hasToken(walletAddress: string, mintAddress: string): Promise<boolean> {
    try {
      try {
        new PublicKey(walletAddress);
        new PublicKey(mintAddress);
      } catch (error) {
        throw new AppError('Invalid address format', ErrorType.VALIDATION);
      }
      
      const connection = this.getConnection();
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(mintAddress);
      
      // Find token accounts owned by this wallet for this mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet,
        { mint }
      );
      
      return tokenAccounts.value.length > 0;
    } catch (error) {
      console.error('Error checking if wallet has token:', error);
      throw new AppError('Failed to check if wallet has token', ErrorType.NETWORK, error);
    }
  }

  // Get token balance for a specific mint
  async getTokenBalance(walletAddress: string, mintAddress: string): Promise<string> {
    try {
      try {
        new PublicKey(walletAddress);
        new PublicKey(mintAddress);
      } catch (error) {
        throw new AppError('Invalid address format', ErrorType.VALIDATION);
      }
      
      const connection = this.getConnection();
      const wallet = new PublicKey(walletAddress);
      const mint = new PublicKey(mintAddress);
      
      // Find token accounts owned by this wallet for this mint
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        wallet,
        { mint }
      );
      
      if (tokenAccounts.value.length === 0) {
        return '0';
      }
      
      // Sum up balances from all accounts (usually just one)
      let totalBalance = 0;
      for (const accountInfo of tokenAccounts.value) {
        const parsedInfo = accountInfo.account.data.parsed.info;
        totalBalance += parsedInfo.tokenAmount.uiAmount;
      }
      
      return totalBalance.toString();
    } catch (error) {
      console.error('Error getting token balance:', error);
      throw new AppError('Failed to get token balance', ErrorType.NETWORK, error);
    }
  }

  // Request SOL airdrop (devnet/testnet only)
  async requestAirdrop(address: string, amount: number = 1): Promise<string> {
    try {
      const connection = this.getConnection();
      
      if (!this.network?.isTestnet) {
        throw new AppError('Airdrops are only available on devnet and testnet', ErrorType.VALIDATION);
      }
      
      let publicKey;
      try {
        publicKey = new PublicKey(address);
      } catch (error) {
        throw new AppError('Invalid wallet address', ErrorType.VALIDATION);
      }
      
      const signature = await connection.requestAirdrop(
        publicKey,
        amount * LAMPORTS_PER_SOL
      );
      
      await connection.confirmTransaction(signature);
      return signature;
    } catch (error) {
      console.error('Error requesting airdrop:', error);
      throw new AppError('Failed to request airdrop', ErrorType.NETWORK, error);
    }
  }
}

export const solanaService = new SolanaService();