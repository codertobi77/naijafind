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
  folder: string = 'suji',
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
 * Upload a single image to Cloudinary (legacy compatibility)
 */
export async function uploadImageToCloudinary(
  file: File,
  folder: string = 'suji',
  transformation?: string
): Promise<UploadResult> {
  return uploadFileToCloudinary(file, folder, 'image', transformation);
}

/**
 * Upload multiple images to Cloudinary (legacy compatibility)
 */
export async function uploadImagesToCloudinary(
  files: File[],
  folder: string = 'suji',
  transformation?: string
): Promise<UploadResult[]> {
  return Promise.all(
    files.map(file => uploadFileToCloudinary(file, folder, 'image', transformation))
  );
}

/**
 * Upload a document to Cloudinary (PDF, DOC, etc.)
 * @param file - Document file to upload
 * @param folder - Optional folder path
 */
export async function uploadDocumentToCloudinary(
  file: File,
  folder: string = 'suji/documents'
): Promise<UploadResult> {
  return uploadFileToCloudinary(file, folder, 'raw');
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
 * Validate a file for purchase requests.
 * Allowed: descriptive video of the product, image, or document (Word/PDF).
 * Size limits are differentiated: videos can be much larger than images/documents.
 */
export function validatePurchaseRequestFile(
  file: File,
  maxSizeMB: number = 20,
  maxVideoSizeMB: number = 100
): string | null {
  const imageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  const videoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  const isVideo = videoTypes.includes(file.type);
  const isAllowed =
    imageTypes.includes(file.type) ||
    isVideo ||
    documentTypes.includes(file.type);

  if (!isAllowed) {
    return `Type non supporté. Utilisez une vidéo (MP4, WebM, MOV, AVI), une image (JPG, PNG, GIF, WebP) ou un document (PDF, Word).`;
  }

  const limitMB = isVideo ? maxVideoSizeMB : maxSizeMB;
  const maxSizeBytes = limitMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return isVideo
      ? `La vidéo doit peser moins de ${limitMB} Mo`
      : `Le fichier doit peser moins de ${limitMB} Mo`;
  }
  return null;
}

export type AttachmentKind = 'image' | 'video' | 'document';

/**
 * Detect the kind of a purchase request attachment from its URL.
 * Handles Cloudinary URLs (/image|video|raw/upload/ segments), plain file
 * extensions, and legacy base64 data URLs stored before the migration.
 */
export function getAttachmentKind(url: string | null | undefined): AttachmentKind {
  if (!url) return 'document';
  if (url.startsWith('data:image/')) return 'image';
  if (url.startsWith('data:video/')) return 'video';
  if (/\/(image|video)\/upload\//.test(url)) {
    return url.includes('/video/upload/') ? 'video' : 'image';
  }
  if (/\.(jpg|jpeg|png|gif|webp)$/i.test(url)) return 'image';
  if (/\.(mp4|webm|mov|avi)$/i.test(url)) return 'video';
  return 'document';
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

