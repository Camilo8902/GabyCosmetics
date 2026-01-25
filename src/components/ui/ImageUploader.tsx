import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/utils/constants';

interface ImageUploaderProps {
  value?: string;
  onChange?: (file: File | null) => void;
  onUpload?: (url: string) => void;
  label?: string;
  error?: string;
  maxSize?: number;
  accept?: string[];
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onUpload,
  label,
  error,
  maxSize = MAX_FILE_SIZE,
  accept = ALLOWED_IMAGE_TYPES,
  className,
  disabled = false,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!accept.includes(file.type)) {
      alert(`Tipo de archivo no permitido. Solo se permiten: ${accept.join(', ')}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      alert(`El archivo es demasiado grande. Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    onChange?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemove = () => {
    setPreview(null);
    onChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-6 transition-colors',
          isDragging
            ? 'border-rose-500 bg-rose-50'
            : error
            ? 'border-red-300'
            : 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept.join(',')}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          className="hidden"
          disabled={disabled}
        />

        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-cover rounded-lg"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <button
                type="button"
                onClick={handleClick}
                disabled={disabled}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className="w-4 h-4" />
                Subir imagen
              </button>
              <p className="mt-2 text-sm text-gray-500">
                o arrastra y suelta
              </p>
              <p className="mt-1 text-xs text-gray-400">
                PNG, JPG, WEBP hasta {(maxSize / 1024 / 1024).toFixed(2)}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
