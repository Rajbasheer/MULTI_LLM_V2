// src/components/common/FileUploader.tsx
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, Loader, File as FileIcon } from 'lucide-react';
import { uploadFile } from '../../services/fileService';
import { toast } from 'react-hot-toast';

interface FileUploaderProps {
  onUploadComplete?: (file: any) => void;
  allowedTypes?: string[];
  maxSize?: number; // in MB
}

const FileUploader: React.FC<FileUploaderProps> = ({
  onUploadComplete,
  allowedTypes = [],
  maxSize = 10 // 10MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`File size exceeds maximum limit of ${maxSize}MB`);
      return;
    }
    
    try {
      setIsUploading(true);
      
      // Simulate progress
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 100);
      
      // Upload file
      const result = await uploadFile(file);
      
      clearInterval(interval);
      setUploadProgress(100);
      
      toast.success('File uploaded successfully');
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
    } catch (error) {
      toast.error('Failed to upload file');
      console.error('Upload error:', error);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 1000);
    }
  }, [maxSize, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: isUploading,
    accept: allowedTypes.length > 0 
      ? allowedTypes.reduce((acc, type) => ({ ...acc, [type]: [] }), {}) 
      : undefined,
    maxFiles: 1
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-300 hover:border-purple-400 dark:border-gray-600 dark:hover:border-purple-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {isUploading ? (
          <div className="text-center">
            <Loader size={40} className="mx-auto text-purple-500 animate-spin" />
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Uploading file...</p>
            <div className="w-full h-2 bg-gray-200 rounded-full mt-3 dark:bg-gray-700">
              <div
                className="h-2 bg-purple-500 rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <Upload size={40} className="mx-auto text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {allowedTypes.length > 0 
                ? `Allowed file types: ${allowedTypes.join(', ')}`
                : 'All file types supported'
              }
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Max file size: {maxSize}MB
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default FileUploader;