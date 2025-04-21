import React from 'react';
import { MessageSquare, FileText, Search, Code, Settings, ChevronLeft, PlusCircle, Trash2 } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface SidebarProps {
  isDarkMode: boolean;
  toggleSidebar: () => void;
  conversations?: Conversation[];
  currentConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: (id: string) => void;
}

export function Sidebar({ 
  isDarkMode, 
  toggleSidebar, 
  conversations = [], 
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation
}: SidebarProps) {
  const navigationItems = [
    { path: '/chat', label: 'Chat', Icon: MessageSquare },
    { path: '/files', label: 'Files', Icon: FileText },
    { path: '/search', label: 'Search', Icon: Search },
    { path: '/code', label: 'Code Generation', Icon: Code },
    { path: '/settings', label: 'Settings', Icon: Settings },
  ];
  
  const activePath = '/chat'; // Default to chat view
  
  return (
    <div className={`w-64 h-full ${isDarkMode ? 'bg-[#202123]' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} flex flex-col`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          LLM Platform
        </h1>
        <button
          onClick={toggleSidebar}
          className={`p-2 rounded-md ${
            isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
      </div>
      
      {/* New Chat Button */}
      <div className="px-4 py-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
        >
          <PlusCircle size={18} />
          <span>New Chat</span>
        </button>
      </div>
      
      {/* Chat History */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Recent Conversations
        </div>
        <div className="space-y-1 px-3">
          {conversations.length === 0 ? (
            <div className="text-center py-5 text-gray-500 dark:text-gray-400 italic text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer group ${
                  currentConversationId === conversation.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => onSelectConversation && onSelectConversation(conversation.id)}
              >
                <div className="flex items-center overflow-hidden">
                  <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                  <div className="truncate">{conversation.title}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConversation && onDeleteConversation(conversation.id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Navigation Items */}
      <div className="py-2 border-t border-gray-200 dark:border-gray-700">
        {navigationItems.map((item) => (
          <div
            key={item.path}
            className={`flex items-center px-4 py-3 cursor-pointer ${
              activePath === item.path
                ? 'bg-gray-100 dark:bg-gray-700 text-purple-600 dark:text-purple-400'
                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <item.Icon size={16} className="mr-2" />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}