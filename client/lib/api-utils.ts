import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get the current user's JWT for server authentication.
 * It ensures the session is fresh before returning the access token.
 */
export const getAuthHeaders = async () => {
  // Force a refresh if necessary and get the current session
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    throw new Error(`Supabase session hatası: ${error.message}`);
  }

  if (!session) {
    throw new Error("Kullanıcı kimliği doğrulanmadı. Lütfen tekrar giriş yapın.");
  }
  
  // session.access_token is the JWT required by the server middleware
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
};