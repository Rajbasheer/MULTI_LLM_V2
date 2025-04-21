// src/pages/FilesPage.tsx
import React, { useState } from 'react';
import { UploadCloud } from 'lucide-react';
import FileUploader from '../components/common/FileUploader';
import FileList from '../components/files/FileList';
import { toast } from 'react-hot-toast';

const FilesPage: React.FC = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  const handleUploadComplete = () => {
    setRefreshTrigger(prev => prev + 1);
    // Refresh the file list
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <UploadCloud size={20} className="mr-2" />
          Upload Files
        </h2>
        
        <FileUploader 
          onUploadComplete={handleUploadComplete}
          allowedTypes={[
            'application/pdf',
            'text/plain',
            'text/markdown',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword',
            'text/csv',
            'application/json',
            'text/html',
            'application/javascript',
            'text/javascript',
            'application/typescript',
            'image/png',
            'image/jpeg',
            'image/jpg'
          ]}
          maxSize={50} // 50MB
        />
        
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          <p>Files will be processed and indexed for RAG (Retrieval-Augmented Generation).</p>
          <p>This enables the AI to reference document content when answering questions.</p>
        </div>
      </div>
      
      <div>
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Uploaded Files
        </h2>
        
        <FileList key={refreshTrigger} />
      </div>
    </div>
  );
};

export default FilesPage;