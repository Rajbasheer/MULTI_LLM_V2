// src/services/searchService.ts
import api from './api';

export const search = async (query: string, options = {}) => {
  const response = await api.post('/search', {
    query,
    ...options,
  });
  
  return response.data;
};