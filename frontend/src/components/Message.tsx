import React from 'react';
import { Trash2, File, FileText, FileImage, FileArchive } from 'lucide-react';

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface MessageProps {
  id: string;
  content: string;
  isUser?: boolean;
  modelName?: string;
  isDarkMode: boolean;
  onDelete: (id: string) => void;
  attachments?: FileAttachment[];
}

export function Message({ 
  id, 
  content, 
  isUser = false, 
  modelName, 
  isDarkMode, 
  onDelete, 
  attachments 
}: MessageProps) {
  // Helper function to get the appropriate file icon
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <FileText size={16} />;
    if (fileType.includes('image')) return <FileImage size={16} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <FileArchive size={16} />;
    return <File size={16} />; 
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`py-8 ${isUser 
      ? (isDarkMode ? 'bg-[#343541]' : 'bg-white') 
      : (isDarkMode ? 'bg-[#444654]' : 'bg-gray-50')} group`}>
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex items-start gap-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isUser ? 'bg-purple-500' : 'bg-teal-500'
          }`}>
            {isUser ? 'U' : 'A'}
          </div>
          <div className="flex-1">
            {modelName && (
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>{modelName}</div>
            )}
            
            {/* Message content */}
            <p className={isDarkMode ? 'text-gray-100' : 'text-gray-800'}>
              {content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </p>
            
            {/* File attachments */}
            {attachments && attachments.length > 0 && (
              <div className={`mt-3 ${isDarkMode ? 'bg-[#40414f]' : 'bg-gray-100'} p-2 rounded-md`}>
                <div className={`text-xs font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Attachments ({attachments.length})
                </div>
                <div className="space-y-2">
                  {attachments.map((file) => (
                    <div key={file.id} className={`flex items-center text-xs ${
                      isDarkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      <div className={`mr-2 p-1 rounded ${
                        isDarkMode ? 'bg-[#565869]' : 'bg-gray-200'
                      }`}>
                        {getFileIcon(file.type)}
                      </div>
                      <div className="overflow-hidden">
                        <div className="truncate">{file.name}</div>
                        <div className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={() => onDelete(id)}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-2 ${
              isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
            } rounded-md hover:bg-opacity-10 hover:bg-gray-500`}
            title="Delete message"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}