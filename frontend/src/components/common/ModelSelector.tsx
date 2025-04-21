// src/components/common/ModelSelector.tsx
import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useModel } from '../../contexts/ModelContext';

const ModelSelector: React.FC = () => {
  const { models, selectedModel, selectModel } = useModel();
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  const handleModelSelect = (model: any) => {
    selectModel(model);
    closeDropdown();
  };

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none"
      >
        {selectedModel ? (
          <span>{selectedModel.provider}: {selectedModel.model}</span>
        ) : (
          <span>Select Model</span>
        )}
        <ChevronDown size={16} className="ml-2" />
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-10"
            onClick={closeDropdown}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-md shadow-lg z-20 border dark:border-gray-700">
            <div className="py-1">
              {models.map((model, index) => (
                <button
                  key={`${model.provider}-${model.model}-${index}`}
                  onClick={() => handleModelSelect(model)}
                  className={`
                    w-full text-left px-4 py-2 text-sm
                    ${selectedModel?.model === model.model && selectedModel?.provider === model.provider
                      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <div className="font-medium">{model.provider}: {model.model}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {model.capabilities.join(', ')}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSelector;