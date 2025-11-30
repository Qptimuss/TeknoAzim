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
        // Tailwind Typography eklentisi sayesinde başlıklar, listeler ve diğer öğeler otomatik olarak stil kazanacaktır.
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}