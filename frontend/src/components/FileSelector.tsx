import React, { useState, useEffect } from 'react';
import { FileUp, Trash2, ChevronDown } from 'lucide-react';

interface UploadedFile {
  id: number;
  filename: string;
  upload_time: string;
}

interface FileSelectorProps {
  isDarkMode: boolean;
  onFileSelect: (fileId: number | null) => void;
  selectedFileId: number | null;
}

export function FileSelector({ isDarkMode, onFileSelect, selectedFileId }: FileSelectorProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Fetch files on mount and after upload/delete
  const fetchFiles = async () => {
    try {
      const response = await fetch('http://localhost:8000/files');
      const data = await response.json();
      setUploadedFiles(data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh file list after successful upload
        await fetchFiles();
        // Automatically select the newly uploaded file
        onFileSelect(result.file_id);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDelete = async (fileId: number) => {
    try {
      const response = await fetch(`http://localhost:8000/file/${fileId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        // Refresh file list after successful deletion
        await fetchFiles();
        // If the deleted file was selected, clear selection
        if (selectedFileId === fileId) {
          onFileSelect(null);
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const selectedFile = uploadedFiles.find(file => file.id === selectedFileId);

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        {/* Upload Button */}
        <label className={`cursor-pointer inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
          isDarkMode
            ? 'bg-[#40414f] text-gray-200 hover:bg-[#4a4b55]'
            : 'bg-white text-gray-700 hover:bg-gray-50'
        } border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-300'} transition-colors duration-200`}>
          <FileUp size={16} className="mr-2" />
          {isUploading ? 'Uploading...' : 'Upload File'}
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            accept=".txt,.md,.pdf,.docx"
            disabled={isUploading}
          />
        </label>

        {/* File Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
              isDarkMode
                ? 'bg-[#40414f] text-gray-200 hover:bg-[#4a4b55]'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            } border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-300'} transition-colors duration-200`}
          >
            {selectedFile ? selectedFile.filename : 'Select a file'}
            <ChevronDown size={16} className="ml-2" />
          </button>

          {/* Dropdown Menu */}
          {showDropdown && (
            <div className={`absolute z-50 mt-1 w-64 rounded-md shadow-lg ${
              isDarkMode ? 'bg-[#2d2d2d]' : 'bg-white'
            } ring-1 ring-black ring-opacity-5`}>
              <div className="py-1 max-h-60 overflow-auto">
                {uploadedFiles.length === 0 ? (
                  <div className={`px-4 py-2 text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    No files uploaded
                  </div>
                ) : (
                  <>
                    {/* Option to clear file selection */}
                    <button
                      onClick={() => {
                        onFileSelect(null);
                        setShowDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        !selectedFileId ? isDarkMode ? 'bg-purple-600/20' : 'bg-purple-50' : ''
                      } ${
                        isDarkMode ? 'hover:bg-[#40414f]' : 'hover:bg-gray-100'
                      } cursor-pointer ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      No file selected
                    </button>
                    
                    {/* List of uploaded files */}
                    {uploadedFiles.map((file) => (
                      <div
                        key={file.id}
                        className={`flex items-center justify-between px-4 py-2 text-sm ${
                          selectedFileId === file.id
                            ? isDarkMode ? 'bg-purple-600/20' : 'bg-purple-50'
                            : ''
                        } ${
                          isDarkMode ? 'hover:bg-[#40414f]' : 'hover:bg-gray-100'
                        } cursor-pointer`}
                      >
                        <button
                          onClick={() => {
                            onFileSelect(file.id);
                            setShowDropdown(false);
                          }}
                          className={`flex-1 text-left ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}
                        >
                          {file.filename}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFileDelete(file.id);
                          }}
                          className={`ml-2 p-1 rounded-full ${
                            isDarkMode
                              ? 'hover:bg-red-600/20 text-red-400'
                              : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside handler */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}