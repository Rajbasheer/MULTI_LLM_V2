// src/services/fileService.ts
import api from './api';

export const uploadFile = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/files/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};

export const listFiles = async (skip = 0, limit = 100) => {
  const response = await api.get('/files', {
    params: { skip, limit },
  });
  
  return response.data;
};

export const getFile = async (fileId: string) => {
  const response = await api.get(`/files/${fileId}`);
  return response.data;
};

export const deleteFile = async (fileId: string) => {
  const response = await api.delete(`/files/${fileId}`);
  return response.data;
};