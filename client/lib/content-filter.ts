import { supabase } from "@/integrations/supabase/client";

interface FilterResult {
  isAllowed: boolean;
  reason?: string;
}

// AbortController ile zaman aşımı yönetimi ekliyoruz.
const FUNCTION_INVOKE_TIMEOUT = 15000; // 15 saniye

export async function filterContent(content: string | null | undefined): Promise<FilterResult> {
  if (!content || content.trim() === "") {
    return { isAllowed: true };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FUNCTION_INVOKE_TIMEOUT);

  try {
    const { data, error } = await supabase.functions.invoke('content-filter', {
      body: { content },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (error) {
      // Zaman aşımı hatasını yakala
      if (error.name === 'AbortError' || error.message.includes('request was aborted')) {
        console.error('Content filter function timed out.');
        return {
          isAllowed: false,
          reason: "İçerik filtresi hazırlanıyor. Lütfen birkaç saniye sonra tekrar deneyin.",
        };
      }
      console.error('Error invoking content-filter function:', error);
      throw new Error('İçerik filtresiyle iletişim kurulamadı.');
    }

    return data as FilterResult;
  } catch (e) {
    clearTimeout(timeoutId);
    if (e instanceof Error && e.name === 'AbortError') {
       return {
          isAllowed: false,
          reason: "İçerik filtresi zaman aşımına uğradı. Lütfen tekrar deneyin.",
        };
    }
    console.error('Unexpected error in filterContent:', e);
    // Genel bir hata durumunda içeriği engellemek daha güvenli bir yaklaşımdır.
    return {
      isAllowed: false,
      reason: "İçerik filtresiyle bağlantı kurulamadı. Lütfen daha sonra tekrar deneyin.",
    };
  }
}