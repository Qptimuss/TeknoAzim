import * as React from "react";
import { Textarea, TextareaProps } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface AutoResizeTextareaProps extends TextareaProps {
  // Ekstra props gerekirse buraya eklenebilir
}

const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  AutoResizeTextareaProps
>(({ className, onChange, ...props }, ref) => {
  const internalRef = React.useRef<HTMLTextAreaElement>(null);

  // Hem dışarıdan gelen ref'i hem de dahili ref'i birleştir
  React.useImperativeHandle(ref, () => internalRef.current!);

  const handleChange = React.useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      // Otomatik boyutlandırma mantığı
      if (internalRef.current) {
        internalRef.current.style.height = "auto";
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }

      // Dışarıdan gelen onChange fonksiyonunu çağır
      if (onChange) {
        onChange(event);
      }
    },
    [onChange],
  );

  // İlk renderda ve değer değiştiğinde boyutlandırmayı ayarla
  React.useEffect(() => {
    if (internalRef.current) {
      internalRef.current.style.height = "auto";
      internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
    }
  }, [props.value]);

  return (
    <Textarea
      ref={internalRef}
      onChange={handleChange}
      className={cn("resize-none overflow-hidden", className)}
      rows={1} // Başlangıçta tek satır olarak ayarla
      {...props}
    />
  );
});

AutoResizeTextarea.displayName = "AutoResizeTextarea";

export default AutoResizeTextarea;