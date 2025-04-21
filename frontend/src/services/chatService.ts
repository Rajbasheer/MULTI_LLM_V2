// src/services/chatService.ts
import api from './api';

export const sendMessage = async (message: string, options = {}) => {
  const response = await api.post('/chat', {
    message,
    ...options,
  }, {
    headers: {
      'X-Model': options.model || 'openai',
    },
  });
  
  return response.data;
};

export const listConversations = async (skip = 0, limit = 20) => {
  const response = await api.get('/chat/conversations', {
    params: { skip, limit },
  });
  
  return response.data;
};

export const getConversation = async (conversationId: string) => {
  const response = await api.get(`/chat/conversations/${conversationId}`);
  return response.data;
};

export const deleteConversation = async (conversationId: string) => {
  const response = await api.delete(`/chat/conversations/${conversationId}`);
  return response.data;
};