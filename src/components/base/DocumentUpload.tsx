import { useState, useRef } from 'react';
import { uploadDocumentToCloudinary, validateDocumentFile } from '../../lib/cloudinary';

interface DocumentUploadProps {
  label: string;
  documentType: string;
  value: string;
  onChange: (value: string, fileName: string) => void;
  accept?: string;
  description?: string;
}

export default function DocumentUpload({ 
  label, 
  documentType,
  value, 
  onChange,
  accept = 'image/*,application/pdf,.doc,.docx',
  description
}: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    // Validate file using proper document validation
    const validationError = validateDocumentFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setFileName(file.name);

    try {
      // Upload the file to Cloudinary using document upload
      const result = await uploadDocumentToCloudinary(
        file, 
        `Olufinja/verification/${documentType}`
      );
      
      if (result.success) {
        onChange(result.url, file.name);
      } else {
        setError(result.error || 'Échec du téléchargement');
      }
    } catch (err) {
      setError('Échec du téléchargement');
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
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
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
        />
        
        {uploading ? (
          <div className="space-y-2">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="text-sm text-gray-600">Téléchargement...</p>
          </div>
        ) : value ? (
          <div className="space-y-2">
            <i className="ri-file-check-line text-4xl text-green-600"></i>
            <p className="text-sm font-medium text-gray-900">{fileName || 'Document téléchargé'}</p>
            <button
              type="button"
              className="text-xs text-green-600 hover:text-green-700 underline"
              onClick={(e) => {
                e.stopPropagation();
                onChange('', '');
                setFileName('');
              }}
            >
              Changer le document
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <i className="ri-upload-cloud-2-line text-4xl text-gray-400"></i>
            <p className="text-sm text-gray-600">Cliquez pour télécharger ou glissez-déposez</p>
            <p className="text-xs text-gray-400">PDF, JPG, PNG jusqu'à 10MB</p>
          </div>
        )}
        
        {error && (
          <div className="text-sm text-red-500 mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}
