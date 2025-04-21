import React, { useRef, useEffect } from 'react';
import { Share } from 'lucide-react';
import { Message } from './Message';

interface Model {
  name: string;
  id: string;
}

interface ModelProvider {
  [key: string]: Model;
}

interface ModelsData {
  [provider: string]: ModelProvider;
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface ChatWindowProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  messages: Array<{ 
    id: string; 
    content: string; 
    isUser: boolean; 
    modelName?: string; 
    attachments?: FileAttachment[];
  }>;
  hasInteraction: boolean;
  isLoading: boolean;
  models: ModelsData;
  onDeleteMessage: (messageId: string) => void;
  isDarkMode: boolean;
}

export function ChatWindow({ 
  selectedModel, 
  setSelectedModel, 
  messages, 
  hasInteraction,
  isLoading,
  models,
  onDeleteMessage,
  isDarkMode
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleExport = () => {
    const chatContent = messages.map(msg => {
      let content = `${msg.isUser ? 'User' : msg.modelName || 'AI'}: ${msg.content}`;
      
      // Add file attachments info if any
      if (msg.attachments && msg.attachments.length > 0) {
        content += `\nAttachments: ${msg.attachments.map(a => a.name).join(', ')}`;
      }
      
      return content;
    }).join('\n\n');

    const blob = new Blob([chatContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-export-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`flex flex-col h-full rounded-lg overflow-hidden ${isDarkMode ? 'bg-[#343541]' : 'bg-white'} border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'}`}>
      {/* Header - Fixed at top */}
      <div className={`sticky top-0 z-10 border-b ${isDarkMode ? 'border-gray-600/50' : 'border-gray-200'} p-4 flex items-center justify-between ${isDarkMode ? 'bg-[#343541]' : 'bg-white'}`}>
        <div className="flex items-center gap-3">
          <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Select Model</span>
          <select 
            className={`px-4 py-2 ${isDarkMode ? 'bg-[#40414f] text-gray-200' : 'bg-white text-gray-700'} border ${isDarkMode ? 'border-gray-600/50' : 'border-gray-300'} rounded-md text-sm font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200`}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="" disabled>Choose an AI model</option>
            {Object.entries(models).map(([provider, providerModels]) => (
              <optgroup key={provider} label={provider.toUpperCase()}>
                {Object.entries(providerModels as Record<string, Model>).map(([key, model]) => (
                  <option key={key} value={key}>{model.name}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        <button 
          onClick={handleExport}
          className={`p-2 ${isDarkMode ? 'text-gray-300 hover:bg-[#40414f]' : 'text-gray-600 hover:bg-gray-100'} rounded-md transition-colors duration-200 flex items-center gap-2`}
          title="Export chat"
        >
          <Share size={16} />
          <span className="text-sm">Export</span>
        </button>
      </div>

      {/* Chat area - Scrollable */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
        style={{ height: 'calc(100% - 144px)' }} // Adjust this value based on your header height
      >
        {!hasInteraction || messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h1 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Select a model</h1>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>Choose an AI model to start chatting</p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <Message 
                key={msg.id}
                id={msg.id}
                content={msg.content}
                isUser={msg.isUser}
                modelName={msg.modelName}
                isDarkMode={isDarkMode}
                onDelete={onDeleteMessage}
                attachments={msg.attachments}
              />
            ))}
            {isLoading && (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>
    </div>
  );
}