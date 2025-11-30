import React, { useCallback } from 'react';
import { Heading1, Heading2, Heading3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onValueChange: (newValue: string) => void;
  className?: string;
}

const MarkdownToolbar = ({ textareaRef, onValueChange, className }: MarkdownToolbarProps) => {
  const applyHeading = useCallback((level: 1 | 2 | 3) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    if (start === null || end === null) return;

    const prefix = '#'.repeat(level) + ' ';
    
    // Seçilen metni al
    const selectedText = currentValue.substring(start, end);

    // Eğer metin seçilmemişse, sadece imlecin olduğu yere başlık formatını ekle
    if (start === end) {
      const newValue = currentValue.substring(0, start) + prefix + currentValue.substring(end);
      onValueChange(newValue);
      
      // İmleci başlık metninin sonuna taşı
      setTimeout(() => {
        textarea.selectionStart = start + prefix.length;
        textarea.selectionEnd = start + prefix.length;
      }, 0);
      return;
    }

    // Seçilen metni sarmala
    const newSelectedText = prefix + selectedText;

    const newValue = currentValue.substring(0, start) + newSelectedText + currentValue.substring(end);
    onValueChange(newValue);

    // Seçimi koru
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + newSelectedText.length;
    }, 0);

  }, [textareaRef, onValueChange]);

  return (
    <div className={cn("flex gap-1 p-1 border-b border-border bg-muted rounded-t-md", className)}>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={() => applyHeading(1)}
        title="Başlık 1 (H1)"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={() => applyHeading(2)}
        title="Başlık 2 (H2)"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={() => applyHeading(3)}
        title="Başlık 3 (H3)"
      >
        <Heading3 className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MarkdownToolbar;