import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  X, 
  Link, 
  Twitter, 
  MessageCircle, 
  FileText, 
  Github, 
  Globe, 
  Tag, 
  AlertTriangle, 
  CheckCircle, 
  Loader2 
} from 'lucide-react';
import { TokenMetadata, TOKEN_CATEGORIES } from '../types/tokenMetadata';
import { metadataService } from '../services/metadataService';

interface TokenMetadataFormProps {
  tokenAddress: string;
  tokenName?: string;
  tokenSymbol?: string;
  isOwner: boolean;
  onSave?: (metadata: TokenMetadata) => void;
  initialMetadata?: TokenMetadata;
}

export const TokenMetadataForm: React.FC<TokenMetadataFormProps> = ({
  tokenAddress,
  tokenName,
  tokenSymbol,
  isOwner,
  onSave,
  initialMetadata
}) => {
  const [metadata, setMetadata] = useState<TokenMetadata>({
    tokenAddress,
    name: tokenName || '',
    symbol: tokenSymbol || '',
    description: '',
    logoUrl: '',
    websiteUrl: '',
    twitterUrl: '',
    telegramUrl: '',
    discordUrl: '',
    whitepaperUrl: '',
    githubUrl: '',
    tags: []
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load initial metadata if provided
  useEffect(() => {
    if (initialMetadata) {
      setMetadata(initialMetadata);
      if (initialMetadata.logoUrl) {
        setLogoPreview(initialMetadata.logoUrl);
      }
    }
  }, [initialMetadata]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setMetadata(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle logo file selection
  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size
      if (!metadataService.validateFileSize(file)) {
        setErrors(prev => ({ ...prev, logo: 'Logo file must be less than 1MB' }));
        return;
      }
      
      // Validate file type
      if (!metadataService.validateFileType(file)) {
        setErrors(prev => ({ ...prev, logo: 'Logo must be JPG, PNG, or WebP' }));
        return;
      }
      
      // Clear error
      if (errors.logo) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.logo;
          return newErrors;
        });
      }
      
      // Set file and preview
      setLogoFile(file);
      const base64 = await metadataService.fileToBase64(file);
      setLogoPreview(base64);
    }
  };

  // Handle tag selection
  const handleTagToggle = (tagId: string) => {
    setMetadata(prev => {
      const currentTags = prev.tags || [];
      if (currentTags.includes(tagId)) {
        return { ...prev, tags: currentTags.filter(t => t !== tagId) };
      } else {
        return { ...prev, tags: [...currentTags, tagId] };
      }
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    // Validate URLs
    const urlFields = ['websiteUrl', 'twitterUrl', 'telegramUrl', 'discordUrl', 'whitepaperUrl', 'githubUrl'];
    urlFields.forEach(field => {
      const value = metadata[field as keyof TokenMetadata] as string;
      if (value && !metadataService.validateUrl(value)) {
        newErrors[field] = 'URL must start with https://';
      }
    });
    
    // Validate description length
    if (metadata.description && metadata.description.length > 300) {
      newErrors.description = 'Description must be 300 characters or less';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    setSuccess(null);
    
    try {
      // Upload logo if selected
      if (logoFile) {
        setIsUploading(true);
        const logoUrl = await metadataService.uploadLogo(tokenAddress, logoFile);
        setMetadata(prev => ({ ...prev, logoUrl }));
        setIsUploading(false);
      }
      
      // Save metadata
      const updatedMetadata = { ...metadata };
      if (logoFile) {
        updatedMetadata.logoUrl = await metadataService.uploadLogo(tokenAddress, logoFile);
      }
      
      let result;
      if (initialMetadata?.id) {
        result = await metadataService.updateTokenMetadata(updatedMetadata);
      } else {
        result = await metadataService.saveTokenMetadata(updatedMetadata);
      }
      
      setSuccess('Token metadata saved successfully!');
      
      // Call onSave callback if provided
      if (onSave) {
        onSave(result);
      }
    } catch (error) {
      console.error('Error saving metadata:', error);
      setErrors(prev => ({ ...prev, submit: (error as Error).message }));
    } finally {
      setIsSaving(false);
    }
  };

  // Clear logo
  const handleClearLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setMetadata(prev => ({ ...prev, logoUrl: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Render form in read-only mode if not owner
  if (!isOwner) {
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
        <h3 className="text-xl font-semibold text-white mb-6">Token Metadata</h3>
        
        {!initialMetadata ? (
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-300">No metadata has been added for this token yet.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Logo and Basic Info */}
            <div className="flex items-center space-x-4">
              {initialMetadata.logoUrl ? (
                <img 
                  src={initialMetadata.logoUrl} 
                  alt={initialMetadata.name || 'Token logo'} 
                  className="w-16 h-16 rounded-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center">
                  <Coins className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              <div>
                <h4 className="text-lg font-semibold text-white">
                  {initialMetadata.name || tokenName}
                </h4>
                <p className="text-gray-300">{initialMetadata.symbol || tokenSymbol}</p>
              </div>
            </div>
            
            {/* Description */}
            {initialMetadata.description && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">Description</h5>
                <p className="text-white">{initialMetadata.description}</p>
              </div>
            )}
            
            {/* Tags */}
            {initialMetadata.tags && initialMetadata.tags.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-300 mb-2">Categories</h5>
                <div className="flex flex-wrap gap-2">
                  {initialMetadata.tags.map(tag => {
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
              </div>
            )}
            
            {/* Links */}
            <div>
              <h5 className="text-sm font-medium text-gray-300 mb-2">Links</h5>
              <div className="grid grid-cols-2 gap-4">
                {initialMetadata.websiteUrl && (
                  <a 
                    href={initialMetadata.websiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </a>
                )}
                
                {initialMetadata.twitterUrl && (
                  <a 
                    href={initialMetadata.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Twitter className="w-4 h-4" />
                    <span>Twitter</span>
                  </a>
                )}
                
                {initialMetadata.telegramUrl && (
                  <a 
                    href={initialMetadata.telegramUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Telegram</span>
                  </a>
                )}
                
                {initialMetadata.discordUrl && (
                  <a 
                    href={initialMetadata.discordUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Discord</span>
                  </a>
                )}
                
                {initialMetadata.whitepaperUrl && (
                  <a 
                    href={initialMetadata.whitepaperUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Whitepaper</span>
                  </a>
                )}
                
                {initialMetadata.githubUrl && (
                  <a 
                    href={initialMetadata.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 text-blue-400 hover:text-blue-300"
                  >
                    <Github className="w-4 h-4" />
                    <span>GitHub</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
      <h3 className="text-xl font-semibold text-white mb-6">
        {initialMetadata ? 'Update Token Metadata' : 'Add Token Metadata'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Name
            </label>
            <input
              type="text"
              name="name"
              value={metadata.name}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Token Name"
              disabled={!!tokenName}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Token Symbol
            </label>
            <input
              type="text"
              name="symbol"
              value={metadata.symbol}
              onChange={handleChange}
              className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Symbol"
              disabled={!!tokenSymbol}
            />
          </div>
        </div>
        
        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Token Logo
          </label>
          <div className="flex items-center space-x-4">
            {logoPreview || initialMetadata?.logoUrl ? (
              <div className="relative">
                <img 
                  src={logoPreview || initialMetadata?.logoUrl} 
                  alt="Token logo preview" 
                  className="w-16 h-16 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleClearLogo}
                  className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div 
                className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center cursor-pointer hover:bg-white/20 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-6 h-6 text-gray-400" />
              </div>
            )}
            
            <div className="flex-1">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleLogoChange}
                className="hidden"
                accept="image/jpeg,image/png,image/webp"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                {logoPreview ? 'Change Logo' : 'Upload Logo'}
              </button>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, or WebP. Max 1MB.
              </p>
              {errors.logo && (
                <p className="text-red-400 text-xs mt-1">{errors.logo}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Description (max 300 characters)
          </label>
          <textarea
            name="description"
            value={metadata.description}
            onChange={handleChange}
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description of your token and its purpose"
            rows={3}
            maxLength={300}
          />
          <div className="flex justify-between text-xs mt-1">
            <span className={errors.description ? 'text-red-400' : 'text-gray-400'}>
              {errors.description || `${metadata.description?.length || 0}/300 characters`}
            </span>
          </div>
        </div>
        
        {/* Links */}
        <div className="space-y-4">
          <h4 className="text-lg font-medium text-white">Links</h4>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Globe className="w-4 h-4 inline mr-1" />
                Website URL
              </label>
              <input
                type="text"
                name="websiteUrl"
                value={metadata.websiteUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.websiteUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://yourwebsite.com"
              />
              {errors.websiteUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.websiteUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Twitter className="w-4 h-4 inline mr-1" />
                Twitter URL
              </label>
              <input
                type="text"
                name="twitterUrl"
                value={metadata.twitterUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.twitterUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://twitter.com/yourproject"
              />
              {errors.twitterUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.twitterUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Telegram URL
              </label>
              <input
                type="text"
                name="telegramUrl"
                value={metadata.telegramUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.telegramUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://t.me/yourproject"
              />
              {errors.telegramUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.telegramUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <MessageCircle className="w-4 h-4 inline mr-1" />
                Discord URL
              </label>
              <input
                type="text"
                name="discordUrl"
                value={metadata.discordUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.discordUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://discord.gg/yourproject"
              />
              {errors.discordUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.discordUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                Whitepaper URL
              </label>
              <input
                type="text"
                name="whitepaperUrl"
                value={metadata.whitepaperUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.whitepaperUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://yourproject.com/whitepaper.pdf"
              />
              {errors.whitepaperUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.whitepaperUrl}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Github className="w-4 h-4 inline mr-1" />
                GitHub URL
              </label>
              <input
                type="text"
                name="githubUrl"
                value={metadata.githubUrl}
                onChange={handleChange}
                className={`w-full bg-white/10 border rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.githubUrl ? 'border-red-500' : 'border-white/20'
                }`}
                placeholder="https://github.com/yourproject"
              />
              {errors.githubUrl && (
                <p className="text-red-400 text-xs mt-1">{errors.githubUrl}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Category Tags */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Tag className="w-4 h-4 inline mr-1" />
            Category Tags
          </label>
          <div className="flex flex-wrap gap-2">
            {TOKEN_CATEGORIES.map(category => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleTagToggle(category.id)}
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  metadata.tags?.includes(category.id)
                    ? 'bg-blue-500 text-white'
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Error and Success Messages */}
        {errors.submit && (
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5" />
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          </div>
        )}
        
        {success && (
          <div className="p-3 bg-green-500/20 border border-green-500/50 rounded-lg">
            <div className="flex items-start space-x-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5" />
              <p className="text-green-400 text-sm">{success}</p>
            </div>
          </div>
        )}
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving || isUploading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 disabled:opacity-50"
          >
            {isSaving || isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isUploading ? 'Uploading...' : 'Saving...'}</span>
              </>
            ) : (
              <span>Save Metadata</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};