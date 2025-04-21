// src/components/layout/Header.tsx
import React from 'react';
import { Menu, ChevronDown } from 'lucide-react';
import { useModel } from '../../contexts/ModelContext';
import ModelSelector from '../common/ModelSelector';

interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const { selectedModel } = useModel();

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
          >
            <Menu size={24} />
          </button>
          
          <div className="ml-4 md:ml-0">
            <h2 className="text-lg font-medium text-gray-700 dark:text-gray-200">
              Multi-LLM Platform
            </h2>
          </div>
        </div>
        
        <div className="flex items-center">
          <ModelSelector />
        </div>
      </div>
    </header>
  );
};

export default Header;