# TokenForge - Multi-Chain Token Creation Platform

![TokenForge Banner](https://example.com/tokenforge-banner.jpg)

TokenForge is a comprehensive platform for creating and deploying professional-grade ERC-20/BEP-20 tokens and SPL tokens across multiple blockchains. With an intuitive interface and powerful features, it enables developers to launch tokens with advanced functionality like vesting, fees, and holder redistribution without writing a single line of code.

## 🚀 New Updates

### Solana Blockchain Integration (July 2025)

TokenForge now supports the Solana blockchain with full SPL token functionality:

- **Complete Solana Network Support**: Deploy on Solana Mainnet, Devnet, and Testnet
- **SPL Token Creation**: Create custom SPL tokens with configurable parameters
- **Wallet Integration**: Connect with Phantom, Solflare, and other Solana wallets
- **Token Management**: View, send, and manage your SPL tokens
- **Airdrop Tool**: Distribute SPL tokens to multiple addresses efficiently
- **Devnet Faucet**: Request SOL airdrops for testing on Devnet and Testnet

### Custom Token Metadata System (July 2025)

We've added a comprehensive token metadata system:

- **Rich Token Profiles**: Add logos, descriptions, and links to your tokens
- **Category Tagging**: Categorize tokens by type (DeFi, Gaming, Utility, etc.)
- **Social Integration**: Link to Twitter, Telegram, Discord, and more
- **Explorer Visibility**: Metadata appears in block explorers that support it
- **Owner Control**: Only token owners can edit metadata

## ✨ Features

- **No-Code Token Creation**: Deploy tokens in minutes without writing code
- **Multi-Chain Support**: Deploy on Ethereum, BSC, Polygon, Arbitrum, Fantom, Avalanche, and Solana
- **Advanced Token Features**: Implement burnable, mintable, fee, and redistribution mechanisms
- **Token Vesting**: Configure vesting schedules for team, investors, and ecosystem allocations
- **Presale & IDO**: Launch token sales with customizable parameters
- **Liquidity Locking**: Secure LP tokens with time-locked contracts
- **Airdrop Tool**: Distribute tokens to multiple addresses efficiently
- **Real Blockchain Integration**: Connect with MetaMask, Phantom, and other wallets
- **Automatic Verification**: Smart contracts are automatically verified on block explorers

## 🏗️ Architecture

TokenForge is built with a modern tech stack:

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express
- **Database**: PostgreSQL with Supabase
- **Blockchain**: Ethers.js, Web3.js, Solana Web3.js
- **Smart Contracts**: Solidity (EVM) and Rust (Solana)
- **Testing**: Jest, React Testing Library

## 🔗 Supported Networks

### EVM Networks

- **Mainnets**: Ethereum, BSC, Polygon, Arbitrum, Fantom, Avalanche, Cronos, Core, DogeChain, PulseChain, ZetaChain, Unichain, Bitrock, AlveyChain, OpenGPU, Base, ESR
- **Testnets**: Goerli, BSC Testnet, Mumbai, Arbitrum Sepolia, Fantom Testnet, Avalanche Fuji, Cronos Testnet, Bitrock Testnet, ESR Testnet

### Solana Networks

- **Mainnet**: Solana Mainnet
- **Testnets**: Solana Devnet, Solana Testnet

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- MetaMask or other Web3 wallet for EVM chains
- Phantom or Solflare wallet for Solana

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/tokenforge.git
   cd tokenforge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the development server:
   ```bash
   npm run dev:all
   ```

5. Open your browser and navigate to `http://localhost:5173`

## 📁 Project Structure

```
tokenforge/
├── contracts/            # Smart contract source code
│   ├── tokens/           # Token contract templates
│   ├── presale/          # Presale contract templates
│   ├── vesting/          # Vesting contract templates
│   └── liquidity/        # Liquidity locker templates
├── scripts/              # Deployment scripts
├── server/               # Backend API
│   ├── api/              # API routes
│   ├── db/               # Database models and connection
│   ├── middleware/       # Express middleware
│   └── utils/            # Utility functions
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── hooks/            # Custom React hooks
│   ├── services/         # API and blockchain services
│   ├── types/            # TypeScript type definitions
│   ├── config/           # Configuration files
│   └── abis/             # Contract ABIs
├── supabase/             # Supabase migrations and config
└── tests/                # Test files
```

## 🧪 Testing

Run the test suite:

```bash
npm test
```

For coverage report:

```bash
npm run test:coverage
```

## 🔧 Troubleshooting

### Common EVM Issues

- **MetaMask not connecting**: Make sure you have the latest version of MetaMask installed
- **Transaction failing**: Check if you have enough native tokens for gas fees
- **Network not available**: Add the network to your wallet manually using the RPC URLs

### Common Solana Issues

- **Phantom wallet not connecting**: Ensure Phantom extension is installed and up to date
- **Insufficient SOL**: Request an airdrop on Devnet/Testnet for testing
- **Transaction errors**: Check the Solana Explorer for detailed error messages
- **RPC errors**: Try switching to a different RPC endpoint if experiencing timeouts

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For support, email support@tokenforge.io or join our [Discord community](https://discord.gg/tokenforge).