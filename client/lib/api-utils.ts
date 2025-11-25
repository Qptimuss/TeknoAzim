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
    let errorText = `HTTP error! status: ${response.status}`;
    let errorData: any = {};

    try {
      // Sunucudan gelen JSON hata mesajını ayrıştırmayı dene
      errorData = await response.json();
      errorText = errorData.error || errorData.message || errorText;
    } catch (e) {
      // JSON ayrıştırma başarısız olursa, yanıt metnini dene
      try {
        errorText = await response.text() || errorText;
      } catch (e) {
        // Metin de alınamazsa, varsayılan hata mesajını kullan
      }
    }
    
    // Hata mesajını bir Error nesnesine sararak fırlat
    throw new Error(errorText);
  }

  // Handle 204 No Content case for DELETE, etc.
  if (response.status === 204) {
    return null;
  }

  // Başarılı yanıtı JSON olarak döndür
  return response.json();
};