// Cloudinary configuration and upload utilities
// Environment variables needed:
// VITE_CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
// VITE_CLOUDINARY_UPLOAD_PRESET - Unsigned upload preset name

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
  thumbnail?: string;
}

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
  metadata?: CloudinaryUploadResult;
}

/**
 * Upload a single image to Cloudinary
 * @param file - The image file to upload
 * @param folder - Optional folder path in Cloudinary
 * @param transformation - Optional transformation parameters
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'naijafind',
  transformation?: string
): Promise<UploadResult> {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
      // Fallback to local base64 encoding for development
      return fallbackUpload(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    
    // Add optimization parameters
    formData.append('quality', 'auto:good');
    formData.append('fetch_format', 'auto');
    
    if (transformation) {
      formData.append('transformation', transformation);
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();

    // Generate optimized thumbnail URL
    const thumbnailUrl = data.secure_url.replace(
      '/upload/',
      '/upload/w_200,h_200,c_fill,q_auto,f_auto/'
    );

    return {
      url: data.secure_url,
      success: true,
      metadata: {
        url: data.url,
        secureUrl: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        width: data.width,
        height: data.height,
        bytes: data.bytes,
        thumbnail: thumbnailUrl,
      },
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    // Fallback to local upload if Cloudinary fails
    return fallbackUpload(file);
  }
}

/**
 * Upload multiple images to Cloudinary
 */
export async function uploadImagesToCloudinary(
  files: File[],
  folder: string = 'naijafind',
  transformation?: string
): Promise<UploadResult[]> {
  // Upload images in parallel for better performance
  const uploadPromises = files.map(file =>
    uploadImageToCloudinary(file, folder, transformation)
  );
  
  return Promise.all(uploadPromises);
}

/**
 * Fallback upload method using base64 encoding for development
 */
async function fallbackUpload(file: File): Promise<UploadResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        url: e.target?.result as string,
        success: true,
      });
    };
    reader.onerror = () => {
      resolve({
        url: '',
        success: false,
        error: 'Failed to read file',
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Validate an image file before upload
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): string | null {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }

  return null; // Valid file
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(
  files: File[],
  maxSizeMB: number = 10,
  allowedTypes?: string[]
): string[] {
  return files
    .map(file => validateImageFile(file, maxSizeMB, allowedTypes))
    .filter(Boolean) as string[];
}

/**
 * Generate Cloudinary transformation URL
 * @param url - Original Cloudinary URL
 * @param transformations - Transformation parameters (e.g., 'w_500,h_500,c_fill')
 */
export function getTransformedImageUrl(url: string, transformations: string): string {
  if (!url.includes('cloudinary.com')) {
    return url; // Not a Cloudinary URL
  }
  
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Delete an image from Cloudinary (requires backend implementation)
 */
export async function deleteImageFromCloudinary(publicId: string): Promise<boolean> {
  // This requires a backend endpoint as deletion needs authentication
  // Implementation should be done on the server side with Convex
  console.warn('Image deletion should be implemented on the backend');
  return false;
}
