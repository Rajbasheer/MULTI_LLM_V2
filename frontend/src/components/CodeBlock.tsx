// src/components/CodeBlock.tsx
import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';

interface CodeBlockProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
}

export function CodeBlock({ code, language = 'javascript', showLineNumbers = true }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Split code into lines for line numbers
  const codeLines = code.split('\n');

  return (
    <div className="rounded-md overflow-hidden my-4 bg-gray-800 text-gray-100">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-700">
        <div className="text-sm font-mono text-gray-300">{language}</div>
        <button
          onClick={handleCopy}
          className="p-1 rounded hover:bg-gray-600 text-gray-300 transition-colors"
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
        </button>
      </div>
      
      {/* Code content */}
      <div className="p-4 overflow-x-auto font-mono text-sm">
        <pre className="whitespace-pre">
          {showLineNumbers ? (
            <table className="border-collapse">
              <tbody>
                {codeLines.map((line, i) => (
                  <tr key={i} className="leading-relaxed">
                    <td className="pr-4 text-right text-gray-500 select-none">{i + 1}</td>
                    <td>{line}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            code
          )}
        </pre>
      </div>
    </div>
  );
}