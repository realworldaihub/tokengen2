import { TokenMetadata } from '../types/tokenMetadata';
import { AppError, ErrorType, reportError } from './errorHandler';

class MetadataService {
  private apiUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.authToken || localStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    };
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
}

export const metadataService = new MetadataService();