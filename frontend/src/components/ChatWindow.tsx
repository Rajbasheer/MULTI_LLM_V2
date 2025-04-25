import React, { useEffect, useRef, memo } from "react";
import { Message } from "./Message";
import { Share } from "lucide-react";

interface ChatWindowProps {
  messages: any[];
  streamingResponses?: {[key: string]: string};
  isLoading: boolean;
  isDarkMode: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  models: Record<string, any>;
  handleExport?: () => void;
  onDeleteMessage: (id: string) => void;
  hasInteraction: boolean;
}

// Memoize the Message component to prevent unnecessary re-renders
const MemoizedMessage = memo(Message);

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  streamingResponses = {},
  isLoading,
  isDarkMode,
  selectedModel,
  setSelectedModel,
  models,
  handleExport,
  onDeleteMessage,
  hasInteraction,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const lastSavedMessageId = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);

  // Helper function to get a nicely formatted model name
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

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingResponses]);

  // CSS for custom scrollbar
  const customScrollbarStyle = {
    // Firefox scrollbar styles
    scrollbarWidth: 'thin' as 'thin',
    scrollbarColor: 'rgb(147 51 234) rgba(0, 0, 0, 0.1)',
  };

  // CSS classes for webkit scrollbar (Chrome, Safari, Edge)
  const scrollbarClass = `
    scrollbar-thin scrollbar-track-transparent scrollbar-thumb-purple-600
    [&::-webkit-scrollbar]:w-1.5
    [&::-webkit-scrollbar-track]:bg-transparent
    [&::-webkit-scrollbar-thumb]:bg-purple-600
    [&::-webkit-scrollbar-thumb]:rounded-full
  `;

  return (
    <div
      className={`flex flex-col h-full rounded-lg overflow-hidden ${
        isDarkMode ? "bg-[#343541]" : "bg-white"
      } border ${isDarkMode ? "border-gray-600/50" : "border-gray-200"}`}
    >
      <div
        className={`sticky top-0 z-10 border-b ${
          isDarkMode ? "border-gray-600/50" : "border-gray-200"
        } p-4 flex items-center justify-between ${
          isDarkMode ? "bg-[#343541]" : "bg-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <span
            className={`text-sm ${
              isDarkMode ? "text-gray-300" : "text-gray-600"
            }`}
          >
            Select Model
          </span>
          <select
            className={`px-4 py-2 ${
              isDarkMode
                ? "bg-[#40414f] text-gray-200"
                : "bg-white text-gray-700"
            } border ${
              isDarkMode ? "border-gray-600/50" : "border-gray-300"
            } rounded-md text-sm font-medium hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors duration-200`}
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            <option value="" disabled>
              Choose an AI model
            </option>
            {Object.entries(models).map(([provider, providerModels]) => (
              <optgroup key={provider} label={provider.toUpperCase()}>
                {Object.entries(
                  providerModels as Record<string, any>
                ).map(([key, model]) => (
                  <option key={key} value={key}>
                    {model.name}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
        {handleExport && (
          <button
            onClick={handleExport}
            className={`p-2 ${
              isDarkMode
                ? "text-gray-300 hover:bg-[#40414f]"
                : "text-gray-600 hover:bg-gray-100"
            } rounded-md transition-colors duration-200 flex items-center gap-2`}
            title="Export chat"
          >
            <Share size={16} />
            <span className="text-sm">Export</span>
          </button>
        )}
      </div>

      <div
        ref={scrollContainerRef}
        className={`flex-1 overflow-y-auto overflow-x-hidden ${scrollbarClass}`}
        style={{ 
          height: "calc(100% - 144px)",
          ...customScrollbarStyle
        }}
      >
        {!hasInteraction || messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <h1
                className={`text-2xl font-bold mb-4 ${
                  isDarkMode ? "text-gray-200" : "text-gray-800"
                }`}
              >
                {selectedModel ? getModelDisplayName(selectedModel) : "Select a model"}
              </h1>
              <p
                className={`${
                  isDarkMode ? "text-gray-400" : "text-gray-600"
                } text-sm`}
              >
                {selectedModel 
                  ? "Get started by typing a message below"
                  : "Choose an AI model to start chatting"
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            {messages.map((msg) => (
              <MemoizedMessage
                key={msg.id}
                id={msg.id}
                content={streamingResponses[msg.id] || msg.content}
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
};

// Memoize the entire ChatWindow component
export default memo(ChatWindow);