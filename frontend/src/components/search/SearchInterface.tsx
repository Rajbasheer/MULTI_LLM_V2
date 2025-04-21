// src/components/search/SearchInterface.tsx
import React, { useState } from 'react';
import { Search as SearchIcon, FileText, File, Code } from 'lucide-react';
import { search } from '../../services/searchService';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';

interface SearchResult {
  id: string;
  text: string;
  metadata: {
    file_name?: string;
    file_path?: string;
    file_type?: string;
    chunk_id?: number;
    [key: string]: any;
  };
  score: number;
}

const SearchInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [groupedResults, setGroupedResults] = useState<Record<string, SearchResult[]>>({});
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim() || loading) return;
    
    setLoading(true);
    
    try {
      const response = await search(query, { rerank: true });
      
      setResults(response.results);
      setGroupedResults(response.grouped_results);
      setSearched(true);
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };
  
  const getSourceIcon = (result: SearchResult) => {
    const fileType = result.metadata.file_type || '';
    
    if (fileType.includes('pdf')) {
      return <FileText size={20} className="text-red-500" />;
    } else if (fileType.includes('code') || fileType.includes('javascript') || fileType.includes('python')) {
      return <Code size={20} className="text-blue-500" />;
    } else {
      return <File size={20} className="text-gray-500" />;
    }
  };
  
  const highlightMatches = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const words = query.trim().split(/\s+/).filter(word => word.length > 2);
    if (words.length === 0) return text;
    
    let highlightedText = text;
    
    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlightedText = highlightedText.replace(
        regex, 
        '<span class="bg-yellow-200 dark:bg-yellow-800">$1</span>'
      );
    });
    
    return highlightedText;
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearch} className="flex w-full">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <SearchIcon size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your documents..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        <Button
          type="submit"
          disabled={!query.trim() || loading}
          isLoading={loading}
          className="rounded-l-none"
        >
          Search
        </Button>
      </form>
      
      {searched && results.length === 0 && !loading && (
        <div className="text-center py-10">
          <p className="text-gray-500 dark:text-gray-400">No results found for "{query}"</p>
        </div>
      )}
      
      {results.length > 0 && (
        <div className="space-y-8">
          {Object.entries(groupedResults).map(([filePath, fileResults]) => (
            <div key={filePath} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
                <div className="flex items-center">
                  {getSourceIcon(fileResults[0])}
                  <h3 className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {fileResults[0].metadata.file_name || 'Unknown file'}
                  </h3>
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
                    {fileResults.length} matching {fileResults.length === 1 ? 'segment' : 'segments'}
                  </span>
                </div>
              </div>
              
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {fileResults.map((result) => (
                  <div key={result.id} className="p-4">
                    <div className="text-sm text-gray-800 dark:text-gray-200">
                      <div 
                        dangerouslySetInnerHTML={{ 
                          __html: highlightMatches(result.text, query) 
                        }} 
                      />
                    </div>
                    
                    <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <span className="mr-2">
                        Relevance: {Math.round(result.score * 100)}%
                      </span>
                      {result.metadata.chunk_id !== undefined && (
                        <span>
                          Segment: {result.metadata.chunk_id}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchInterface;