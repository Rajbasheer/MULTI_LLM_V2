import React from 'react';
import { ChevronRight, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  isDarkMode: boolean;
  onToggleTheme: () => void;
  columnCount: number;
  setColumnCount: (count: number) => void;
  toggleSidebar: () => void;
  isSidebarVisible: boolean;
}

export function TopBar({ 
  isDarkMode, 
  onToggleTheme,
  columnCount, 
  setColumnCount, 
  toggleSidebar, 
  isSidebarVisible
}: TopBarProps) {
  return (
    <div className={`w-full ${isDarkMode ? 'bg-[#202123]' : 'bg-white'} border-b ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} p-4 flex items-center justify-between`}>
      <div className="flex items-center gap-4">
        {!isSidebarVisible && (
          <button
            onClick={toggleSidebar}
            className={`p-2 rounded-md ${
              isDarkMode ? 'text-gray-300 hover:bg-[#40414f]' : 'text-gray-600 hover:bg-gray-200'
            } transition-colors duration-200`}
          >
            <ChevronRight size={20} />
          </button>
        )}

        <div className="flex items-center gap-4">
          <label className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Number of LLMs:
          </label>
          <select
            value={columnCount}
            onChange={(e) => setColumnCount(Number(e.target.value))}
            className={`px-4 py-2 rounded-md ${
              isDarkMode 
                ? 'bg-[#40414f] text-gray-200 border-gray-600' 
                : 'bg-white text-gray-700 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500`}
          >
            <option value={1}>1 LLM</option>
            <option value={2}>2 LLMs</option>
            <option value={3}>3 LLMs</option>
            <option value={4}>4 LLMs</option>
          </select>
        </div>
      </div>
      
      {/* Theme Toggle Button */}
      <button
        onClick={onToggleTheme}
        className={`p-2 rounded-full ${
          isDarkMode 
            ? 'bg-gray-700 text-yellow-300 hover:bg-gray-600' 
            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        } transition-colors duration-200`}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    </div>
  );
}