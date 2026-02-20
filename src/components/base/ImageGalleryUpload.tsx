import { useState, useRef } from 'react';
import { uploadImagesToCloudinary, validateImageFiles } from '../../lib/cloudinary';

interface ImageGalleryUploadProps {
  label: string;
  value: string[];
  onChange: (value: string[]) => void;
  maxImages?: number;
  placeholder?: string;
  accept?: string;
}

export default function ImageGalleryUpload({ 
  label, 
  value = [], 
  onChange, 
  maxImages = 10,
  placeholder = 'Click to upload or drag and drop images',
  accept = 'image/*'
}: ImageGalleryUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Validate files
    const fileArray = Array.from(files).slice(0, maxImages - value.length);
    const validationErrors = validateImageFiles(fileArray);
    
    if (validationErrors.length > 0) {
      setError(validationErrors[0]); // Show the first error
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Upload the files to Cloudinary
      const results = await uploadImagesToCloudinary(fileArray, 'Olufinja/gallery');
      
      const successfulUploads = results
        .filter(result => result.success)
        .map(result => result.url);
      
      const failedUploads = results.filter(result => !result.success);
      
      if (failedUploads.length > 0) {
        setError(`Failed to upload ${failedUploads.length} image(s)`);
      }
      
      if (successfulUploads.length > 0) {
        onChange([...value, ...successfulUploads]);
      }
    } catch (err) {
      setError('Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files);
    }
  };

  const removeImage = (index: number) => {
    const newValue = [...value];
    newValue.splice(index, 1);
    onChange(newValue);
  };

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging 
            ? 'border-green-500 bg-green-50' 
            : 'border-gray-300 hover:border-green-400'
        }`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={handleFileInput}
          multiple
          disabled={uploading || value.length >= maxImages}
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="text-sm text-gray-600">Uploading...</p>
          </div>
        ) : value.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {value.map((image, index) => (
                <div key={index} className="relative group">
                  <img 
                    src={image} 
                    alt={`Gallery ${index + 1}`} 
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(index);
                    }}
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </div>
              ))}
            </div>
            {value.length < maxImages && (
              <div className="text-sm text-gray-500 mt-2">
                {value.length} of {maxImages} images uploaded
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <i className="ri-image-add-line text-3xl text-gray-400 mx-auto"></i>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB each</p>
          </div>
        )}
        
        {value.length >= maxImages && (
          <div className="text-sm text-gray-500 mt-2">
            Maximum of {maxImages} images reached
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-500 mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}