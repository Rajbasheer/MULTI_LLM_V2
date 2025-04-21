import React, { useState, useEffect } from 'react';
import { 
  File, FileText, FileImage, FileArchive, Trash2, Download, Search, 
  Plus, Upload, X, Loader 
} from 'lucide-react';

interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  uploadedAt: Date;
  usedInChats?: number;
}

export default function FilesPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Simulate loading files from backend
  useEffect(() => {
    // This would be a fetch request in a real application
    const dummyFiles: FileItem[] = [
      {
        id: '1',
        name: 'report-2023.pdf',
        size: 2500000,
        type: 'application/pdf',
        uploadedAt: new Date(2023, 11, 15),
        usedInChats: 5
      },
      {
        id: '2',
        name: 'data-analysis.csv',
        size: 1200000,
        type: 'text/csv',
        uploadedAt: new Date(2023, 10, 28),
        usedInChats: 12
      },
      {
        id: '3',
        name: 'project-image.jpg',
        size: 3800000,
        type: 'image/jpeg',
        uploadedAt: new Date(2023, 11, 1),
        usedInChats: 3
      }
    ];
    
    setFiles(dummyFiles);
  }, []);
  
  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Helper function to get file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={20} />;
    if (fileType.includes('image')) return <FileImage size={20} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <FileArchive size={20} />;
    return <File size={20} />; 
  };
  
  // Filter files based on search query
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Sort files based on sort criteria
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'name') {
      return sortOrder === 'asc' 
        ? a.name.localeCompare(b.name) 
        : b.name.localeCompare(a.name);
    } else if (sortBy === 'size') {
      return sortOrder === 'asc' 
        ? a.size - b.size 
        : b.size - a.size;
    } else { // date
      return sortOrder === 'asc' 
        ? a.uploadedAt.getTime() - b.uploadedAt.getTime() 
        : b.uploadedAt.getTime() - a.uploadedAt.getTime();
    }
  });
  
  // Handler for file upload
  const handleFileUpload = (uploadFiles: FileList | null) => {
    if (!uploadFiles) return;
    
    setIsUploading(true);
    
    // Simulate file upload with a timeout
    setTimeout(() => {
      const newFiles: FileItem[] = Array.from(uploadFiles).map(file => ({
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date(),
        usedInChats: 0
      }));
      
      setFiles(prev => [...prev, ...newFiles]);
      setIsUploading(false);
    }, 1500);
  };
  
  // Handler for file deletion
  const handleDeleteFiles = () => {
    setFiles(prev => prev.filter(file => !selectedFiles.includes(file.id)));
    setSelectedFiles([]);
  };
  
  // Handler for file selection
  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId) 
        : [...prev, fileId]
    );
  };
  
  // Handler for select all files
  const toggleSelectAll = () => {
    if (selectedFiles.length === sortedFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(sortedFiles.map(file => file.id));
    }
  };
  
  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = () => {
    setIsDragging(false);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Files</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Manage your uploaded files for use in chats
        </p>
      </div>
      
      {/* File upload area */}
      <div 
        className={`border-2 border-dashed rounded-lg p-8 mb-6 flex flex-col items-center justify-center text-center transition-colors ${
          isDragging 
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-400'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <Upload 
            size={40} 
            className="text-gray-400 dark:text-gray-500"
          />
        </div>
        <p className="mb-2 text-gray-700 dark:text-gray-300">
          <span className="font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          PDF, TXT, CSV, DOCX, JSON, MD, XLSX (Max size: 20MB)
        </p>
        <input
          type="file"
          multiple
          onChange={(e) => handleFileUpload(e.target.files)}
          className="hidden"
          id="file-upload"
          accept=".pdf,.txt,.csv,.docx,.json,.md,.xlsx"
        />
        <label
          htmlFor="file-upload"
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 cursor-pointer transition-colors"
        >
          Select Files
        </label>
      </div>
      
      {/* Files list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Search and actions header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-center justify-between">
          {/* Search input */}
          <div className="relative">
            <Search 
              size={18} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2">
            {selectedFiles.length > 0 && (
              <button
                onClick={handleDeleteFiles}
                className="flex items-center gap-2 px-3 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                <Trash2 size={16} />
                Delete {selectedFiles.length === 1 ? 'File' : `${selectedFiles.length} Files`}
              </button>
            )}
            
            {/* Sort controls */}
            <div className="flex items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
                className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="date">Date</option>
                <option value="name">Name</option>
                <option value="size">Size</option>
              </select>
              <button
                onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="ml-2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
        
        {/* Files table */}
        {files.length === 0 ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <File size={40} className="mx-auto mb-3 opacity-50" />
            <p>No files uploaded yet</p>
          </div>
        ) : isUploading ? (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            <Loader size={40} className="mx-auto mb-3 opacity-50 animate-spin" />
            <p>Uploading files...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="w-[40px] px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedFiles.length === sortedFiles.length && sortedFiles.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedFiles.map((file) => (
                  <tr 
                    key={file.id} 
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      selectedFiles.includes(file.id) ? 'bg-purple-50 dark:bg-purple-900/20' : ''
                    }`}
                  >
                    <td className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={selectedFiles.includes(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center">
                        <div className="mr-3 text-gray-400 dark:text-gray-500">
                          {getFileIcon(file.type)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800 dark:text-white">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {file.type.split('/')[1].toUpperCase()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {file.uploadedAt.toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 dark:text-gray-300">
                      Used in {file.usedInChats} chat{file.usedInChats !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Download file"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                          title="Delete file"
                          onClick={() => toggleFileSelection(file.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}