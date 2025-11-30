import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export default function MarkdownPreview({ content, className }: MarkdownPreviewProps) {
  return (
    <div className={cn("prose dark:prose-invert max-w-none p-4", className)}>
      <ReactMarkdown 
        remarkPlugins={[remarkGfm]}
        components={{
          // Kod blokları için özel stil ekliyoruz
          pre: ({ children, ...props }) => (
            <pre 
              {...props} 
              className="whitespace-pre-wrap break-words overflow-x-auto" // Satır kaydırmayı etkinleştir
            >
              {children}
            </pre>
          ),
          code: ({ children, ...props }) => (
            <code 
              {...props} 
              className="whitespace-pre-wrap break-words" // Satır kaydırmayı etkinleştir
            >
              {children}
            </code>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}