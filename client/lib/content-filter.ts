import { supabase } from "@/integrations/supabase/client";

export async function filterContent(text: string): Promise<{ isAllowed: boolean; reason?: string }> {
  // Boş veya sadece boşluk içeren metinleri direkt olarak güvenli kabul et
  if (!text.trim()) {
    return { isAllowed: true };
  }

  try {
    const { data, error } = await supabase.functions.invoke('content-filter', {
      body: { text },
    });

    if (error) {
      console.error('Error invoking content filter function:', error);
      // Filtreleme servisinde bir sorun olursa, güvenli tarafta kalıp içeriği engellemek daha doğru.
      return { isAllowed: false, reason: "İçerik filtresiyle iletişim kurulamadı. Lütfen daha sonra tekrar deneyin." };
    }

    return data;
  } catch (e) {
    console.error('Unexpected error in content filter:', e);
    return { isAllowed: false, reason: "İçerik kontrolü sırasında beklenmedik bir hata oluştu." };
  }
}