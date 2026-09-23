import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { uploadFileToCloudinary, validatePurchaseRequestFile, getAttachmentKind } from '../../lib/cloudinary';

interface FileUploadProps {
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  accept?: string;
  description?: string;
  maxFileSizeMB?: number;
  maxVideoFileSizeMB?: number;
}

export default function FileUpload({
  label,
  value,
  onChange,
  accept = 'image/*,video/*,.pdf,.doc,.docx',
  description,
  maxFileSizeMB = 20,
  maxVideoFileSizeMB = 100,
}: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');

  const handleFileChange = async (file: File | null) => {
    if (!file) return;

    const validationError = validatePurchaseRequestFile(file, maxFileSizeMB, maxVideoFileSizeMB);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setUploading(true);
    setFileName(file.name);

    try {
      // Detect resource type based on MIME type
      const resourceType = file.type.startsWith('image/')
        ? 'image'
        : file.type.startsWith('video/')
          ? 'video'
          : 'raw';

      const result = await uploadFileToCloudinary(file, 'Suji/purchase-requests', resourceType);

      if (result.success && result.url) {
        onChange(result.url);
      } else {
        setError(result.error || t('file_upload.failed', 'Échec du téléchargement'));
      }
    } catch (err) {
      setError(t('file_upload.failed', 'Échec du téléchargement'));
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

  const handleRemove = () => {
    onChange('');
    setFileName('');
    setError(null);
  };

  const kind = value ? getAttachmentKind(value) : null;

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
            <p className="text-sm text-gray-600">{t('file_upload.uploading', 'Téléchargement...')}</p>
          </div>
        ) : value ? (
          <div className="space-y-2">
            {kind === 'image' ? (
              <img
                src={value}
                alt={label}
                className="max-h-40 mx-auto rounded-lg"
              />
            ) : kind === 'video' ? (
              <video
                src={value}
                className="max-h-40 mx-auto rounded-lg"
                controls
              />
            ) : (
              <i className="ri-file-text-line text-4xl text-green-600 mx-auto"></i>
            )}
            <p className="text-sm font-medium text-gray-900">
              {fileName || t('file_upload.uploaded', 'Fichier uploadé')}
            </p>
            <button
              type="button"
              className="text-xs text-green-600 hover:text-green-700 underline"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
            >
              {t('file_upload.remove', 'Supprimer')}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <i className="ri-upload-cloud-2-line text-4xl text-gray-400 mx-auto"></i>
            <p className="text-sm text-gray-600">
              {t('file_upload.click_or_drag', 'Cliquez pour télécharger ou glissez-déposez')}
            </p>
            <p className="text-xs text-gray-400">
              {t('file_upload.hint', 'Vidéo (max {{video}} Mo), image ou document PDF/Word (max {{doc}} Mo)', {
                doc: maxFileSizeMB,
                video: maxVideoFileSizeMB,
              })}
            </p>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-500 mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}
