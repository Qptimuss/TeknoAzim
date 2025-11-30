import React, { useCallback } from 'react';
import { Heading1, Heading2, Heading3, Bold, Italic, List, ListOrdered } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner'; // toast import edildi

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onValueChange: (newValue: string) => void;
  className?: string;
}

const MarkdownToolbar = ({ textareaRef, onValueChange, className }: MarkdownToolbarProps) => {
  const applyFormatting = useCallback((prefix: string, suffix: string = '', placeholder: string = '', requireSelection: boolean = false) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    if (start === null || end === null) return;

    const selectedText = currentValue.substring(start, end);
    let newSelectedText = selectedText;

    if (start === end) {
      if (requireSelection) {
        toast.info("Lütfen önce biçimlendirmek istediğiniz metni seçin.");
        return;
      }
      // Metin seçilmemişse, placeholder kullan
      newSelectedText = prefix + placeholder + suffix;
    } else {
      // Metin seçilmişse, sarmala
      newSelectedText = prefix + selectedText + suffix;
    }

    const newValue = currentValue.substring(0, start) + newSelectedText + currentValue.substring(end);
    onValueChange(newValue);

    // İmleci veya seçimi ayarla
    setTimeout(() => {
      if (start === end) {
        // İmleci placeholder'ın sonuna taşı
        textarea.selectionStart = start + prefix.length + placeholder.length;
        textarea.selectionEnd = start + prefix.length + placeholder.length;
      } else {
        // Seçimi koru
        textarea.selectionStart = start;
        textarea.selectionEnd = start + newSelectedText.length;
      }
      textarea.focus();
    }, 0);

  }, [textareaRef, onValueChange]);

  // Başlıklar ve Listeler için seçim zorunlu değil (requireSelection: false)
  const applyHeading = useCallback((level: 1 | 2 | 3) => {
    applyFormatting('#'.repeat(level) + ' ', '', 'Başlık Metni', false);
  }, [applyFormatting]);

  const applyBold = useCallback(() => {
    // Kalın ve İtalik için seçim zorunlu (requireSelection: true)
    applyFormatting('**', '**', 'Kalın Metin', true);
  }, [applyFormatting]);

  const applyItalic = useCallback(() => {
    // Kalın ve İtalik için seçim zorunlu (requireSelection: true)
    applyFormatting('*', '*', 'İtalik Metin', true);
  }, [applyFormatting]);

  const applyUnorderedList = useCallback(() => {
    applyFormatting('* ', '', 'Liste Öğesi', false);
  }, [applyFormatting]);

  const applyOrderedList = useCallback(() => {
    applyFormatting('1. ', '', 'Liste Öğesi', false);
  }, [applyFormatting]);

  return (
    <div className={cn("flex gap-1 p-1 border-b border-border bg-muted rounded-t-md", className)}>
      <span className="text-xs font-medium text-muted-foreground flex items-center px-2">
        Biçimlendir:
      </span>
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
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={applyBold}
        title="Kalın (**)"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={applyItalic}
        title="İtalik (*)"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={applyUnorderedList}
        title="Sırasız Liste (*)"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8" 
        onClick={applyOrderedList}
        title="Sıralı Liste (1.)"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default MarkdownToolbar;