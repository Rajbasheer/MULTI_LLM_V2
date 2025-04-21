// src/components/chat/ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Cpu } from 'lucide-react';
import { useModel } from '../../contexts/ModelContext';
import { sendMessage } from '../../services/chatService';
import ChatMessage from './ChatMessage';
import Button from '../common/Button';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  modelName?: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  conversationId?: string;
  initialMessages?: Message[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  conversationId,
  initialMessages = []
}) => {
  const { selectedModel } = useModel();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [useRag, setUseRag] = useState(true);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || isLoading || !selectedModel) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const response = await sendMessage(inputValue, {
        conversation_id: conversationId,
        use_rag: useRag,
        model: selectedModel.model
      });
      
      const aiMessage: Message = {
        id: response.message_id,
        content: response.text,
        isUser: false,
        modelName: response.model,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      
      // Update conversation ID if it was a new conversation
      if (!conversationId && response.conversation_id) {
        window.history.replaceState(
          null, 
          '', 
          `/chat/${response.conversation_id}`
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        content: 'Sorry, an error occurred while processing your request.',
        isUser: false,
        modelName: 'System',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Focus input after sending
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Cpu size={48} className="mx-auto mb-2 opacity-50" />
              <h3 className="text-lg font-medium">Start a new conversation</h3>
              <p className="text-sm">
                Ask a question or provide instructions to get started.
              </p>
            </div>
          </div>
        ) : (
          messages.map(message => (
            <ChatMessage
              key={message.id}
              message={message}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t dark:border-gray-700 p-4">
        <form onSubmit={handleSendMessage} className="space-y-2">
          <div className="flex items-center space-x-2 mb-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={useRag}
                onChange={(e) => setUseRag(e.target.checked)}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
              />
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                Use document knowledge (RAG)
              </span>
            </label>
            {selectedModel && (
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                Using: {selectedModel.provider} - {selectedModel.model}
              </div>
            )}
          </div>
          
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 min-h-[40px] max-h-32 p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white resize-none"
              rows={1}
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              isLoading={isLoading}
              rightIcon={<Send size={16} />}
            >
              Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;