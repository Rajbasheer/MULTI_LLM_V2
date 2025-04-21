// src/components/chat/ChatMessage.tsx
import React from 'react';
import { User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  modelName?: string;
  timestamp: Date;
}

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  return (
    <div className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`
        max-w-3xl rounded-lg overflow-hidden
        ${message.isUser 
          ? 'bg-purple-100 dark:bg-purple-900/30 text-gray-800 dark:text-gray-100' 
          : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm border dark:border-gray-600'
        }
      `}>
        <div className="flex items-start p-4">
          <div className={`
            flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mr-3
            ${message.isUser 
              ? 'bg-purple-500 text-white' 
              : 'bg-teal-500 text-white'
            }
          `}>
            {message.isUser ? <User size={16} /> : <Bot size={16} />}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center mb-1">
              <span className="font-medium">
                {message.isUser ? 'You' : message.modelName || 'AI Assistant'}
              </span>
              <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                {formatDistanceToNow(message.timestamp, { addSuffix: true })}
              </span>
            </div>
            
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return !inline && match ? (
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;