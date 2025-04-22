import React, { KeyboardEvent, useState } from 'react';
import { Plus, Globe2, Sparkles } from 'lucide-react';
import { FileUpload } from './FileUpload';

interface MessageInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: (message: string, fileContents?: string[]) => void;
  disabled: boolean;
  isDarkMode: boolean;
}

export function MessageInput({ message, setMessage, onSendMessage, disabled, isDarkMode }: MessageInputProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleKeyPress = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && message.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const readFilesAsText = (files: File[]): Promise<string[]> => {
    return Promise.all(files.map(file => {
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }));
  };

  const sendMessage = async () => {
    if (!message.trim() && selectedFiles.length === 0) return;

    try {
      const fileContents = selectedFiles.length > 0 
        ? await readFilesAsText(selectedFiles)
        : undefined;

      onSendMessage(message, fileContents);
      setMessage('');
      setSelectedFiles([]);
    } catch (err) {
      console.error('Error reading files:', err);
      alert('Failed to read file(s).');
    }
  };

  return (
    <div className={`sticky bottom-0 z-10 border-t ${isDarkMode ? 'border-gray-600/50 bg-[#343541]' : 'border-gray-200 bg-white'} p-4`}>
      <div className="max-w-3xl mx-auto relative">
        <div className="relative flex flex-col">
          <div className="flex items-center">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message the AI..."
              disabled={disabled}
              className={`w-full p-4 pr-36 rounded-lg ${
                isDarkMode 
                  ? 'bg-[#40414f] border-gray-600/50 text-gray-100 placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-800 placeholder-gray-500'
              } border focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed`}
              rows={2}
            />
            <div className="absolute right-2 flex items-center gap-2">
              <FileUpload 
                onFilesSelected={handleFilesSelected} 
                isDarkMode={isDarkMode} 
                disabled={disabled} 
              />

              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" disabled={disabled}><Plus size={16} /></button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" disabled={disabled}><Globe2 size={16} /></button>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded" disabled={disabled}><Sparkles size={16} /></button>
              <button 
                onClick={sendMessage}
                disabled={disabled || (!message.trim() && selectedFiles.length === 0)}
                className={`px-3 py-2 ${
                  isDarkMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                } rounded-md text-sm font-medium`}
              >
                Send
              </button>
            </div>
          </div>
        </div>
        <p className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-2 text-center`}>
          The AI can make mistakes. Consider checking important information.
        </p>
      </div>
    </div>
  );
}
