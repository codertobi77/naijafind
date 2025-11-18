// Utility functions for handling image uploads
// In a real implementation, these would connect to an actual image storage service

export interface UploadResult {
  url: string;
  success: boolean;
  error?: string;
}

/**
 * Simulate uploading a single image file
 * In a real implementation, this would upload to a service like Cloudinary, AWS S3, etc.
 */
export async function uploadImage(file: File): Promise<UploadResult> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // In a real implementation, you would:
  // 1. Create a FormData object with the file
  // 2. Send it to your image storage service
  // 3. Return the URL from the service response
  
  // For demo purposes, we'll just return a data URL
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      resolve({
        url: e.target?.result as string,
        success: true
      });
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Simulate uploading multiple image files
 */
export async function uploadImages(files: File[]): Promise<UploadResult[]> {
  return Promise.all(files.map(uploadImage));
}

/**
 * Validate an image file before upload
 */
export function validateImageFile(file: File, maxSizeMB: number = 10): string | null {
  // Check file type
  if (!file.type.startsWith('image/')) {
    return 'File must be an image';
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
export function validateImageFiles(files: File[], maxSizeMB: number = 10): string[] {
  return files.map(file => validateImageFile(file, maxSizeMB)).filter(Boolean) as string[];
}