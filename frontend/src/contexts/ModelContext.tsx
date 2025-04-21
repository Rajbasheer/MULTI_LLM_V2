// src/contexts/ModelContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { listModels } from '../services/modelService';

export interface Model {
  provider: string;
  model: string;
  capabilities: string[];
  has_api_key?: boolean;
  is_available?: boolean;
}

interface ModelContextProps {
  models: Model[];
  selectedModel: Model | null;
  selectModel: (model: Model) => void;
  loading: boolean;
  error: string | null;
}

const ModelContext = createContext<ModelContextProps | undefined>(undefined);

export const ModelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        setLoading(true);
        const data = await listModels();
        setModels(data.models);
        
        // Set default model
        const defaultModel = data.models.find(m => m.provider === 'OpenAI' && m.model.includes('gpt-4')) 
          || data.models[0];
        
        if (defaultModel) {
          setSelectedModel(defaultModel);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load models');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchModels();
  }, []);

  const selectModel = (model: Model) => {
    setSelectedModel(model);
    localStorage.setItem('selectedModel', JSON.stringify(model));
  };

  return (
    <ModelContext.Provider value={{ models, selectedModel, selectModel, loading, error }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};