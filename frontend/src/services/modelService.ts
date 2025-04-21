// src/services/modelService.ts
import api from './api';

export const listModels = async () => {
  const response = await api.get('/models');
  return response.data;
};

export const setApiKey = async (provider: string, apiKey: string) => {
  const response = await api.post('/models/key', {
    provider,
    api_key: apiKey,
  });
  
  return response.data;
};