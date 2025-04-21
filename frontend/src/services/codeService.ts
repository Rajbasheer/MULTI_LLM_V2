// src/services/codeService.ts
import api from './api';

export const generateCode = async (instructions: string, options = {}) => {
  const response = await api.post('/code/generate', {
    instructions,
    ...options,
  }, {
    headers: {
      'X-Model': options.model || 'openai',
    },
  });
  
  return response.data;
};

export const explainCode = async (code: string, language?: string) => {
  const response = await api.post('/code/explain', {
    code,
    language,
  });
  
  return response.data;
};