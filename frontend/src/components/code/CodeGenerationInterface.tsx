// src/components/code/CodeGenerationInterface.tsx
import React, { useState } from 'react';
import { Code as CodeIcon, Play, Download, Copy, Check } from 'lucide-react';
import { generateCode } from '../../services/codeService';
import Button from '../common/Button';
import { toast } from 'react-hot-toast';
import { useModel } from '../../contexts/ModelContext';
import Editor from '@monaco-editor/react';

const CodeGenerationInterface: React.FC = () => {
  const { selectedModel } = useModel();
  const [instructions, setInstructions] = useState('');
  const [language, setLanguage] = useState('python');
  const [existingCode, setExistingCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useRag, setUseRag] = useState(true);
  
  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'cpp', label: 'C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'kotlin', label: 'Kotlin' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
  ];
  
  const handleGenerateCode = async () => {
    if (!instructions.trim() || loading) return;
    
    setLoading(true);
    
    try {
      const response = await generateCode(instructions, {
        language,
        existing_code: existingCode || undefined,
        use_rag: useRag,
        model: selectedModel?.model || 'gpt-4',
      });
      
      setGeneratedCode(response.code);
      toast.success('Code generated successfully');
    } catch (err) {
      console.error('Code generation error:', err);
      toast.error('Failed to generate code');
    } finally {
      setLoading(false);
    }
  };
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    toast.success('Code copied to clipboard');
    
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  const handleDownloadCode = () => {
    const element = document.createElement('a');
    const file = new Blob([generatedCode], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `generated_code.${language}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
          Code Generation
        </h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Instructions
            </label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Describe the code you want to generate..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <div className="w-full sm:w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {languages.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={useRag}
                  onChange={(e) => setUseRag(e.target.checked)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                  Use document knowledge (RAG)
                </span>
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Existing Code (Optional)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
              <Editor
                height="200px"
                language={language}
                value={existingCode}
                onChange={(value) => setExistingCode(value || '')}
                theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
                options={{
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  wordWrap: 'on'
                }}
              />
            </div>
          </div>
          
          <div className="pt-2">
            <Button
              onClick={handleGenerateCode}
              isLoading={loading}
              leftIcon={<CodeIcon size={16} />}
            >
              Generate Code
            </Button>
          </div>
        </div>
      </div>
      
      {generatedCode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Generated Code
            </h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyCode}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Copy code"
              >
                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
              </button>
              <button
                onClick={handleDownloadCode}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Download code"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          
          <div className="border-gray-300 dark:border-gray-600 rounded-b-md overflow-hidden">
            <Editor
              height="400px"
              language={language}
              value={generatedCode}
              theme={document.documentElement.classList.contains('dark') ? 'vs-dark' : 'light'}
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontSize: 14,
                readOnly: true,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeGenerationInterface;