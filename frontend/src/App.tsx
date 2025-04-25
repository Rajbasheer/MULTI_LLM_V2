import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import ChatWindow from './components/ChatWindow';
import { MessageInput } from './components/MessageInput';

interface AppProps {
  token?: string | null;
  onLogout?: () => void;
}

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
  conversation_id: string;
  title: string;
  messages: string;
  created_at: string;
  updated_at: string;
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
  backendId?: number;
}

function App({ token, onLogout }: AppProps) {
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
  
  // Add streaming responses state to handle parallel updates more efficiently
  const [streamingResponses, setStreamingResponses] = useState<{[key: string]: string}>({});
  
  // Chat conversation state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();

  // Track which columns have been saved
  const savedColumnsRef = useRef<{ [key: number]: boolean }>({});

  const handleNewChat = () => {
    setCurrentConversationId(`conv-${Date.now()}`);
    setMessages([]);
    setHasInteraction(false);
  };
  
  useEffect(() => {
    const fetchConversations = async () => {
      const token = localStorage.getItem("token");
      try {
        const response = await fetch("http://localhost:8000/get-chat-history", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
  
        if (!response.ok) throw new Error("Failed to fetch conversations");
  
        const data = await response.json();
        setConversations(data);
      } catch (error) {
        console.error("Failed to load conversations", error);
      }
    };
  
    fetchConversations();
  }, []);
  
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
  }, []);

  const handleModelSelect = async (modelKey: string, columnIndex: number) => {
    try {
      const newSelectedModels = [...selectedModels];
      newSelectedModels[columnIndex] = modelKey;
      setSelectedModels(newSelectedModels);
      setInputDisabled(false);
      
      // Clear only the messages for this column
      setMessages(prev => prev.filter(msg => msg.columnIndex !== columnIndex));
      
      // Fetch conversations for this model
      fetchModelConversations(modelKey);
    } catch (error) {
      console.error('Error selecting model:', error);
      alert('Error selecting model');
    }
  };

  const fetchModelConversations = async (modelKey: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/get-chat-history?model=${encodeURIComponent(modelKey)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to fetch model conversations");

      // We're not replacing all conversations, just ensuring this model's
      // conversations are included in the list
      const modelConversations = await response.json();
      
      // Update conversations if we got new ones
      if (modelConversations.length > 0) {
        setConversations(prevConversations => {
          // Create a map of existing conversation IDs for quick lookup
          const existingConvIds = new Set(prevConversations.map(c => c.conversation_id));
          
          // Add only new conversations
          const newConversations = modelConversations.filter(
            (c: Conversation) => !existingConvIds.has(c.conversation_id)
          );
          
          return [...prevConversations, ...newConversations];
        });
      }
    } catch (error) {
      console.error("Failed to load model conversations", error);
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
          headers: {
            // Include the auth token if available
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
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

  // Modified saveChatHistory to use the new nested format
  const saveChatHistory = async (columnIndex: number, conversationId: string) => {
    // If already saved for this column, skip
    if (savedColumnsRef.current[columnIndex]) return;

    // Get the model key
    const modelKey = selectedModels[columnIndex];
    if (!modelKey) {
      console.error("No model selected for this column");
      return;
    }

    // Filter messages for this column
    const columnMessages = messages
      .filter(msg => msg.columnIndex === columnIndex)
      .map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        message: msg.content  // Changed from 'content' to 'message' to match your format
      }));

    try {
      console.log(`Saving chat history for column ${columnIndex} with conversation ID: ${conversationId}`);
      
      // First, check if there's an existing conversation to update
      const checkResponse = await fetch(`http://localhost:8000/get-chat-history/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Continuation of saveChatHistory function
      let existingData = {};
      let isNewConversation = false;

      if (checkResponse.ok) {
        // Conversation exists, get existing data
        const existingConversation = await checkResponse.json();
        try {
          existingData = JSON.parse(existingConversation.messages);
        } catch (e) {
          // If messages aren't in JSON format yet, initialize as empty object
          existingData = {};
        }
      } else {
        // New conversation
        isNewConversation = true;
      }

      // Update with new messages for this model
      const updatedData = {
        ...existingData,
        [modelKey]: {
          messages: columnMessages
        }
      };

      // Extract title from first user message if available
      let title = "";
      const firstUserMessage = columnMessages.find(msg => msg.role === 'user');
      if (firstUserMessage) {
        title = firstUserMessage.message.substring(0, 30) + (firstUserMessage.message.length > 30 ? "..." : "");
      } else {
        title = `Conversation with ${getModelDisplayName(modelKey)}`;
      }

      // Save the updated conversation
      const response = await fetch('http://localhost:8000/save-chat-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          conversation_id: conversationId,
          messages: JSON.stringify(updatedData),
          title: title
        })
      });

      if (!response.ok) {
        console.error(`Failed to save chat history: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.error(errorText);
        throw new Error('Failed to save chat history');
      }

      // Mark this column as saved
      savedColumnsRef.current[columnIndex] = true;
      console.log(`Chat history saved for column ${columnIndex}`);
      
      // If this is a new conversation, refresh the conversation list
      if (isNewConversation) {
        fetchModelConversations(modelKey);
      }
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  };
  
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
  
  // Modified createNewConversation to return the new ID
  const createNewConversation = (title: string = 'New Conversation'): string => {
    const newId = `conv-${Date.now()}`;
    const newConversation: Conversation = {
      id: newId,
      conversation_id: newId,
      title,
      messages: "{}",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    setConversations(prev => [newConversation, ...prev]);
    setCurrentConversationId(newId);
    setMessages([]);
    setHasInteraction(false);
    
    return newId; // Return the new ID for immediate use
  };

  // Updated handleSendMessage function
  const handleSendMessage = async (content: string, files?: File[]) => {
    if (!content.trim() && (!files || files.length === 0)) return;

    // Get or create conversation ID
    let activeConversationId = currentConversationId;
    if (!activeConversationId) {
      console.log("No current conversation ID, creating a new one");
      activeConversationId = createNewConversation(content.substring(0, 30));
      console.log(`Created new conversation with ID: ${activeConversationId}`);
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

    // Create an array of promises for each API call
    const modelPromises = [];
    
    // Reset saved columns for this new message
    savedColumnsRef.current = {};

    // Set up user messages and prepare API calls for all active models
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
        
        // Create a function that handles the API call and streaming for this model
        const callModelApi = async () => {
          console.log(`Starting request for model ${i} at ${new Date().toISOString()}`);
          try {
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                // Include the auth token if available
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
              },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
              // If unauthorized, logout
              if (response.status === 401 && onLogout) {
                onLogout();
                throw new Error('Session expired. Please login again.');
              }
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
              
              // Update streaming responses separately for more efficient rendering
              setStreamingResponses(prev => ({
                ...prev,
                [aiMessageId]: aiResponse
              }));
            }
            
            // When streaming is complete, update the message content once
            setMessages(prev => prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: aiResponse }
                : msg
            ));
            
            // Clear from streaming state to save memory
            setStreamingResponses(prev => {
              const newState = {...prev};
              delete newState[aiMessageId];
              return newState;
            });
            
            console.log(`Completed request for model ${i} at ${new Date().toISOString()}`);
            
            // Pass the active conversation ID explicitly to ensure it's the correct one
            await saveChatHistory(i, activeConversationId);
            return;
          } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => [...prev, { 
              id: `${Date.now()}-error-${i}`,
              content: 'Network error. Please try again.', 
              isUser: false,
              timestamp: new Date(),
              columnIndex: i
            }]);
          }
        };
        
        // Add this call to our array of promises
        modelPromises.push(callModelApi());
      }
    }

    // Execute all API calls in parallel
    try {
      await Promise.all(modelPromises);
    } finally {
      setIsLoading(false);
      setMessage('');
      setHasInteraction(true);
    }
  };

  // Updated selectConversation function for the new format
  const selectConversation = async (conversationId: string) => {
    setCurrentConversationId(conversationId);
    
    try {
      const response = await fetch(`http://localhost:8000/get-chat-history/${conversationId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch conversation history');
      }
  
      const history = await response.json();
      
      try {
        // Parse the nested data structure
        const parsedMessages = JSON.parse(history.messages);
        
        // Create an array to hold all messages from all models
        let allMessages: Message[] = [];
        
        // For each model in the conversation
        Object.entries(parsedMessages).forEach(([modelKey, modelData]: [string, any], modelIndex) => {
          if (modelData.messages && Array.isArray(modelData.messages)) {
            // Check if this model is selected in a column
            const columnIndex = selectedModels.indexOf(modelKey);
            const targetColumnIndex = columnIndex >= 0 ? columnIndex : 0;
            
            // Add messages from this model to the messages array
            const modelMessages = modelData.messages.map((msg: any, msgIndex: number) => ({
              id: `${Date.now()}-${modelIndex}-${msgIndex}-${Math.random().toString(36).substr(2, 9)}`,
              content: msg.message,
              isUser: msg.role === 'user',
              timestamp: new Date(),
              modelName: getModelDisplayName(modelKey),
              columnIndex: targetColumnIndex
            }));
            
            allMessages = [...allMessages, ...modelMessages];
          }
        });

        setMessages(allMessages);
        // Set hasInteraction to true after loading messages
        setHasInteraction(true);
      } catch (e) {
        console.error('Error parsing messages:', e);
      }
      
    } catch (error) {
      console.error('Error loading conversation:', error);
      alert('Failed to load conversation. Please try again.');
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
  };

  const toggleSidebar = () => {
    setIsSidebarVisible(prev => !prev);
  };

  // Fetch chat history when token is available
  useEffect(() => {
    if (!token) return;
    
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('http://localhost:8000/get-chat-history', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch chat history');
        }

        const chatHistories = await response.json();
        setConversations(chatHistories);
      } catch (error) {
        console.error('Error fetching chat history:', error);
      }
    };

    fetchChatHistory();
  }, [token]); // Re-fetch when token changes

  // Delete a conversation
  const deleteConversation = async (conversationId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8000/delete-chat-history/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete conversation");
      
      // Remove the conversation from the list
      setConversations(prev => prev.filter(c => c.conversation_id !== conversationId));
      
      // If the deleted conversation is the current one, clear the messages
      if (currentConversationId === conversationId) {
        setCurrentConversationId(undefined);
        setMessages([]);
        setHasInteraction(false);
      }
    } catch (error) {
      console.error("Failed to delete conversation", error);
      alert("Failed to delete conversation. Please try again.");
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
    <div className={`flex h-screen ${isDarkMode ? 'bg-[#343541]' : 'bg-gray-100'}`}>
      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-full transition-transform duration-300 ease-in-out z-40
        ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          isDarkMode={isDarkMode}
          toggleSidebar={toggleSidebar}
          conversations={conversations}
          currentConversationId={currentConversationId}
          onSelectConversation={selectConversation}
          onNewChat={handleNewChat}
          onDeleteConversation={deleteConversation}
          onLogout={onLogout || (() => {})}
          setMessages={setMessages}
          setCurrentConversationId={setCurrentConversationId}
          setSelectedModel={(model) => handleModelSelect(model, 0)}
          selectedModels={selectedModels}
          columnCount={columnCount}
          models={models}
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
              streamingResponses={streamingResponses}
              hasInteraction={hasInteraction}
              isLoading={isLoading}
              models={models}
              onDeleteMessage={(messageId) => handleDeleteMessage(messageId, index)}
              isDarkMode={isDarkMode}
              handleExport={() => {}} // Add empty function for now
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
  );
}

export default App;