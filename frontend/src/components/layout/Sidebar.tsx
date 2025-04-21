// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  MessageSquare, 
  FileText, 
  Search, 
  Code, 
  Settings, 
  X,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { theme, toggleTheme } = useTheme();

  const navLinks = [
    { to: '/chat', icon: <MessageSquare size={20} />, text: 'Chat' },
    { to: '/files', icon: <FileText size={20} />, text: 'Files' },
    { to: '/search', icon: <Search size={20} />, text: 'Search' },
    { to: '/code', icon: <Code size={20} />, text: 'Code Generation' },
    { to: '/settings', icon: <Settings size={20} />, text: 'Settings' },
  ];

  const activeClass = 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
  const inactiveClass = 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800';

  return (
    <div className={`
      fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-lg transform transition-transform duration-300
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      md:relative md:translate-x-0
    `}>
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between px-4 h-16 border-b dark:border-gray-700">
          <h1 className="text-xl font-bold text-purple-600 dark:text-purple-400">LLM Platform</h1>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 md:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors
                ${isActive ? activeClass : inactiveClass}
              `}
            >
              <span className="mr-3">{link.icon}</span>
              {link.text}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t dark:border-gray-700">
          <button
            onClick={toggleTheme}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            {theme === 'dark' ? (
              <>
                <Sun size={20} className="mr-3" />
                Light Mode
              </>
            ) : (
              <>
                <Moon size={20} className="mr-3" />
                Dark Mode
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;