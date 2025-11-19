import { supabase } from "@/integrations/supabase/client";

/**
 * Helper function to get the current user's JWT for server authentication.
 */
export const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("User not authenticated.");
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
  };
};