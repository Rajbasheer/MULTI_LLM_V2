import React, { useState } from 'react';
import { Save, RefreshCw, Moon, Sun, ArrowRight, Key, HelpCircle, User, Shield } from 'lucide-react';

export default function SettingsPage() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [apiKeys, setApiKeys] = useState({
    openai: '',
    anthropic: '',
    google: '',
  });
  const [defaultModel, setDefaultModel] = useState('gpt-4');
  const [showApiKeyWarning, setShowApiKeyWarning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // General settings options
  const [settings, setSettings] = useState({
    autoSaveConversations: true,
    showModelInfo: true,
    enableMath: true,
    enableFilesUpload: true,
    maxResponseTokens: 1000,
    maxConversationLength: 100,
  });
  
  // Handle settings change
  const handleSettingChange = (setting: string, value: boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };
  
  // Handle API key change
  const handleApiKeyChange = (provider: string, value: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: value
    }));
    
    // Show warning if key is empty or invalid
    if (value.length > 0 && value.length < 10) {
      setShowApiKeyWarning(true);
    } else {
      setShowApiKeyWarning(false);
    }
  };
  
  // Handle save settings
  const handleSaveSettings = () => {
    setIsSaving(true);
    
    // Simulate API call to save settings
    setTimeout(() => {
      setIsSaving(false);
      // Here you would save to localStorage or backend
    }, 1000);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Configure your LLM platform experience
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Settings navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <nav>
            <ul className="space-y-1">
              <li>
                <a 
                  href="#general" 
                  className="flex items-center px-3 py-2 text-gray-700 dark:text-white rounded-md bg-purple-100 dark:bg-purple-900/30 font-medium"
                >
                  <User size={18} className="mr-2" />
                  General Settings
                </a>
              </li>
              <li>
                <a 
                  href="#api-keys" 
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Key size={18} className="mr-2" />
                  API Keys
                </a>
              </li>
              <li>
                <a 
                  href="#appearance" 
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Sun size={18} className="mr-2" />
                  Appearance
                </a>
              </li>
              <li>
                <a 
                  href="#privacy" 
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <Shield size={18} className="mr-2" />
                  Privacy & Security
                </a>
              </li>
              <li>
                <a 
                  href="#help" 
                  className="flex items-center px-3 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                >
                  <HelpCircle size={18} className="mr-2" />
                  Help & Support
                </a>
              </li>
            </ul>
          </nav>
        </div>
        
        {/* Settings content */}
        <div className="md:col-span-2 space-y-6">
          {/* General Settings */}
          <div id="general" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <User size={20} className="mr-2" />
                General Settings
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default AI Model
                </label>
                <select
                  value={defaultModel}
                  onChange={(e) => setDefaultModel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="gpt-4">GPT-4 (OpenAI)</option>
                  <option value="claude-3-opus">Claude 3 Opus (Anthropic)</option>
                  <option value="claude-3-sonnet">Claude 3 Sonnet (Anthropic)</option>
                  <option value="gemini-pro">Gemini Pro (Google)</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Auto-save conversations
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.autoSaveConversations} 
                      onChange={(e) => handleSettingChange('autoSaveConversations', e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Show model information
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.showModelInfo} 
                      onChange={(e) => handleSettingChange('showModelInfo', e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Enable file uploads
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.enableFilesUpload} 
                      onChange={(e) => handleSettingChange('enableFilesUpload', e.target.checked)} 
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum response tokens ({settings.maxResponseTokens})
                </label>
                <input
                  type="range"
                  min="100"
                  max="4000"
                  step="100"
                  value={settings.maxResponseTokens}
                  onChange={(e) => handleSettingChange('maxResponseTokens', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>100</span>
                  <span>4000</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* API Keys Settings */}
          <div id="api-keys" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <Key size={20} className="mr-2" />
                API Keys
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Add your API keys to use different AI providers. Your keys are stored securely and never shared.
              </p>
              
              {showApiKeyWarning && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <HelpCircle className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700 dark:text-yellow-200">
                        The API key you entered may be invalid. Please check and try again.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.openai}
                  onChange={(e) => handleApiKeyChange('openai', e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Anthropic API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.anthropic}
                  onChange={(e) => handleApiKeyChange('anthropic', e.target.value)}
                  placeholder="sk_ant-..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Google AI API Key
                </label>
                <input
                  type="password"
                  value={apiKeys.google}
                  onChange={(e) => handleApiKeyChange('google', e.target.value)}
                  placeholder="AIza..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div id="appearance" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <Sun size={20} className="mr-2" />
                Appearance
              </h2>
            </div>
            
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-md font-medium text-gray-800 dark:text-white">Dark Mode</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Toggle between light and dark themes
                  </p>
                </div>
                <button
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`p-2 rounded-full ${
                    isDarkMode 
                      ? 'bg-gray-800 text-yellow-300' 
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
              </div>
            </div>
          </div>
          
          {/* Privacy & Security Settings */}
          <div id="privacy" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <Shield size={20} className="mr-2" />
                Privacy & Security
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Data Collection</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Allow anonymous usage data collection to improve the platform
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={true} 
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
                  Clear All Local Data
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This will delete all saved conversations, settings, and cached data from your browser.
                </p>
              </div>
            </div>
          </div>
          
          {/* Help & Support */}
          <div id="help" className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                <HelpCircle size={20} className="mr-2" />
                Help & Support
              </h2>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Documentation</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Visit our documentation for detailed guides and tutorials on how to use the platform.
                </p>
                <a 
                  href="#" 
                  className="inline-flex items-center mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  View Documentation <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Contact Support</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Need help? Our support team is ready to assist you.
                </p>
                <a 
                  href="mailto:support@llmplatform.com" 
                  className="inline-flex items-center mt-2 text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Email Support <ArrowRight size={16} className="ml-1" />
                </a>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">About</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  LLM Platform v1.0.0
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  © 2023 LLM Platform Team
                </p>
              </div>
            </div>
          </div>
          
          {/* Save button */}
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSaving ? (
                <>
                  <RefreshCw size={18} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={18} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}