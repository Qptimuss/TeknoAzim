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
    // Try to parse error JSON, but fallback if it fails
    const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen bir sunucu hatası oluştu.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  // Handle 204 No Content case for DELETE, etc.
  if (response.status === 204) {
    return null;
  }

  return response.json();
};