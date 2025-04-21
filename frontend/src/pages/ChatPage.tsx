import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlusCircle, Clock, Trash2, ExternalLink, MessageSquare } from 'lucide-react';

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
  messages: Message[];
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  modelName?: string;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

interface Model {
  id: string;
  name: string;
  provider: string;
  description: string;
}

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  
  const [message, setMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [showConversationsList, setShowConversationsList] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4');
  const [availableModels, setAvailableModels] = useState<Model[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Dummy available models for demo purposes
  const dummyModels: Model[] = [
    {
      id: 'gpt-4',
      name: 'GPT-4',
      provider: 'OpenAI',
      description: 'Advanced model with improved reasoning'
    },
    {
      id: 'claude-3-opus',
      name: 'Claude 3 Opus',
      provider: 'Anthropic',
      description: 'Most capable Claude model for complex tasks'
    },
    {
      id: 'claude-3-sonnet',
      name: 'Claude 3 Sonnet',
      provider: 'Anthropic',
      description: 'Balanced Claude model for most tasks'
    },
    {
      id: 'gemini-pro',
      name: 'Gemini Pro',
      provider: 'Google',
      description: 'Google\'s advanced language model'
    },
    {
      id: 'llama-3',
      name: 'Llama 3',
      provider: 'Meta',
      description: 'Open source large language model'
    }
  ];
  
  // Load models and conversations on component mount
  useEffect(() => {
    // In a real app, these would be API calls
    setAvailableModels(dummyModels);
    
    // Load dummy conversations
    const dummyConversations: Conversation[] = [
      {
        id: '1',
        title: 'Project Brainstorming',
        timestamp: new Date(2023, 10, 15),
        messages: [
          {
            id: '1-1',
            content: 'I need some ideas for a new web application.',
            isUser: true,
            timestamp: new Date(2023, 10, 15, 14, 30)
          },
          {
            id: '1-2',
            content: 'What kind of web application are you thinking about? Some popular options include e-commerce platforms, content management systems, social networks, productivity tools, or educational applications.',
            isUser: false,
            timestamp: new Date(2023, 10, 15, 14, 31),
            modelName: 'GPT-4'
          }
        ]
      },
      {
        id: '2',
        title: 'Code Review Help',
        timestamp: new Date(2023, 11, 2),
        messages: [
          {
            id: '2-1',
            content: 'Can you review this React code for any issues?',
            isUser: true,
            timestamp: new Date(2023, 11, 2, 9, 15)
          },
          {
            id: '2-2',
            content: 'I\'d be happy to review your React code. Please share the code you\'d like me to review.',
            isUser: false,
            timestamp: new Date(2023, 11, 2, 9, 16),
            modelName: 'Claude 3 Opus'
          }
        ]
      },
    ];
    
    setConversations(dummyConversations);
    
    // If conversationId is provided, load that conversation
    if (conversationId) {
      const conversation = dummyConversations.find(c => c.id === conversationId);
      if (conversation) {
        setCurrentConversation(conversation);
      } else {
        // If conversation not found, navigate to new chat
        navigate('/chat');
      }
    }
  }, [conversationId, navigate]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentConversation?.messages]);
  
  // Create a new conversation
  const createNewConversation = () => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title: 'New Conversation',
      timestamp: new Date(),
      messages: []
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversation(newConversation);
    navigate(`/chat/${newConversation.id}`);
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() && files.length === 0) return;
    
    // Create a copy of the current conversation or a new one if none exists
    const updatedConversation = currentConversation 
      ? { ...currentConversation }
      : {
          id: Date.now().toString(),
          title: message.substring(0, 30) + (message.length > 30 ? '...' : ''),
          timestamp: new Date(),
          messages: []
        };
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: message,
      isUser: true,
      timestamp: new Date(),
      attachments: files.length > 0 
        ? files.map(file => ({
            id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
            name: file.name,
            size: file.size,
            type: file.type
          }))
        : undefined
    };
    
    updatedConversation.messages = [...updatedConversation.messages, userMessage];
    
    // Update state
    setCurrentConversation(updatedConversation);
    setConversations(prev => {
      const conversationExists = prev.some(c => c.id === updatedConversation.id);
      return conversationExists 
        ? prev.map(c => c.id === updatedConversation.id ? updatedConversation : c)
        : [updatedConversation, ...prev];
    });
    
    // Clear input
    setMessage('');
    setFiles([]);
    
    // Set loading state
    setIsLoadingResponse(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      // Get selected model name
      const model = availableModels.find(m => m.id === selectedModel);
      const modelName = model?.name || 'AI Assistant';
      
      // Generate AI response
      const aiMessage: Message = {
        id: Date.now().toString(),
        content: generateAIResponse(message, files, modelName),
        isUser: false,
        timestamp: new Date(),
        modelName: modelName
      };
      
      // Update conversation with AI response
      const finalConversation = {
        ...updatedConversation,
        messages: [...updatedConversation.messages, aiMessage]
      };
      
      // Update state
      setCurrentConversation(finalConversation);
      setConversations(prev => 
        prev.map(c => c.id === finalConversation.id ? finalConversation : c)
      );
      
      // Update conversation title if this is the first message
      if (updatedConversation.messages.length <= 1) {
        const newTitle = message.substring(0, 30) + (message.length > 30 ? '...' : '');
        updateConversationTitle(finalConversation.id, newTitle);
      }
      
      // End loading state
      setIsLoadingResponse(false);
    }, 1500);
  };
  
  // Helper function to generate AI responses (for demo purposes)
  const generateAIResponse = (userMessage: string, userFiles: File[], modelName: string): string => {
    if (userFiles.length > 0) {
      return `I've received your message and the file${userFiles.length > 1 ? 's' : ''} you uploaded (${userFiles.map(f => f.name).join(', ')}). 

As ${modelName}, I'm here to help you with any questions or tasks related to these files. What specific information or analysis would you like me to provide?`;
    }
    
    // Simple response for demo purposes
    const responses = [
      `Thank you for your message. As ${modelName}, I'd be happy to help you with this request. Can you provide more details about what you're looking for?`,
      `I understand you're interested in "${userMessage}". This is a fascinating topic with many aspects to explore. Would you like me to elaborate on any specific part?`,
      `That's an interesting question about "${userMessage}". From my knowledge, there are several perspectives to consider. Let me share some insights...`,
      `Thanks for asking about "${userMessage}". I can provide you with comprehensive information on this subject. Let's start with the basics...`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
  };
  
  // Handle file selection
  const handleFileSelection = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      setFiles(Array.from(selectedFiles));
    }
  };
  
  // Update conversation title
  const updateConversationTitle = (id: string, newTitle: string) => {
    setConversations(prev => 
      prev.map(c => c.id === id ? { ...c, title: newTitle } : c)
    );
    
    if (currentConversation?.id === id) {
      setCurrentConversation(prev => prev ? { ...prev, title: newTitle } : null);
    }
  };
  
  // Delete conversation
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    
    if (currentConversation?.id === id) {
      setCurrentConversation(null);
      navigate('/chat');
    }
  };
  
  // Key press handler for message input
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex h-full">
      {/* Conversations sidebar (hidden on mobile unless toggled) */}
      <div className={`w-64 border-r border-gray-200 dark:border-gray-700 h-full bg-white dark:bg-gray-800 flex-shrink-0 ${
        showConversationsList ? 'block' : 'hidden md:block'
      }`}>
        <div className="p-4">
          <button
            onClick={createNewConversation}
            className="w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-md flex items-center justify-center"
          >
            <PlusCircle size={18} className="mr-2" />
            New Chat
          </button>
        </div>
        
        <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
          Recent Conversations
        </div>
        
        <div className="space-y-1 px-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 100px)' }}>
          {conversations.length === 0 ? (
            <div className="text-center py-5 text-gray-500 dark:text-gray-400 italic text-sm">
              No conversations yet
            </div>
          ) : (
            conversations.map(conversation => (
              <div
                key={conversation.id}
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${
                  currentConversation?.id === conversation.id
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
                onClick={() => navigate(`/chat/${conversation.id}`)}
              >
                <div className="flex items-center overflow-hidden">
                  <MessageSquare size={16} className="flex-shrink-0 mr-2" />
                  <div className="truncate">{conversation.title}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="p-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Chat header */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                className="md:hidden mr-2 p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => setShowConversationsList(!showConversationsList)}
              >
                <MessageSquare size={20} />
              </button>
              
              <h1 className="text-lg font-semibold text-gray-800 dark:text-white truncate">
                {currentConversation?.title || 'New Chat'}
              </h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {availableModels.map(model => (
                  <option key={model.id} value={model.id}>{model.name}</option>
                ))}
              </select>
              
              <button
                onClick={createNewConversation}
                className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                title="New chat"
              >
                <PlusCircle size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentConversation || currentConversation.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="p-6 max-w-sm mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md flex flex-col items-center space-y-4">
                <MessageSquare size={48} className="text-purple-500" />
                <div className="text-xl font-medium text-gray-900 dark:text-white">Start a new conversation</div>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  Select a model and start typing to begin chatting with an AI assistant.
                </p>
              </div>
            </div>
          ) : (
            <>
              {currentConversation.messages.map((msg) => (
                <div 
                  key={msg.id} 
                  className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-3/4 p-4 rounded-lg ${
                      msg.isUser 
                        ? 'bg-purple-600 text-white' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    {msg.modelName && !msg.isUser && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {msg.modelName}
                      </div>
                    )}
                    
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                    </div>
                    
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-medium mb-2">
                          Attachments ({msg.attachments.length})
                        </div>
                        <div className="space-y-2">
                          {msg.attachments.map((file) => (
                            <div key={file.id} className="flex items-center text-xs">
                              {file.type.includes('image') ? (
                                <div className="w-8 h-8 mr-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                  <span className="text-xs">IMG</span>
                                </div>
                              ) : (
                                <div className="w-8 h-8 mr-2 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                                  <span className="text-xs">FILE</span>
                                </div>
                              )}
                              <div className="overflow-hidden">
                                <div className="truncate">{file.name}</div>
                                <div className="text-xs opacity-70">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-1 text-xs opacity-70 flex justify-between">
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoadingResponse && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex space-x-2">
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
        
        {/* Message input area */}
        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          {files.length > 0 && (
            <div className="mb-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-md">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected files ({files.length})
              </div>
              <div className="flex flex-wrap gap-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center text-xs bg-white dark:bg-gray-800 p-1 rounded">
                    <span className="truncate max-w-[150px]">{file.name}</span>
                    <button
                      onClick={() => setFiles(files.filter((_, i) => i !== index))}
                      className="ml-1 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-end space-x-2">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={3}
              />
              
              <div className="absolute bottom-2 right-2 flex space-x-1">
                <label className="p-1 text-gray-500 hover:text-purple-500 dark:text-gray-400 dark:hover:text-purple-400 cursor-pointer">
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileSelection(e.target.files)}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </label>
              </div>
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={isLoadingResponse || (!message.trim() && files.length === 0)}
              className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg"
            >
              Send
            </button>
          </div>
          
          <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
            AI assistants can make mistakes. Consider checking important information.
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Helper function to format time
function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}