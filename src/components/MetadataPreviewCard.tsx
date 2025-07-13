import React from 'react';
import { TokenMetadata, MetadataPreview } from '../types/tokenMetadata';
import { Coins, ExternalLink, Tag } from 'lucide-react';

interface MetadataPreviewCardProps {
  metadata: TokenMetadata;
  previewType: MetadataPreview;
}

export const MetadataPreviewCard: React.FC<MetadataPreviewCardProps> = ({ 
  metadata, 
  previewType 
}) => {
  // Different layouts based on preview type
  const renderPreview = () => {
    switch (previewType.type) {
      case 'launchpad':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 w-full">
            <div className="flex items-start space-x-4">
              {metadata.logoData || metadata.logoUrl ? (
                <img 
                  src={metadata.logoData || metadata.logoUrl} 
                  alt={metadata.name || 'Token logo'} 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <Coins className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold text-white">{metadata.name || 'Token Name'}</h3>
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Live</span>
                </div>
                <p className="text-gray-300 text-sm">{metadata.symbol || 'SYM'}</p>
                
                {metadata.description && (
                  <p className="text-gray-300 text-sm mt-2 line-clamp-2">{metadata.description}</p>
                )}
                
                {metadata.tags && metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {metadata.tags.map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-4">
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                  style={{ width: '65%' }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>65% Complete</span>
                <span>100 ETH Raised</span>
              </div>
            </div>
          </div>
        );
        
      case 'explorer':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 w-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {metadata.logoData || metadata.logoUrl ? (
                  <img 
                    src={metadata.logoData || metadata.logoUrl} 
                    alt={metadata.name || 'Token logo'} 
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                    <Coins className="w-6 h-6 text-gray-400" />
                  </div>
                )}
                
                <div>
                  <h3 className="text-lg font-semibold text-white">{metadata.name || 'Token Name'}</h3>
                  <p className="text-gray-300 text-sm">{metadata.symbol || 'SYM'}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-xl font-bold text-white">1,000,000</div>
                <div className="text-sm text-gray-300">Total Supply</div>
              </div>
            </div>
            
            {metadata.description && (
              <p className="text-gray-300 text-sm mb-4">{metadata.description}</p>
            )}
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-300">Holders</div>
                <div className="text-white font-medium">250</div>
              </div>
              <div>
                <div className="text-sm text-gray-300">Transfers</div>
                <div className="text-white font-medium">1,250</div>
              </div>
            </div>
            
            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {metadata.tags.map(tag => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              {metadata.websiteUrl && (
                <a 
                  href="#" 
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {metadata.twitterUrl && (
                <a 
                  href="#" 
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  <span>Twitter</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {metadata.telegramUrl && (
                <a 
                  href="#" 
                  className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 text-xs"
                >
                  <span>Telegram</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        );
        
      case 'dex':
        return (
          <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 w-full">
            <div className="flex items-center space-x-3">
              {metadata.logoData || metadata.logoUrl ? (
                <img 
                  src={metadata.logoData || metadata.logoUrl} 
                  alt={metadata.name || 'Token logo'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                  <Coins className="w-5 h-5 text-gray-400" />
                </div>
              )}
              
              <div>
                <h3 className="text-base font-semibold text-white">{metadata.symbol || 'SYM'}</h3>
                <p className="text-gray-300 text-xs">{metadata.name || 'Token Name'}</p>
              </div>
              
              <div className="ml-auto">
                <div className="text-right">
                  <div className="text-white font-medium">$0.25</div>
                  <div className="text-xs text-green-400">+5.2%</div>
                </div>
              </div>
            </div>
            
            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {metadata.tags.slice(0, 2).map(tag => (
                  <span
                    key={tag}
                    className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs"
                  >
                    {tag}
                  </span>
                ))}
                {metadata.tags.length > 2 && (
                  <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-xs">
                    +{metadata.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-white">{previewType.title}</div>
      <p className="text-xs text-gray-400 mb-2">{previewType.description}</p>
      {renderPreview()}
    </div>
  );
};