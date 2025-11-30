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
  // Artık tüm biçimlendirmeler için metin seçimi zorunlu olacak.
  const applyFormatting = useCallback((prefix: string, suffix: string = '', placeholder: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    if (start === null || end === null) return;

    const selectedText = currentValue.substring(start, end);
    let newSelectedText = selectedText;

    // Metin seçimi kontrolü: Eğer başlangıç ve bitiş aynıysa, metin seçilmemiştir.
    if (start === end) {
      toast.info("Lütfen önce biçimlendirmek istediğiniz metni seçin.");
      return;
    }
    
    // Metin seçilmişse, sarmala
    newSelectedText = prefix + selectedText + suffix;

    const newValue = currentValue.substring(0, start) + newSelectedText + currentValue.substring(end);
    onValueChange(newValue);

    // Seçimi koru
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + newSelectedText.length;
      textarea.focus();
    }, 0);

  }, [textareaRef, onValueChange]);

  const applyHeading = useCallback((level: 1 | 2 | 3) => {
    // Başlıklar için de seçim zorunlu, ancak placeholder'ı kullanmıyoruz, sadece seçilen metni sarmalıyoruz.
    applyFormatting('#'.repeat(level) + ' ', '', 'Başlık Metni');
  }, [applyFormatting]);

  const applyBold = useCallback(() => {
    applyFormatting('**', '**', 'Kalın Metin');
  }, [applyFormatting]);

  const applyItalic = useCallback(() => {
    applyFormatting('*', '*', 'İtalik Metin');
  }, [applyFormatting]);

  const applyUnorderedList = useCallback(() => {
    // Liste için de seçim zorunlu. Seçilen metnin her satırına * eklenmesi gerekebilir, 
    // ancak basitlik için sadece seçilen metni sarmalıyoruz.
    applyFormatting('* ', '', 'Liste Öğesi');
  }, [applyFormatting]);

  const applyOrderedList = useCallback(() => {
    applyFormatting('1. ', '', 'Liste Öğesi');
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