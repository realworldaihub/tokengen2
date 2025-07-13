import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/LandingPage';
import { TokenBuilder } from './components/TokenBuilder';
import { VestingConfiguration } from './components/VestingConfiguration';
import { ReviewDeploy } from './components/ReviewDeploy';
import { DeploymentSuccess } from './components/DeploymentSuccess';
import { PresaleWizard } from './components/PresaleWizard';
import { MySales } from './components/MySales';
import { DeployedTokens } from './components/DeployedTokens';
import { SaleRouter } from './components/SaleRouter';
import { SaleExplorer } from './components/SaleExplorer';
import { TokenManagement } from './components/TokenManagement';
import { SolanaIntegration } from './components/SolanaIntegration';
import { SolanaTokenManagement } from './components/SolanaTokenManagement';
import { SolanaAirdrop } from './components/SolanaAirdrop';
import { LiquidityLock } from './components/LiquidityLock';
import { Airdrop } from './components/Airdrop';
import { NotFound } from './components/NotFound';
import { TokenConfig, DeploymentResult, Step } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useNetworkMode } from './hooks/useNetworkMode';
import { useWallet } from './hooks/useWallet';
import { NetworkModeIndicator } from './components/NetworkModeIndicator';
import { ModeBanner } from './components/ModeBanner';
import { 
  getMainnetChainIds, 
  getTestnetChainIds, 
  isMainnetChain, 
  isTestnetChain 
} from './config/chainConfig';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {
  const { isTestnetMode } = useNetworkMode();
  const { isConnected, chainId, switchToNetwork, disconnectWallet } = useWallet();
  const [currentStep, setCurrentStep] = useState<'landing' | 'builder' | 'vesting' | 'review' | 'success' | 'presale' | 'sales' | 'tokens' | 'sale' | 'explore' | 'manage' | 'liquidity-lock' | 'airdrop' | 'solana' | 'solana-manage' | 'solana-airdrop'>('landing');
  const [tokenConfig, setTokenConfig] = useState<TokenConfig | null>(null);
  const [deploymentResult, setDeploymentResult] = useState<DeploymentResult | null>(null);
  const [solanaTokenConfig, setSolanaTokenConfig] = useState(null);
  const [solanaDeploymentResult, setSolanaDeploymentResult] = useState(null);

  // Handle network switching when mode changes or wallet connects
  useEffect(() => {
    if (isConnected && chainId) {
      const isCorrectNetworkType = isTestnetMode ? isTestnetChain(chainId) : isMainnetChain(chainId);
      
      // If network doesn't match mode, try to switch
      if (!isCorrectNetworkType) {
        const targetChainIds = isTestnetMode ? getTestnetChainIds() : getMainnetChainIds();
        if (targetChainIds.length > 0) {
          switchToNetwork(targetChainIds[0]).catch((error) => {
            console.error('Failed to switch network:', error);
          });
        }
      }
    }
  }, [isConnected, chainId, isTestnetMode]);

  const handleGetStarted = () => {
    setCurrentStep('builder');
  };

  const handleLaunchSale = () => {
    setCurrentStep('presale');
  };

  const handleViewSales = () => {
    setCurrentStep('sales');
  };

  const handleViewTokens = () => {
    setCurrentStep('tokens');
  };

  const handleExploreSales = () => {
    setCurrentStep('explore');
  };
  
  const handleLiquidityLock = () => {
    setCurrentStep('liquidity-lock');
  };
  
  const handleAirdrop = () => {
    setCurrentStep('airdrop');
  };
  
  const handleSolana = () => {
    setCurrentStep('solana');
  };

  const handleTokenConfigComplete = (config: TokenConfig) => {
    setTokenConfig(config);
    setCurrentStep('vesting');
  };

  const handleVestingComplete = (config: TokenConfig) => {
    setTokenConfig(config);
    setCurrentStep('review');
  };

  const handleDeploy = (result: DeploymentResult) => {
    setDeploymentResult(result);
    setCurrentStep('success');
  };

  const handleStartNew = () => {
    setCurrentStep('landing');
    setTokenConfig(null);
    setDeploymentResult(null);
  };

  const handleSolanaTokenConfigComplete = (config) => {
    setSolanaTokenConfig(config);
    setCurrentStep('solana-deployment');
  };

  const handleSolanaTokenDeploy = (result) => {
    setSolanaDeploymentResult(result);
    setCurrentStep('solana-success');
  };

  const goBack = () => {
    switch (currentStep) {
      case 'builder':
        setCurrentStep('landing');
        break;
      case 'vesting':
        setCurrentStep('builder');
        break;
      case 'review':
        setCurrentStep('vesting');
        break;
      default:
        setCurrentStep('landing');
    }
  };

  switch (currentStep) {
    case 'landing':
      return (
        <>
        <LandingPage 
          onGetStarted={handleGetStarted}
          onLaunchSale={handleLaunchSale}
          onViewSales={handleViewSales}
          onViewTokens={handleViewTokens}
          onExploreSales={handleExploreSales} 
          onLiquidityLock={handleLiquidityLock}
          onAirdrop={handleAirdrop}
          onSolana={handleSolana}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'builder':
      return (
        <>
        <TokenBuilder
          onBack={goBack}
          onNext={handleTokenConfigComplete}
          initialConfig={tokenConfig || undefined}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'vesting':
      return (
        <>
        <VestingConfiguration
          config={tokenConfig!}
          onBack={goBack}
          onNext={handleVestingComplete}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'review':
      return (
        <>
        <ReviewDeploy
          config={tokenConfig!}
          onBack={goBack}
          onDeploy={handleDeploy}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'success':
      return (
        <>
        <DeploymentSuccess
          result={deploymentResult!}
          onStartNew={handleStartNew}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'presale':
      return (
        <>
        <PresaleWizard
          onBack={() => setCurrentStep('landing')}
        />
        <NetworkModeIndicator />
        <ModeBanner />
        </>
      );
    
    case 'sales':
      return (
        <>
          <MySales />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    case 'tokens':
      return (
        <>
          <DeployedTokens />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    case 'sale':
      return (
        <>
          <SaleRouter />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    case 'explore':
      return (
        <>
          <SaleExplorer />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    case 'manage':
      return (
        <>
          <TokenManagement />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    case 'liquidity-lock':
      return (
        <>
          <LiquidityLock />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
      
    case 'airdrop':
      return (
        <>
          <Airdrop />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
      
    case 'solana':
      return (
        <>
          <SolanaIntegration 
            onCreateToken={handleSolanaTokenConfigComplete}
            onBack={handleStartNew}
          />
        </>
      );
      
    case 'solana-deployment':
      return (
        <>
          <SolanaTokenDeployment
            config={solanaTokenConfig}
            onBack={() => setCurrentStep('solana')}
            onDeploy={handleSolanaTokenDeploy}
          />
        </>
      );
      
    case 'solana-success':
      return (
        <>
          <SolanaTokenSuccess
            result={solanaDeploymentResult}
            onStartNew={() => setCurrentStep('solana')}
          />
        </>
      );
      
    case 'solana-manage':
      return (
        <>
          <SolanaTokenManagement />
        </>
      );
      
    case 'solana-airdrop':
      return (
        <>
          <SolanaAirdrop 
            onBack={() => setCurrentStep('solana')}
          />
        </>
      );
    
    case '404':
      return (
        <>
          <NotFound />
          <NetworkModeIndicator />
          <ModeBanner />
        </>
      );
    
    default:
      // Check if this is a valid route
      const validRoutes = [
        'landing', 'builder', 'vesting', 'review', 'success', 
        'presale', 'sales', 'tokens', 'sale', 'explore', 'manage', 
        'liquidity-lock', 'airdrop', 'solana', 'solana-manage', 
        'solana-airdrop', 'solana-deployment', 'solana-success'
      ];
      if (!validRoutes.includes(currentStep)) {
        return (
          <>
            <NotFound />
            <NetworkModeIndicator />
            <ModeBanner />
          </>
        );
      } else {
        return (
          <>
          <LandingPage 
            onGetStarted={handleGetStarted}
            onLaunchSale={handleLaunchSale}
            onViewSales={handleViewSales}
            onViewTokens={handleViewTokens}
            onExploreSales={handleExploreSales}
            onLiquidityLock={handleLiquidityLock}
            onAirdrop={handleAirdrop}
            onSolana={handleSolana}
          />
          <NetworkModeIndicator />
          <ModeBanner />
          </>
        );
      }
  }
}

export default App;