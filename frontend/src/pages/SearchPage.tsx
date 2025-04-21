import React, { useState, useEffect } from 'react';
import { Search, MessageSquare, Calendar, User, Bot, ArrowRight } from 'lucide-react';

interface SearchResult {
  id: string;
  conversationTitle: string;
  matchingText: string;
  timestamp: Date;
  modelName: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState({
    modelFilter: 'all',
    dateFilter: 'all',
  });

  // Handle search
  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Example dummy results
      const dummyResults: SearchResult[] = [
        {
          id: '1',
          conversationTitle: 'Project Analysis Discussion',
          matchingText: `... I need to analyze this dataset to find patterns in user behavior. The ${searchQuery} metrics show significant changes over time ...`,
          timestamp: new Date(2023, 10, 15, 14, 32),
          modelName: 'GPT-4',
        },
        {
          id: '2',
          conversationTitle: 'Technical Documentation Help',
          matchingText: `... Let me help you understand how the ${searchQuery} feature works in this framework. It's designed to optimize performance ...`,
          timestamp: new Date(2023, 11, 2, 9, 15),
          modelName: 'Claude 3 Opus',
        },
        {
          id: '3',
          conversationTitle: 'Marketing Strategy Brainstorm',
          matchingText: `... We should incorporate ${searchQuery} into our marketing campaigns to better target our audience ...`,
          timestamp: new Date(2023, 11, 10, 16, 45),
          modelName: 'Gemini Pro',
        },
      ];
      
      setResults(dummyResults);
      setIsSearching(false);
    }, 1000);
  };
  
  // Apply filters to results
  const filteredResults = results.filter(result => {
    // Filter by model
    if (filters.modelFilter !== 'all' && result.modelName !== filters.modelFilter) {
      return false;
    }
    
    // Filter by date
    if (filters.dateFilter !== 'all') {
      const now = new Date();
      const resultDate = new Date(result.timestamp);
      
      if (filters.dateFilter === 'today') {
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return resultDate >= today;
      } else if (filters.dateFilter === 'week') {
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return resultDate >= weekAgo;
      } else if (filters.dateFilter === 'month') {
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return resultDate >= monthAgo;
      }
    }
    
    return true;
  });
  
  // Handle key press for search
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Search Conversations</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Find information across all your chats
        </p>
      </div>
      
      {/* Search input */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Search for keywords, topics, or conversations..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={24} className="text-gray-400 dark:text-gray-500" />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
            className="absolute inset-y-0 right-0 px-4 py-2 bg-purple-600 text-white rounded-r-lg hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSearching ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              'Search'
            )}
          </button>
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Model
            </label>
            <select
              value={filters.modelFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, modelFilter: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Models</option>
              <option value="GPT-4">GPT-4</option>
              <option value="Claude 3 Opus">Claude 3 Opus</option>
              <option value="Gemini Pro">Gemini Pro</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <select
              value={filters.dateFilter}
              onChange={(e) => setFilters(prev => ({ ...prev, dateFilter: e.target.value }))}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Past Week</option>
              <option value="month">Past Month</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Search results */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Results</h2>
        </div>
        
        {isSearching ? (
          <div className="py-20 text-center">
            <div className="animate-spin h-10 w-10 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Searching conversations...</p>
          </div>
        ) : searchQuery && results.length === 0 ? (
          <div className="py-20 text-center">
            <MessageSquare size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">No results found for "{searchQuery}"</p>
            <p className="text-gray-500 dark:text-gray-500 mt-2">Try different keywords or filters</p>
          </div>
        ) : filteredResults.length > 0 ? (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredResults.map(result => (
              <div key={result.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-purple-600 dark:text-purple-400">
                    {result.conversationTitle}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Calendar size={14} className="mr-1" />
                    {result.timestamp.toLocaleDateString()}
                  </div>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-3">
                  {result.matchingText}
                </p>
                <div className="flex justify-between items-center">
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Bot size={14} className="mr-1" />
                    {result.modelName}
                  </div>
                  <button className="flex items-center text-sm text-purple-600 dark:text-purple-400 hover:underline">
                    View Conversation <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : !searchQuery ? (
          <div className="py-20 text-center">
            <Search size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <p className="text-gray-600 dark:text-gray-400">Enter a search term to find conversations</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}