// src/pages/SearchPage.tsx
import React from 'react';
import { Search, Database } from 'lucide-react';
import SearchInterface from '../components/search/SearchInterface';

const SearchPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Search size={20} className="mr-2" />
          Search Your Documents
        </h2>
        
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Search through your uploaded documents using semantic search. The system will find relevant content even if it doesn't match your exact keywords.
        </p>
        
        <div className="flex items-center p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-md text-sm">
          <Database size={16} className="mr-2 flex-shrink-0" />
          <span>
            Results are retrieved from the vector database using semantic similarity to your query.
          </span>
        </div>
      </div>
      
      <SearchInterface />
    </div>
  );
};

export default SearchPage;