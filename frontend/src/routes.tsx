import React from 'react';
import { Route, Routes } from 'react-router-dom';

// Import all pages
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';
import SearchPage from './pages/SearchPage';
import CodePage from './pages/CodePage';
import SettingsPage from './pages/SettingsPage';

/**
 * Main application routes configuration
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<ChatPage />} />
      <Route path="/chat/:conversationId?" element={<ChatPage />} />
      <Route path="/files" element={<FilesPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/code" element={<CodePage />} />
      <Route path="/settings" element={<SettingsPage />} />
    </Routes>
  );
}

/**
 * Navigation items configuration
 */
export const navigationItems = [
  { 
    path: '/chat', 
    label: 'Chat', 
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
  },
  { 
    path: '/files', 
    label: 'Files', 
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
  },
  { 
    path: '/search', 
    label: 'Search', 
    icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
  },
  { 
    path: '/code', 
    label: 'Code Generation', 
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4'
  },
  { 
    path: '/settings', 
    label: 'Settings', 
    icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
  },
];