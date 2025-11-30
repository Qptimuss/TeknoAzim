import React, { useCallback } from 'react';
import { Heading1, Heading2, Heading3, Bold, Italic, List, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

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

  const markdownRules = [
    { name: "Başlık 1", syntax: "# Başlık", icon: Heading1 },
    { name: "Başlık 2", syntax: "## Başlık", icon: Heading2 },
    { name: "Başlık 3", syntax: "### Başlık", icon: Heading3 },
    { name: "Kalın", syntax: "**metin**", icon: Bold },
    { name: "İtalik", syntax: "*metin*", icon: Italic },
    { name: "Sırasız Liste", syntax: "* öğe", icon: List },
    { name: "Kod Bloğu", syntax: "```kod```", description: "Üç ters tırnak işareti kullanın." },
    { name: "Yatay Çizgi", syntax: "---", description: "Üç tire işareti kullanın." },
  ];

  return (
    <div className={cn("flex gap-1 p-1 border-b border-border bg-muted rounded-t-md items-center", className)}>
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

      <Separator orientation="vertical" className="h-6 mx-1" />

      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
        Blogunu biçimlendir!
      </span>

      <Popover>
        <PopoverTrigger asChild>
          <Button 
            type="button" 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 text-primary hover:bg-primary/10"
            title="Biçimlendirme Kuralları"
          >
            <Info className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4" align="start">
          <h4 className="font-semibold text-lg mb-2">Blog Biçimlendirme</h4>
          <p className="text-sm text-muted-foreground mb-3">
            Seçtiğiniz metni biçimlendirmek için **sağdaki butonları** kullanın veya aşağıdaki sözdizimini manuel olarak uygulayın.
          </p>
          <div className="space-y-2">
            {markdownRules.map((rule) => (
              <div key={rule.name} className="flex justify-between items-center text-sm">
                <span className="font-medium text-foreground">{rule.name}</span>
                <code className="bg-muted px-2 py-0.5 rounded text-xs font-mono text-primary">
                  {rule.syntax}
                </code>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default MarkdownToolbar;