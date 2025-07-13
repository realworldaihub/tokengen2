import { TokenMetadata } from '../types/tokenMetadata';
import { AppError, ErrorType, reportError } from './errorHandler';
import { v4 as uuidv4 } from 'uuid';

class MetadataService {
  private apiUrl: string;
  private authToken: string | null = null;
  private sessionId: string | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.sessionId = localStorage.getItem('metadataSessionId') || null;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authToken || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
  }

  // Create a new session for temporary metadata
  createSession(): string {
    const sessionId = uuidv4();
    localStorage.setItem('metadataSessionId', sessionId);
    this.sessionId = sessionId;
    return sessionId;
  }

  // Get current session ID or create a new one
  getSessionId(): string {
    if (!this.sessionId) {
      return this.createSession();
    }
    return this.sessionId;
  }

  // Save temporary metadata during token creation
  async saveTemporaryMetadata(metadata: TokenMetadata): Promise<TokenMetadata> {
    try {
      // Ensure we have a session ID
      const sessionId = this.getSessionId();
      
      const response = await fetch(`${this.apiUrl}/api/token-metadata/temporary`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          ...metadata,
          sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save temporary metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving temporary metadata:', error);
      throw new AppError('Failed to save temporary metadata', ErrorType.SERVER, error);
    }
  }

  // Link temporary metadata to a deployed token
  async linkTemporaryMetadata(tokenAddress: string): Promise<boolean> {
    try {
      const sessionId = this.sessionId;
      if (!sessionId) {
        return false; // No session to link
      }
      
      const response = await fetch(`${this.apiUrl}/api/token-metadata/link`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          tokenAddress,
          sessionId
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.warn('Failed to link metadata:', errorData.error);
        return false;
      }

      // Clear session after successful linking
      localStorage.removeItem('metadataSessionId');
      this.sessionId = null;
      
      return true;
    } catch (error) {
      console.error('Error linking temporary metadata:', error);
      return false;
    }
  }

  async getTokenMetadata(tokenAddress: string): Promise<TokenMetadata | null> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch token metadata: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching token metadata:', error);
      reportError(new AppError('Failed to fetch token metadata', ErrorType.SERVER, error));
      return null;
    }
  }

  // Get metadata history for a token
  async getMetadataHistory(tokenAddress: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}/history`, {
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          return [];
        }
        throw new Error(`Failed to fetch metadata history: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching metadata history:', error);
      reportError(new AppError('Failed to fetch metadata history', ErrorType.SERVER, error));
      return [];
    }
  }

  async saveTokenMetadata(metadata: TokenMetadata): Promise<TokenMetadata> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save token metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving token metadata:', error);
      throw new AppError('Failed to save token metadata', ErrorType.SERVER, error);
    }
  }

  async updateTokenMetadata(metadata: TokenMetadata): Promise<TokenMetadata> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${metadata.tokenAddress}`, {
        method: 'PUT',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update token metadata');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating token metadata:', error);
      throw new AppError('Failed to update token metadata', ErrorType.SERVER, error);
    }
  }

  // Verify token metadata (admin only)
  async verifyMetadata(tokenAddress: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/api/token-metadata/${tokenAddress}/verify`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to verify metadata');
      }

      return true;
    } catch (error) {
      console.error('Error verifying metadata:', error);
      throw new AppError('Failed to verify metadata', ErrorType.SERVER, error);
    }
  }

  async uploadLogo(tokenAddress: string, file: File): Promise<string> {
    try {
      // Create a FormData object to send the file
      const formData = new FormData();
      formData.append('logo', file);
      formData.append('tokenAddress', tokenAddress);

      // Get auth token
      const token = localStorage.getItem('authToken');
      
      // Send the file to the server
      const response = await fetch(`${this.apiUrl}/api/token-metadata/upload-logo`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
          // Don't set Content-Type here, it will be set automatically with the boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload logo');
      }

      const data = await response.json();
      return data.logoUrl;
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new AppError('Failed to upload logo', ErrorType.SERVER, error);
    }
  }

  // Upload temporary logo (base64)
  async uploadTemporaryLogo(file: File): Promise<string> {
    try {
      // Convert file to base64
      const base64 = await this.fileToBase64(file);
      return base64;
    } catch (error) {
      console.error('Error creating temporary logo:', error);
      throw new AppError('Failed to create temporary logo', ErrorType.CLIENT, error);
    }
  }

  // Helper method to convert file to base64 for preview
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  // Validate URL format
  validateUrl(url: string): boolean {
    if (!url) return true; // Empty URL is valid (optional field)
    return url.startsWith('https://');
  }

  // Validate file size
  validateFileSize(file: File, maxSizeMB: number = 1): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  }

  // Validate file type
  validateFileType(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    return allowedTypes.includes(file.type);
  }
  
  // Generate a preview of how the token will look in different contexts
  generatePreview(metadata: TokenMetadata, previewType: 'launchpad' | 'explorer' | 'dex'): string {
    // This would generate HTML/SVG for preview, but for now we'll return a placeholder
    return `Preview of ${metadata.name} (${metadata.symbol}) in ${previewType} view`;
  }
}

export const metadataService = new MetadataService();