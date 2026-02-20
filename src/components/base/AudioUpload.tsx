import { useState, useRef } from 'react';
import { uploadAudioToCloudinary, validateAudioFile } from '../../lib/cloudinary';

interface AudioUploadProps {
  label: string;
  value: string;
  onChange: (value: string, metadata?: { duration?: number }) => void;
  placeholder?: string;
  maxSizeMB?: number;
  folder?: string;
  showWaveform?: boolean;
}

export default function AudioUpload({
  label,
  value,
  onChange,
  placeholder = 'Click to upload or drag and drop an audio file',
  maxSizeMB = 50,
  folder = 'Olufinja/audio',
  showWaveform = true,
}: AudioUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate the file
    const validationError = validateAudioFile(file, maxSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setProgress(0);
    setFileName(file.name);

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 15, 90));
      }, 800);

      const result = await uploadAudioToCloudinary(file, folder);
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        onChange(result.url, {
          duration: result.metadata?.duration,
        });
      } else {
        setError(result.error || 'Audio upload failed');
      }
    } catch (err) {
      setError('Audio upload failed');
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

  // Generate simple waveform visualization
  const Waveform = () => (
    <div className="flex items-center justify-center space-x-1 h-8">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="w-1 bg-green-500 rounded-full animate-pulse"
          style={{
            height: `${20 + Math.random() * 60}%`,
            animationDelay: `${i * 50}ms`,
          }}
        ></div>
      ))}
    </div>
  );

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
          accept="audio/mpeg,audio/wav,audio/ogg,audio/mp3,audio/aac"
          onChange={handleFileInput}
        />

        {uploading ? (
          <div className="space-y-3">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]"></div>
            <p className="text-sm text-gray-600">Uploading audio...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500">{progress}%</p>
          </div>
        ) : value ? (
          <div className="space-y-3">
            {showWaveform && <Waveform />}
            <div className="flex items-center justify-center space-x-2">
              <i className="ri-music-2-line text-green-600 text-xl"></i>
              <span className="text-sm font-medium text-gray-900 truncate max-w-xs">
                {fileName || 'Audio file uploaded'}
              </span>
            </div>
            <audio controls className="w-full max-w-xs mx-auto" onClick={(e) => e.stopPropagation()}>
              <source src={value} />
              Your browser does not support the audio element.
            </audio>
            <div className="flex items-center justify-center space-x-3">
              <a
                href={value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-green-600 hover:text-green-700 underline"
                onClick={(e) => e.stopPropagation()}
              >
                Download
              </a>
              <button
                type="button"
                className="text-sm text-red-600 hover:text-red-700 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('', undefined);
                  setFileName('');
                }}
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <i className="ri-mic-2-line text-4xl text-gray-400"></i>
            <p className="text-sm text-gray-600">{placeholder}</p>
            <p className="text-xs text-gray-400">MP3, WAV, OGG, AAC up to {maxSizeMB}MB</p>
          </div>
        )}

        {error && <div className="text-sm text-red-500 mt-2">{error}</div>}
      </div>
    </div>
  );
}
