import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get the current user's JWT for server authentication.
 * It ensures the session is fresh before returning the access token.
 */
export const getAuthHeaders = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Supabase session hatası: ${error.message}`);
  }

  if (!session) {
    throw new Error("Kullanıcı kimliği doğrulanmadı. Lütfen tekrar giriş yapın.");
  }
  
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
};

/**
 * A wrapper around fetch that automatically includes authorization headers.
 * @param url The URL to fetch.
 * @param options The fetch options.
 * @returns The JSON response.
 */
export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = await getAuthHeaders();
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorMessage = `Sunucu Hatası: ${response.status}`; // Varsayılan hata mesajı
    try {
      // Sunucudan gelen JSON formatındaki hata mesajını ayrıştırmayı dene
      const errorData = await response.json();
      // Gelen veride 'error' veya 'message' alanı varsa onu kullan
      if (typeof errorData.error === 'string' && errorData.error) {
        errorMessage = errorData.error;
      } else if (typeof errorData.message === 'string' && errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // JSON ayrıştırma başarısız olursa, yanıt metnini ham olarak almayı dene
      try {
        const textError = await response.text();
        if (textError) {
          errorMessage = textError;
        }
      } catch (textErr) {
        // Eğer yanıtı okumak tamamen başarısız olursa, varsayılan mesaj kullanılır.
      }
    }
    // Her zaman standart bir Error nesnesi fırlat. Bu, '[object Object]' hatasını önler.
    throw new Error(errorMessage);
  }

  // DELETE gibi işlemler için 204 No Content durumunu ele al
  if (response.status === 204) {
    return null;
  }

  // Başarılı yanıtı JSON olarak döndür
  return response.json();
};