import React, { useState, useRef } from 'react';
import { Paperclip, X, File } from 'lucide-react';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  isDarkMode: boolean;
  disabled: boolean;
}

export function FileUpload({ onFilesSelected, isDarkMode, disabled }: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(filesArray);
      onFilesSelected(filesArray);
    }
    
    // Reset the file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
  };
  
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  return (
    <div>
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        multiple
        accept=".pdf,.txt,.csv,.json,.md,.docx,.xlsx"
        disabled={disabled}
      />
      
      {/* File upload button */}
      <button
        type="button"
        onClick={openFileDialog}
        disabled={disabled}
        className={`p-2 ${
          isDarkMode 
            ? 'text-gray-400 hover:bg-[#4a4b55]' 
            : 'text-gray-500 hover:bg-gray-100'
        } rounded transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        title="Upload files"
      >
        <Paperclip size={16} />
      </button>
      
      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className={`absolute left-0 bottom-full mb-2 w-64 ${isDarkMode ? 'bg-[#40414f]' : 'bg-gray-100'} rounded-md p-2 shadow-lg`}>
          <div className="text-xs font-medium mb-1 flex justify-between items-center">
            <span className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>Selected Files</span>
          </div>
          <div className="space-y-1 max-h-20 overflow-y-auto">
            {selectedFiles.map((file, index) => (
              <div 
                key={index} 
                className={`flex items-center justify-between text-xs ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                } p-1 rounded ${
                  isDarkMode ? 'hover:bg-[#4a4b55]' : 'hover:bg-gray-200'
                }`}
              >
                <div className="flex items-center overflow-hidden">
                  <File size={12} className="mr-1 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className={`ml-2 p-1 rounded ${
                    isDarkMode ? 'hover:bg-[#565869]' : 'hover:bg-gray-300'
                  }`}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}