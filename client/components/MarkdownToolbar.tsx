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
  // Tüm biçimlendirmeler için metin seçimi zorunlu olacak.
  const applyFormatting = useCallback((prefix: string, suffix: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    if (start === null || end === null) return;

    const selectedText = currentValue.substring(start, end);
    
    // Metin seçimi kontrolü: Eğer başlangıç ve bitiş aynıysa, metin seçilmemiştir.
    if (start === end) {
      toast.info("Lütfen önce biçimlendirmek istediğiniz metni seçin.");
      return;
    }
    
    // Metin seçilmişse, sarmala
    const newSelectedText = prefix + selectedText + suffix;

    const newValue = currentValue.substring(0, start) + newSelectedText + currentValue.substring(end);
    onValueChange(newValue);

    // Seçimi koru
    setTimeout(() => {
      textarea.selectionStart = start;
      textarea.selectionEnd = start + newSelectedText.length;
      textarea.focus();
    }, 0);

  }, [textareaRef, onValueChange]);

  // Sıralı liste için özel işleyici: Seçilen aralıktaki tüm satırları numaralandırır.
  const applyOrderedList = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentValue = textarea.value;

    if (start === end) {
      toast.info("Lütfen önce listelemek istediğiniz metni seçin.");
      return;
    }

    // Seçilen metni al
    const selectedText = currentValue.substring(start, end);
    
    // Seçilen metni satırlara ayır
    const lines = selectedText.split('\n');
    
    let lineNumber = 1;
    
    // Her satırın başına artan sayı ekle
    const numberedLines = lines.map((line) => {
      // Eğer satır boş değilse veya sadece boşluklardan oluşmuyorsa numaralandır
      if (line.trim().length > 0) {
        return `${lineNumber++}. ${line}`;
      }
      return line; // Boş satırları olduğu gibi bırak
    });

    const newSelectedText = numberedLines.join('\n');
    
    // Yeni listenin her zaman 1'den başlamasını sağlamak için, 
    // seçilen metnin önüne iki boş satır ekliyoruz (yeni bir paragraf bloğu başlatır).
    const prefix = '\n\n'; 

    const newValue = currentValue.substring(0, start) + prefix + newSelectedText + currentValue.substring(end);
    
    // Eski seçimi kaldırıp, yeni içeriği eklediğimiz yere odaklanıyoruz.
    onValueChange(newValue);

    // Seçimi koru (yeni eklenen prefix'i de hesaba kat)
    setTimeout(() => {
      textarea.selectionStart = start + prefix.length;
      textarea.selectionEnd = start + prefix.length + newSelectedText.length;
      textarea.focus();
    }, 0);
  }, [textareaRef, onValueChange]);


  const applyHeading = useCallback((level: 1 | 2 | 3) => {
    applyFormatting('#'.repeat(level) + ' ');
  }, [applyFormatting]);

  const applyBold = useCallback(() => {
    applyFormatting('**', '**');
  }, [applyFormatting]);

  const applyItalic = useCallback(() => {
    applyFormatting('*', '*');
  }, [applyFormatting]);

  const applyUnorderedList = useCallback(() => {
    applyFormatting('* ');
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