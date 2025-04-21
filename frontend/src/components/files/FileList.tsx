// src/components/files/FileList.tsx
import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Image, 
  File, 
  Code, 
  Download, 
  Trash2, 
  Search,
  RefreshCw
} from 'lucide-react';
import { listFiles, deleteFile } from '../../services/fileService';
import { toast } from 'react-hot-toast';
import Button from '../common/Button';
import { formatDistanceToNow, format } from 'date-fns';

interface FileItemType {
  id: string;
  filename: string;
  file_type: string;
  file_size: number;
  created_at: string;
  is_indexed: boolean;
  download_url: string;
}

const FileList: React.FC = () => {
  const [files, setFiles] = useState<FileItemType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await listFiles();
      setFiles(data.files);
    } catch (err) {
      console.error('Error fetching files:', err);
      setError('Failed to load files');
      toast.error('Failed to load files');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchFiles();
  }, []);
  
  const handleDelete = async (id: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete ${filename}?`)) {
      return;
    }
    
    try {
      await deleteFile(id);
      
      setFiles(prev => prev.filter(file => file.id !== id));
      toast.success('File deleted successfully');
    } catch (err) {
      console.error('Error deleting file:', err);
      toast.error('Failed to delete file');
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };
  
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) {
      return <Image size={20} />;
    } else if (fileType.includes('pdf')) {
      return <FileText size={20} />;
    } else if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('python')) {
      return <Code size={20} />;
    } else {
      return <File size={20} />;
    }
  };
  
  if (loading && files.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex flex-col items-center space-y-2">
          <RefreshCw size={24} className="animate-spin text-purple-500" />
          <p className="text-gray-500 dark:text-gray-400">Loading files...</p>
        </div>
      </div>
    );
  }
  
  if (error && files.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-2">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <Button onClick={fetchFiles} size="sm">Retry</Button>
        </div>
      </div>
    );
  }
  
  if (files.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center space-y-2">
          <p className="text-gray-500 dark:text-gray-400">No files uploaded yet</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                File
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Size
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Uploaded
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Indexed
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {files.map((file) => (
              <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700">
                      {getFileIcon(file.file_type)}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {file.filename}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        ID: {file.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {file.file_type}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatFileSize(file.file_size)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500 dark:text-gray-400" title={format(new Date(file.created_at), 'PPpp')}>
                    {formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {file.is_indexed ? (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                      Indexed
                    </span>
                  ) : (
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                      Processing
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2">
                    <a 
                      href={file.download_url} 
                      download
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                    >
                      <Download size={16} />
                    </a>
                    <button
                      onClick={() => handleDelete(file.id, file.filename)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileList;