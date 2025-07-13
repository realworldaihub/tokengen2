import React from 'react';
import { 
  Globe, 
  Twitter, 
  MessageCircle, 
  FileText, 
  Github, 
  Tag,
  ExternalLink,
  Coins
} from 'lucide-react';
import { TokenMetadata, TOKEN_CATEGORIES } from '../types/tokenMetadata';

interface TokenMetadataDisplayProps {
  metadata: TokenMetadata;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  showLinks?: boolean;
  showTags?: boolean;
}

export const TokenMetadataDisplay: React.FC<TokenMetadataDisplayProps> = ({
  metadata,
  size = 'md',
  showDescription = true,
  showLinks = true,
  showTags = true
}) => {
  // Size mappings
  const logoSizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };
  
  const titleSizes = {
    sm: 'text-base',
    md: 'text-lg',
    lg: 'text-xl'
  };
  
  const subtitleSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  return (
    <div className="space-y-4">
      {/* Logo and Basic Info */}
      <div className="flex items-center space-x-3">
        {metadata.logoUrl ? (
          <img 
            src={metadata.logoUrl} 
            alt={metadata.name || 'Token logo'} 
            className={`${logoSizes[size]} rounded-full object-cover`}
          />
        ) : (
          <div className={`${logoSizes[size]} bg-white/10 rounded-full flex items-center justify-center`}>
            <Coins className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-6 h-6' : 'w-8 h-8'} text-gray-400`} />
          </div>
        )}
        
        <div>
          <h4 className={`${titleSizes[size]} font-semibold text-white`}>
            {metadata.name}
          </h4>
          <p className={`${subtitleSizes[size]} text-gray-300`}>{metadata.symbol}</p>
        </div>
      </div>
      
      {/* Tags */}
      {showTags && metadata.tags && metadata.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {metadata.tags.map(tag => {
            const category = TOKEN_CATEGORIES.find(c => c.id === tag);
            return (
              <span 
                key={tag} 
                className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs"
              >
                {category?.name || tag}
              </span>
            );
          })}
        </div>
      )}
      
      {/* Description */}
      {showDescription && metadata.description && (
        <p className="text-gray-300 text-sm">{metadata.description}</p>
      )}
      
      {/* Links */}
      {showLinks && (
        <div className="grid grid-cols-2 gap-2">
          {metadata.websiteUrl && (
            <a 
              href={metadata.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Globe className="w-4 h-4" />
              <span>Website</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {metadata.twitterUrl && (
            <a 
              href={metadata.twitterUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Twitter className="w-4 h-4" />
              <span>Twitter</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {metadata.telegramUrl && (
            <a 
              href={metadata.telegramUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Telegram</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {metadata.discordUrl && (
            <a 
              href={metadata.discordUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Discord</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {metadata.whitepaperUrl && (
            <a 
              href={metadata.whitepaperUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <FileText className="w-4 h-4" />
              <span>Whitepaper</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
          
          {metadata.githubUrl && (
            <a 
              href={metadata.githubUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};