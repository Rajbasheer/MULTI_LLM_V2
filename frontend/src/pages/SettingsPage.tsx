// src/pages/SettingsPage.tsx
import React, { useState, useEffect } from 'react';
import { Settings, Key, Moon, Sun } from 'lucide-react';
import { listModels, setApiKey } from '../services/modelService';
import Button from '../components/common/Button';
import { toast } from 'react-hot-toast';
import { useTheme } from '../contexts/ThemeContext';

interface ApiKey {
  provider: string;
  key: string;
}

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    { provider: 'openai', key: '' },
    { provider: 'claude', key: '' },
    { provider: 'gemini', key: '' }
  ]);
  const [models, setModels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    fetchModels();
  }, []);
  
  const fetchModels = async () => {
    try {
      const data = await listModels();
      setModels(data.models);
    } catch (err) {
      console.error('Error fetching models:', err);
    }
  };
  
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => 
      prev.map(k => 
        k.provider === provider ? { ...k, key: value } : k
      )
    );
  };
  
  const handleSaveApiKey = async (provider: string) => {
    const apiKey = apiKeys.find(k => k.provider === provider);
    if (!apiKey || !apiKey.key.trim()) {
      toast.error('Please enter a valid API key');
      return;
    }
    
    setLoading(true);
    
    try {
      await setApiKey(provider, apiKey.key);
      toast.success(`${provider.charAt(0).toUpperCase() + provider.slice(1)} API key saved successfully`);
      
      // Reset field
      handleApiKeyChange(provider, '');
      
      // Refresh models to update has_api_key status
      await fetchModels();
    } catch (err) {
      console.error('Error saving API key:', err);
      toast.error('Failed to save API key');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4 flex items-center">
          <Settings size={20} className="mr-2" />
          Application Settings
        </h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">
              Theme
            </h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleTheme}
                className={`
                  px-4 py-2 rounded-md flex items-center
                  ${theme === 'light' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <Sun size={16} className="mr-2" />
                Light
              </button>
              <button
                onClick={toggleTheme}
                className={`
                  px-4 py-2 rounded-md flex items-center
                  ${theme === 'dark' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' 
                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                  }
                `}
              >
                <Moon size={16} className="mr-2" />
                Dark
              </button>
            </div>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2 flex items-center">
              <Key size={16} className="mr-2" />
              API Keys
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Set your API keys for various LLM providers. Your keys are securely stored and used to authenticate API requests.
            </p>
            
            <div className="space-y-4">
              {apiKeys.map((apiKey) => (
                <div key={apiKey.provider} className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                  <div className="flex-1">
                    <label htmlFor={`${apiKey.provider}-key`} className="sr-only">
                      {apiKey.provider} API Key
                    </label>
                    <div className="relative">
                      <input
                        id={`${apiKey.provider}-key`}
                        type="password"
                        value={apiKey.key}
                        onChange={(e) => handleApiKeyChange(apiKey.provider, e.target.value)}
                        placeholder={`${apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)} API Key`}
                        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => handleSaveApiKey(apiKey.provider)}
                    disabled={!apiKey.key.trim() || loading}
                    isLoading={loading}
                    size="sm"
                  >
                    Save
                  </Button>
                  
                  {models.find(m => m.provider.toLowerCase() === apiKey.provider && m.has_api_key) && (
                    <div className="text-xs text-green-600 dark:text-green-400">
                      ✓ Active
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Available Models
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Provider
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Capabilities
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {models.map((model, index) => (
                <tr key={`${model.provider}-${model.model}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {model.provider}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {model.model}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {model.capabilities.join(', ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {model.has_api_key ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                        Available
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100">
                        API Key Required
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;