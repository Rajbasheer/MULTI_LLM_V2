// src/App.tsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ChatPage from './pages/ChatPage';
import FilesPage from './pages/FilesPage';
import SearchPage from './pages/SearchPage';
import CodePage from './pages/CodePage';
import SettingsPage from './pages/SettingsPage';
import { ModelProvider } from './contexts/ModelContext';
import { ThemeProvider } from './contexts/ThemeContext';

const App: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <Router>
      <ThemeProvider>
        <ModelProvider>
          <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
            <Toaster position="top-right" />
            
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            
            {/* Main Content */}
            <div className="flex flex-col flex-1 overflow-hidden">
              <Header onMenuClick={() => setSidebarOpen(true)} />
              
              <main className="flex-1 overflow-auto p-4">
                <Routes>
                  <Route path="/" element={<ChatPage />} />
                  <Route path="/chat/:conversationId?" element={<ChatPage />} />
                  <Route path="/files" element={<FilesPage />} />
                  <Route path="/search" element={<SearchPage />} />
                  <Route path="/code" element={<CodePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </main>
            </div>
          </div>
        </ModelProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;