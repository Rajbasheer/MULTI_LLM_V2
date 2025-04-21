import React, { useState } from 'react';
import { Code, Copy, Check, Download, Upload, RefreshCw } from 'lucide-react';

export default function CodePage() {
  const [prompt, setPrompt] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [language, setLanguage] = useState('javascript');
  const [copied, setCopied] = useState(false);
  
  // Programming language options
  const languageOptions = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'csharp', label: 'C#' },
    { value: 'cpp', label: 'C++' },
    { value: 'php', label: 'PHP' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'swift', label: 'Swift' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'sql', label: 'SQL' },
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
  ];
  
  // Handle code generation
  const handleGenerateCode = () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate API call with timeout
    setTimeout(() => {
      let sampleCode = '';
      
      // Generate different sample code based on selected language
      if (language === 'javascript') {
        sampleCode = `// Generated JavaScript code based on: "${prompt}"
function processData(data) {
  // Validate input
  if (!data || !Array.isArray(data)) {
    throw new Error('Invalid input: data must be an array');
  }
  
  // Process the data
  const results = data.map(item => {
    return {
      id: item.id,
      value: item.value * 2,
      processed: true
    };
  });
  
  return results.filter(item => item.value > 10);
}

// Example usage
const exampleData = [
  { id: 1, value: 5 },
  { id: 2, value: 8 },
  { id: 3, value: 12 }
];

console.log(processData(exampleData));`;
      } else if (language === 'python') {
        sampleCode = `# Generated Python code based on: "${prompt}"
def process_data(data):
    """
    Process the input data by doubling values and filtering results.
    
    Args:
        data (list): A list of dictionaries containing id and value
        
    Returns:
        list: Processed and filtered data
    """
    # Validate input
    if not isinstance(data, list):
        raise ValueError("Invalid input: data must be a list")
    
    # Process the data
    results = []
    for item in data:
        processed_item = {
            'id': item['id'],
            'value': item['value'] * 2,
            'processed': True
        }
        results.append(processed_item)
    
    # Filter results
    return [item for item in results if item['value'] > 10]

# Example usage
example_data = [
    {'id': 1, 'value': 5},
    {'id': 2, 'value': 8},
    {'id': 3, 'value': 12}
]

print(process_data(example_data))`;
      } else {
        sampleCode = `// Generated code for ${language} based on: "${prompt}"\n// This is a sample implementation\n\n// Add your implementation here`;
      }
      
      setGeneratedCode(sampleCode);
      setIsGenerating(false);
    }, 2000);
  };
  
  // Handle copy to clipboard
  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle download
  const handleDownload = () => {
    const extension = language === 'javascript' ? 'js' : 
                     language === 'python' ? 'py' : 
                     language === 'typescript' ? 'ts' : language;
                     
    const fileName = `generated-code.${extension}`;
    const blob = new Blob([generatedCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Code Generation</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-1">
          Generate code snippets and solutions
        </p>
      </div>
      
      {/* Code generation form */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
        <div className="mb-4">
          <label 
            htmlFor="language-select" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Language
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            {languageOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="mb-4">
          <label 
            htmlFor="prompt-textarea" 
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Describe what code you need
          </label>
          <textarea
            id="prompt-textarea"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="E.g., Create a function to process an array of data objects..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
        
        <div className="flex items-center justify-end">
          <button
            onClick={handleGenerateCode}
            disabled={isGenerating || !prompt.trim()}
            className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isGenerating ? (
              <>
                <RefreshCw size={18} className="mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Code size={18} className="mr-2" />
                Generate Code
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Generated code display */}
      {generatedCode && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
              <Code size={20} className="mr-2" />
              Generated Code
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyCode}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-md"
                title="Copy code"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400 rounded-md"
                title="Download code"
              >
                <Download size={18} />
              </button>
            </div>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 overflow-x-auto">
            <pre className="text-sm text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
              <code>{generatedCode}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}