import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { ChatWindow } from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';

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

interface Conversation {
  id: string;
  title: string;
  timestamp: Date;
}

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  modelName?: string;
  columnIndex: number;
  attachments?: FileAttachment[];
}

interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  backendId?: number;  // Add this to track backend ID
}

function App() {
  const [message, setMessage] = useState('');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [models, setModels] = useState<ModelsData>({});
  const [inputDisabled, setInputDisabled] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [columnCount, setColumnCount] = useState(1);
  
  // Chat conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

  useEffect(() => {
    // Fetch models from the backend
    const fetchModels = async () => {
      try {
        console.log('Fetching models...');
        const response = await fetch('http://localhost:8000/models');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Models received:', data);
        
        setModels(data);
      } catch (error) {
        console.error('Error fetching models:', error);
        // Set fallback models in case of error
        setModels({
          openai: {
            "gpt-3.5-turbo": { name: "GPT-3.5 Turbo", id: "gpt-3.5-turbo" },
            "gpt-4": { name: "GPT-4", id: "gpt-4" }
          },
          claude: {
            "claude-3-opus": { name: "Claude 3 Opus", id: "claude-3-opus" },
            "claude-3-sonnet": { name: "Claude 3 Sonnet", id: "claude-3-sonnet" }
          },
          gemini: {
            "gemini-pro": { name: "Gemini Pro", id: "gemini-pro" }
          },
          openrouter: {
            "llama-3-70b": { name: "Llama 3 70B", id: "llama-3-70b" }
          }
        });
      }
    };
    
    fetchModels();
    
    // Load conversations from localStorage (keeping this as is)
    const savedConversations = localStorage.getItem('conversations');
    if (savedConversations) {
      setConversations(JSON.parse(savedConversations));
    }
  }, []);

  const handleModelSelect = async (modelKey: string, columnIndex: number) => {
    try {
      const newSelectedModels = [...selectedModels];
      newSelectedModels[columnIndex] = modelKey;
      setSelectedModels(newSelectedModels);
      setInputDisabled(false);
      setMessages(prev => prev.filter(msg => msg.columnIndex !== columnIndex));
      setHasInteraction(false);
    } catch (error) {
      console.error('Error selecting model:', error);
      alert('Error selecting model');
    }
  };

  const handleDeleteMessage = (messageId: string, columnIndex: number) => {
    setMessages(prev => prev.filter(msg => !(msg.id === messageId && msg.columnIndex === columnIndex)));
    
    // Check if this column has any remaining messages
    const remainingMessages = messages.filter(msg => msg.columnIndex === columnIndex);
    if (remainingMessages.length <= 2) { // 2 because we haven't filtered the current message yet
      setHasInteraction(false);
    }
  };

  const handleFilesUpload = async (files: File[]): Promise<FileAttachment[]> => {
    if (!files || files.length === 0) return [];
    
    const uploadedAttachments: FileAttachment[] = [];
    
    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('http://localhost:8000/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
          uploadedAttachments.push({
            id: result.file_id.toString(),
            name: result.filename,
            size: file.size,
            type: file.type,
            backendId: result.file_id // Store the backend file ID
          });
        }
      }
      
      return uploadedAttachments;
    } catch (error) {
      console.error('Error uploading files:', error);
      alert('Error uploading files. Please try again.');
      return [];
    }
  };

  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Create new conversation if none exists
    if (!currentConversationId) {
      createNewConversation(content.substring(0, 30));
    }

    let fileAttachments: FileAttachment[] | undefined;
    
    // Process file uploads if any
    if (files && files.length > 0) {
      setIsLoading(true);
      try {
        fileAttachments = await handleFilesUpload(files);
        if (fileAttachments.length === 0) {
          // Upload failed, don't proceed
          setIsLoading(false);
          return;
        }
      } catch (error) {
        console.error('Error uploading files:', error);
        alert('Error uploading files. Please try again.');
        setIsLoading(false);
        return;
      }
    }

    // Send message to all active columns
    for (let i = 0; i < columnCount; i++) {
      if (selectedModels[i]) {
        const userMessageId = `${Date.now()}-user-${i}`;
        setMessages(prev => [...prev, { 
          id: userMessageId,
          content, 
          isUser: true,
          timestamp: new Date(),
          columnIndex: i,
          attachments: fileAttachments
        }]);
        
        setIsLoading(true);
        
        try {
          const provider = Object.keys(models).find(p => 
            Object.keys(models[p]).includes(selectedModels[i])
          );
          
          // Check if message has file attachments, use chat-with-upload if so
          let endpoint = 'http://localhost:8000/chat';
          let payload;
          
          if (fileAttachments && fileAttachments.length > 0) {
            // Use the first file's backend ID - you might want to support multiple files in the future
            const fileId = fileAttachments[0].backendId;
            endpoint = 'http://localhost:8000/chat-with-upload';
            payload = {
              provider,
              model_key: selectedModels[i],
              file_id: fileId,
              user_prompt: content
            };
          } else {
            payload = {
              provider,
              model_key: selectedModels[i],
              messages: [{ role: 'user', content }]
            };
          }
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();
          let aiResponse = '';
          const aiMessageId = `${Date.now()}-ai-${i}`;
          
          // Add empty AI message to show streaming
          setMessages(prev => [...prev, { 
            id: aiMessageId,
            content: '',
            isUser: false,
            timestamp: new Date(),
            modelName: models[provider!][selectedModels[i]]?.name || 'AI',
            columnIndex: i
          }]);

          while (reader) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const chunk = decoder.decode(value);
            aiResponse += chunk;
            
            // Update the AI message content
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: aiResponse }
                : msg
            ));
          }
          
          setIsLoading(false);
        } catch (error) {
          console.error('Error sending message:', error);
          setMessages(prev => [...prev, { 
            id: `${Date.now()}-error-${i}`,
            content: 'Network error. Please try again.', 
            isUser: false,
            timestamp: new Date(),
            columnIndex: i
          }]);
          setIsLoading(false);
        }
      }
    }

    setMessage('');
    setHasInteraction(true);
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  // Create a new conversation
  const createNewConversation = (title: string = 'New Conversation') => {
    const newConversation: Conversation = {
      id: Date.now().toString(),
      title,
      timestamp: new Date()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newConversation.id);
    setMessages([]);
    setHasInteraction(false);
  };

  // Select an existing conversation
  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    // In a real app, you would load the messages for this conversation from the backend
    // For now, we'll just clear the messages
    setMessages([]);
    setHasInteraction(false);
  };
  
  // Delete a conversation
  const deleteConversation = (conversationId: string) => {
    // Remove the conversation from the list
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    
    // If the deleted conversation is the current one, clear the messages
    if (currentConversationId === conversationId) {
      setCurrentConversationId(undefined);
      setMessages([]);
      setHasInteraction(false);
    }
  };


  // Add dark mode class to the html element
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  return (
    <Router>
      <div className={`flex h-screen ${isDarkMode ? 'bg-[#343541]' : 'bg-gray-100'}`}>
        {/* Sidebar */}
        <div className={`
          fixed left-0 top-0 h-full transition-transform duration-300 ease-in-out z-40
          ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <Sidebar 
            isDarkMode={isDarkMode} 
            onToggleTheme={toggleTheme}
            toggleSidebar={toggleSidebar}
            conversations={conversations}
            currentConversationId={currentConversationId}
            onSelectConversation={selectConversation}
            onNewChat={() => createNewConversation()}
          />
        </div>

        {/* Main Content */}
        <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${
          isSidebarVisible ? 'ml-64' : 'ml-0'
        }`}>
          {/* Top Bar - Fixed */}
          <TopBar 
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
            columnCount={columnCount}
            setColumnCount={setColumnCount}
            toggleSidebar={toggleSidebar}
            isSidebarVisible={isSidebarVisible}
          />

          {/* Chat Windows Grid - Scrollable area */}
          <div className={`flex-1 grid ${
            columnCount === 1 ? 'grid-cols-1' : 
            columnCount === 2 ? 'grid-cols-2' : 
            columnCount === 3 ? 'grid-cols-3' : 
            'grid-cols-4'
          } gap-4 p-4 overflow-hidden`}>
            {Array.from({ length: columnCount }).map((_, index) => (
              <ChatWindow 
                key={index}
                selectedModel={selectedModels[index] || ''}
                setSelectedModel={(model) => handleModelSelect(model, index)}
                messages={messages.filter(msg => msg.columnIndex === index)}
                hasInteraction={hasInteraction}
                isLoading={isLoading}
                models={models}
                onDeleteMessage={(messageId) => handleDeleteMessage(messageId, index)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>

          {/* Fixed Message Input at Bottom */}
          <MessageInput 
            message={message} 
            setMessage={setMessage}
            onSendMessage={handleSendMessage}
            disabled={inputDisabled}
            isDarkMode={isDarkMode}
          />
        </div>
      </div>
    </Router>
  );
}

export default App;