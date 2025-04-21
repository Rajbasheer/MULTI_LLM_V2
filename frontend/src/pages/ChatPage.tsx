// src/pages/ChatPage.tsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Plus } from 'lucide-react';
import ChatInterface from '../components/chat/ChatInterface';
import Button from '../components/common/Button';
import { getConversation, listConversations } from '../services/chatService';
import { toast } from 'react-hot-toast';

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchConversations();
  }, []);
  
  useEffect(() => {
    if (conversationId) {
      fetchConversation(conversationId);
    } else {
      setActiveConversation(null);
    }
  }, [conversationId]);
  
  const fetchConversations = async () => {
    try {
      const data = await listConversations();
      setConversations(data.conversations);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      toast.error('Failed to load conversations');
    }
  };
  
  const fetchConversation = async (id: string) => {
    try {
      setLoading(true);
      const data = await getConversation(id);
      setActiveConversation(data);
    } catch (err) {
      console.error('Error fetching conversation:', err);
      toast.error('Failed to load conversation');
    } finally {
      setLoading(false);
    }
  };
  
  const startNewChat = () => {
    window.location.href = '/chat';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Sidebar */}
      <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        <div className="p-4 border-b dark:border-gray-700">
          <Button
            onClick={startNewChat}
            className="w-full"
            leftIcon={<Plus size={16} />}
          >
            New Chat
          </Button>
        </div>
        
        <div className="p-2 max-h-[calc(100vh-12rem)] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center p-4 text-gray-500 dark:text-gray-400">
              No conversations yet
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conversation) => (
                <a
                  key={conversation.id}
                  href={`/chat/${conversation.id}`}
                  className={`
                    block px-3 py-2 rounded-md text-sm font-medium transition-colors
                    ${conversation.id === conversationId
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <MessageSquare size={16} className="mr-2 flex-shrink-0" />
                    <span className="truncate">{conversation.title}</span>
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Main chat area */}
      <div className="lg:col-span-3 h-[calc(100vh-8rem)]">
        <ChatInterface
          conversationId={conversationId}
          initialMessages={activeConversation?.messages?.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            isUser: msg.is_user,
            modelName: msg.model_name,
            timestamp: new Date(msg.created_at)
          })) || []}
        />
      </div>
    </div>
  );
};

export default ChatPage;