// Cloudinary configuration and upload utilities for all multimedia types
// Environment variables needed:
// VITE_CLOUDINARY_CLOUD_NAME - Your Cloudinary cloud name
// VITE_CLOUDINARY_UPLOAD_PRESET - Unsigned upload preset name

export interface CloudinaryUploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  bytes: number;
  width?: number;
  height?: number;
  duration?: number; // For video/audio
  thumbnail?: string;
}

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
  metadata?: CloudinaryUploadResult;
}

export type ResourceType = 'image' | 'video' | 'raw' | 'auto';

/**
 * Upload a file to Cloudinary with automatic resource type detection
 * @param file - The file to upload
 * @param folder - Optional folder path in Cloudinary
 * @param resourceType - Type of resource ('image', 'video', 'raw', 'auto')
 * @param transformation - Optional transformation parameters
 */
export async function uploadFileToCloudinary(
  file: File,
  folder: string = 'naijafind',
  resourceType: ResourceType = 'auto',
  transformation?: string
): Promise<UploadResult> {
  try {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      console.error('Cloudinary configuration missing. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET');
      return fallbackUpload(file);
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);

    // Add optimization parameters based on file type
    if (resourceType === 'image' || file.type.startsWith('image/')) {
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');
    }
    if (resourceType === 'video' || file.type.startsWith('video/')) {
      formData.append('quality', 'auto:good');
      formData.append('fetch_format', 'auto');
    }

    if (transformation) {
      formData.append('transformation', transformation);
    }

    const endpoint = getUploadEndpoint(cloudName, resourceType);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || 'Upload failed');
    }

    const data = await response.json();

    return {
      url: data.secure_url,
      success: true,
      metadata: {
        url: data.url,
        secureUrl: data.secure_url,
        publicId: data.public_id,
        format: data.format,
        bytes: data.bytes,
        width: data.width,
        height: data.height,
        duration: data.duration,
        thumbnail: generateThumbnailUrl(data.secure_url, resourceType, data.format),
      },
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    return fallbackUpload(file);
  }
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadFilesToCloudinary(
  files: File[],
  folder: string = 'naijafind',
  resourceType: ResourceType = 'auto',
  transformation?: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map(file =>
    uploadFileToCloudinary(file, folder, resourceType, transformation)
  );
  return Promise.all(uploadPromises);
}

/**
 * Upload a single image to Cloudinary (legacy compatibility)
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'naijafind',
  transformation?: string
): Promise<UploadResult> {
  return uploadFileToCloudinary(file, folder, 'image', transformation);
}

/**
 * Upload multiple images to Cloudinary (legacy compatibility)
 */
export async function uploadImagesToCloudinary(
  files: File[],
  folder: string = 'naijafind',
  transformation?: string
): Promise<UploadResult[]> {
  return uploadFilesToCloudinary(files, folder, 'image', transformation);
}

/**
 * Upload a video to Cloudinary
 * @param file - Video file to upload
 * @param folder - Optional folder path
 * @param generateThumbnail - Whether to auto-generate thumbnail
 */
export async function uploadVideoToCloudinary(
  file: File,
  folder: string = 'naijafind/videos',
  generateThumbnail: boolean = true
): Promise<UploadResult> {
  const result = await uploadFileToCloudinary(file, folder, 'video');
  if (result.success && generateThumbnail && result.metadata?.publicId) {
    result.metadata.thumbnail = getVideoThumbnailUrl(result.metadata.publicId);
  }
  return result;
}

/**
 * Upload a document to Cloudinary (PDF, DOC, etc.)
 * @param file - Document file to upload
 * @param folder - Optional folder path
 */
export async function uploadDocumentToCloudinary(
  file: File,
  folder: string = 'naijafind/documents'
): Promise<UploadResult> {
  return uploadFileToCloudinary(file, folder, 'raw');
}

/**
 * Upload an audio file to Cloudinary
 * @param file - Audio file to upload
 * @param folder - Optional folder path
 */
export async function uploadAudioToCloudinary(
  file: File,
  folder: string = 'naijafind/audio'
): Promise<UploadResult> {
  void file; // Used via uploadFileToCloudinary
  return uploadFileToCloudinary(file, folder, 'video'); // Cloudinary uses 'video' for audio too
}

/**
 * Fallback upload method - now rejects instead of returning base64
 * to prevent exceeding Convex's 1 MiB limit
 */
async function fallbackUpload(_file: File): Promise<UploadResult> {
  return {
    url: '',
    success: false,
    error: 'Cloudinary not configured. Please set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET environment variables.',
  };
}

/**
 * Get the appropriate Cloudinary upload endpoint based on resource type
 */
function getUploadEndpoint(cloudName: string, resourceType: ResourceType): string {
  const type = resourceType === 'auto' ? 'auto' : resourceType;
  return `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`;
}

/**
 * Generate thumbnail URL based on resource type
 */
function generateThumbnailUrl(
  secureUrl: string,
  resourceType: ResourceType,
  _format?: string
): string | undefined {
  if (resourceType === 'image' || secureUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    return secureUrl.replace('/upload/', '/upload/w_200,h_200,c_fill,q_auto,f_auto/');
  }
  return undefined;
}

/**
 * Generate video thumbnail URL from public ID
 */
function getVideoThumbnailUrl(publicId: string): string {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloudName}/video/upload/w_300,h_200,c_fill,q_auto,so_0/${publicId}.jpg`;
}

/**
 * Validate an image file before upload
 */
export function validateImageFile(
  file: File,
  maxSizeMB: number = 10,
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `File type must be one of: ${allowedTypes.join(', ')}`;
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `File size must be less than ${maxSizeMB}MB`;
  }
  return null;
}

/**
 * Validate a video file before upload
 */
export function validateVideoFile(
  file: File,
  maxSizeMB: number = 100,
  allowedTypes: string[] = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `Video type must be one of: ${allowedTypes.join(', ')}`;
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Video size must be less than ${maxSizeMB}MB`;
  }
  return null;
}

/**
 * Validate a document file before upload
 */
export function validateDocumentFile(
  file: File,
  maxSizeMB: number = 20,
  allowedTypes?: string[]
): string | null {
  const defaultTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'image/jpeg',
    'image/png',
  ];
  const types = allowedTypes || defaultTypes;
  if (!types.includes(file.type)) {
    return `Document type must be one of: PDF, DOC, DOCX, XLS, XLSX, TXT, or images`;
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Document size must be less than ${maxSizeMB}MB`;
  }
  return null;
}

/**
 * Validate an audio file before upload
 */
export function validateAudioFile(
  file: File,
  maxSizeMB: number = 50,
  allowedTypes: string[] = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3', 'audio/aac']
): string | null {
  if (!allowedTypes.includes(file.type)) {
    return `Audio type must be one of: ${allowedTypes.join(', ')}`;
  }
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return `Audio size must be less than ${maxSizeMB}MB`;
  }
  return null;
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: File[],
  validator: (file: File) => string | null
): string[] {
  return files
    .map(file => validator(file))
    .filter(Boolean) as string[];
}

/**
 * Validate multiple image files
 */
export function validateImageFiles(
  files: File[],
  maxSizeMB: number = 10,
  allowedTypes?: string[]
): string[] {
  return validateFiles(files, file => validateImageFile(file, maxSizeMB, allowedTypes));
}

/**
 * Detect resource type from file mime type
 */
export function detectResourceType(file: File): ResourceType {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'video'; // Cloudinary uses 'video' for audio
  return 'raw';
}

/**
 * Check if file type is supported
 */
export function isSupportedFileType(file: File): boolean {
  const supported = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'text/plain',
  ];
  return supported.includes(file.type);
}

/**
 * Generate Cloudinary transformation URL for images
 * @param url - Original Cloudinary URL
 * @param transformations - Transformation parameters (e.g., 'w_500,h_500,c_fill')
 */
export function getTransformedImageUrl(url: string, transformations: string): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  return url.replace('/upload/', `/upload/${transformations}/`);
}

/**
 * Generate optimized image URL
 */
export function getOptimizedImageUrl(url: string, width?: number): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  const transforms = width
    ? `w_${width},q_auto,f_auto`
    : 'q_auto,f_auto';
  return url.replace('/upload/', `/upload/${transforms}/`);
}

/**
 * Generate responsive image srcset URLs
 */
export function getResponsiveImageUrls(url: string): { url: string; width: number }[] {
  if (!url.includes('cloudinary.com')) {
    return [{ url, width: 0 }];
  }
  const sizes = [320, 640, 960, 1280, 1920];
  return sizes.map(width => ({
    width,
    url: url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`),
  }));
}

/**
 * Generate video transformation URL
 */
export function getTransformedVideoUrl(url: string, transformations?: string): string {
  if (!url.includes('cloudinary.com')) {
    return url;
  }
  const transforms = transformations || 'q_auto,f_auto';
  return url.replace('/video/upload/', `/video/upload/${transforms}/`);
}

/**
 * Delete a file from Cloudinary (requires backend implementation)
 * Note: This requires signed authentication, so it should be done via Convex backend
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: ResourceType = 'image'
): Promise<boolean> {
  console.warn('File deletion should be implemented on the backend with Convex');
  return false;
}

// Legacy export for backward compatibility
export { deleteFromCloudinary as deleteImageFromCloudinary };
