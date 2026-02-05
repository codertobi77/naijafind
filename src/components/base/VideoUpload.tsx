import { useState, useRef } from 'react';
import { uploadVideoToCloudinary, validateVideoFile } from '../../lib/cloudinary';

interface VideoUploadProps {
  label: string;
  value: string;
  onChange: (value: string, metadata?: { thumbnail?: string; duration?: number }) => void;
  placeholder?: string;
  maxSizeMB?: number;
  folder?: string;
}

export default function VideoUpload({
  label,
  value,
  onChange,
  placeholder = 'Click to upload or drag and drop a video',
  maxSizeMB = 100,
  folder = 'naijafind/videos',
}: VideoUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate the file
    const validationError = validateVideoFile(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 1000);

      const result = await uploadVideoToCloudinary(file, folder, true);
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        setPreviewUrl(result.metadata?.thumbnail || result.url);
        onChange(result.url, {
          thumbnail: result.metadata?.thumbnail,
          duration: result.metadata?.duration,
        });
      } else {
        setError(result.error || 'Video upload failed');
      }
    } catch (err) {
      setError('Video upload failed');
      console.error('Upload error:', err);
    } finally {
      setTimeout(() => setUploading(false), 500);
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
      handleFileChange(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
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
          accept="video/mp4,video/webm,video/quicktime"
          onChange={handleFileInput}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="text-sm text-gray-600">Uploading video...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : value ? (
          <div className="relative">
            {previewUrl ? (
              <div className="relative">
                <img
                  src={previewUrl}
                  alt="Video thumbnail"
                  className="max-h-40 mx-auto rounded-lg"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-black/50 rounded-full p-3">
                    <i className="ri-play-fill text-white text-2xl"></i>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <i className="ri-video-line text-4xl text-green-600"></i>
                <p className="text-sm font-medium text-gray-900">Video uploaded</p>
              </div>
            )}
            <button
              type="button"
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewUrl(null);
                onChange('', undefined);
              }}
            >
              <i className="ri-close-line text-xs"></i>
            </button>
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-green-600 hover:text-green-700 underline"
              onClick={(e) => e.stopPropagation()}
            >
              View video
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <i className="ri-movie-line text-4xl text-gray-400"></i>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-400">MP4, WebM, MOV up to {maxSizeMB}MB</p>
          </div>
        )}

        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}
