import React, { useState, useEffect } from 'react';
import { MessageSquare, ChevronLeft, PlusCircle, Trash2, User, LogOut, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: number;
  content: string;
  isUser: boolean;
  columnIndex: number;
}

interface Conversation {
  id: string;
  conversation_id: string;
  title: string;
  messages: string;
  created_at: string;
  updated_at: string;
}

interface ModelConversations {
  [modelKey: string]: Conversation[];
}

interface SidebarProps {
  isDarkMode: boolean;
  toggleSidebar: () => void;
  conversations?: Conversation[];
  currentConversationId?: string;
  onSelectConversation?: (id: string) => void;
  onNewChat?: () => void;
  onDeleteConversation?: (id: string) => void;
  onLogout: () => void;
  setMessages: (messages: Message[]) => void;
  setCurrentConversationId: (id: string) => void;
  setSelectedModel: (model: string) => void;
  selectedModels: string[];
  columnCount: number;
  models: Record<string, any>;
}

export function Sidebar({
  isDarkMode,
  toggleSidebar,
  conversations = [],
  currentConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onLogout,
  setMessages,
  setCurrentConversationId,
  setSelectedModel,
  selectedModels,
  columnCount,
  models
}: SidebarProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [groupedConversations, setGroupedConversations] = useState<ModelConversations>({});
  const navigate = useNavigate();

  // Get model display name
  const getModelDisplayName = (modelKey: string) => {
    // Find the provider and model
    const provider = Object.keys(models).find(p => 
      Object.keys(models[p]).includes(modelKey)
    );
    
    if (provider && models[provider][modelKey]) {
      return models[provider][modelKey].name;
    }
    
    // Fallback to beautifying the model key
    return modelKey
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Group conversations by model whenever conversations or selectedModels change
  useEffect(() => {
    const grouped: ModelConversations = {};
    
    // Initialize with selected models to ensure they always appear
    selectedModels.forEach(model => {
      if (model) grouped[model] = [];
    });
    
    // Sort conversations into model buckets
    conversations.forEach(conversation => {
      try {
        const messagesObj = JSON.parse(conversation.messages);
        const modelKeys = Object.keys(messagesObj);
        
        // Add conversation to each model bucket it belongs to
        modelKeys.forEach(modelKey => {
          if (!grouped[modelKey]) {
            grouped[modelKey] = [];
          }
          // Avoid duplicates
          if (!grouped[modelKey].some(conv => conv.conversation_id === conversation.conversation_id)) {
            grouped[modelKey].push(conversation);
          }
        });
      } catch (e) {
        console.error('Error parsing conversation messages:', e);
      }
    });
    
    setGroupedConversations(grouped);
  }, [conversations, selectedModels]);

  const handleSettingsClick = () => setIsSettingsOpen(!isSettingsOpen);

  const handleProfileClick = () => {
    navigate('/profile');
    setIsSettingsOpen(false);
  };

  const handleLogout = () => {
    onLogout();
    setIsSettingsOpen(false);
  };

  const handleChatSelect = async (conversationId: string, modelIndex: number = 0) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:8000/get-chat-history/${conversationId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error('Failed to fetch chat history');
      const chatData = await res.json();
      
      try {
        // Parse the messages JSON string
        const messagesObj = JSON.parse(chatData.messages);
        
        // Get the model key that matches the column
        const modelKey = selectedModels[modelIndex];
        
        if (modelKey && messagesObj[modelKey]) {
          // Format messages for this specific model
          const modelMessages = messagesObj[modelKey].messages || [];
          
          const formattedMessages = modelMessages.map((msg: any, msgIndex: number) => ({
            id: `${Date.now()}-${msgIndex}-${Math.random().toString(36).substr(2, 9)}`,
            content: msg.message,
            isUser: msg.role === 'user',
            timestamp: new Date(),
            modelName: getModelDisplayName(modelKey),
            columnIndex: modelIndex
          }));
          
          setMessages(formattedMessages);
          setCurrentConversationId(chatData.conversation_id);
          onSelectConversation?.(conversationId);
          
          // Also update the selected model if needed
          if (modelKey !== selectedModels[modelIndex]) {
            setSelectedModel(modelKey);
          }
        } else {
          console.error('No messages found for selected model in conversation');
        }
      } catch (e) {
        console.error('Error parsing conversation messages:', e);
      }
    } catch (err) {
      console.error('Error loading selected chat:', err);
    }
  };

  return (
    <div className={`w-64 h-full ${isDarkMode ? 'bg-[#202123]' : 'bg-white'} border-r ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} flex flex-col`}>
      <div className="flex items-center justify-between p-4">
        <h1 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          LLM Platform
        </h1>
        <button onClick={toggleSidebar} className={`p-2 rounded-md ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
          <ChevronLeft size={20} />
        </button>
      </div>

      <div className="px-4 py-2">
        <button onClick={onNewChat} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md">
          <PlusCircle size={18} />
          <span>New Chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        {/* Show model sections for each selected model */}
        {selectedModels.filter(Boolean).map((modelKey, modelIndex) => (
          <div key={modelKey} className="mb-4">
            <div className={`px-3 py-2 sticky top-0 z-10 ${isDarkMode ? 'bg-[#202123]' : 'bg-white'}`}>
              <div className={`text-sm font-medium ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} flex items-center`}>
                <span className="flex-1">{getModelDisplayName(modelKey)}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                  {groupedConversations[modelKey]?.length || 0}
                </span>
              </div>
            </div>
            
            <div className="space-y-1 px-3">
              {(!groupedConversations[modelKey] || groupedConversations[modelKey].length === 0) ? (
                <div className="text-center py-2 text-gray-500 dark:text-gray-400 italic text-xs">
                  No conversations yet
                </div>
              ) : (
                groupedConversations[modelKey].map((conversation) => (
                  <div
                    key={`${conversation.conversation_id}-${modelIndex}`}
                    className={`flex items-center justify-between p-2 rounded-md cursor-pointer group ${
                      currentConversationId === conversation.conversation_id
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}
                    onClick={() => handleChatSelect(conversation.conversation_id, modelIndex)}
                  >
                    <div className="flex items-center overflow-hidden">
                      <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                      <div className="truncate">{conversation.title}</div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteConversation && onDeleteConversation(conversation.conversation_id);
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
        ))}
        
        {/* Display message if no models are selected */}
        {selectedModels.filter(Boolean).length === 0 && (
          <div className="text-center py-5 text-gray-500 dark:text-gray-400 italic text-sm px-3">
            Select a model to see conversations
          </div>
        )}
      </div>

      <div className="py-2 border-t border-gray-200 dark:border-gray-700">
        {/* Settings button - Fixed to respect dark/light mode */}
        <div className="relative" onClick={handleSettingsClick}>
          <div className={`flex items-center px-4 py-3 cursor-pointer ${
            isDarkMode 
              ? (isSettingsOpen ? 'bg-gray-700 text-purple-400' : 'text-gray-300 hover:bg-gray-700')
              : (isSettingsOpen ? 'bg-gray-100 text-purple-600' : 'text-gray-600 hover:bg-gray-100')
          }`}>
            <Settings size={16} className="mr-2" />
            <span>Settings</span>
          </div>

          {isSettingsOpen && (
            <div className={`absolute bottom-full mb-2 left-0 right-0 mx-4 ${
              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            } rounded-md shadow-lg border z-50`}>
              <div onClick={handleProfileClick} 
                className={`px-4 py-2 flex items-center cursor-pointer ${
                  isDarkMode ? 'hover:bg-gray-600 text-gray-200' : 'hover:bg-gray-100 text-gray-700'
                }`}>
                <User size={16} className="mr-2" />
                User Profile
              </div>
              <div onClick={handleLogout} 
                className={`px-4 py-2 flex items-center cursor-pointer text-red-600 ${
                  isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'
                }`}>
                <LogOut size={16} className="mr-2" />
                Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}