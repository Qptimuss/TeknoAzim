import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = "https://yswvdavntaevzbxluvkh.supabase.co";

// This client bypasses Row Level Security (RLS) and should only be used on the server.
// We are making it a singleton getter to avoid crashing the dev server on startup
// if the service role key is not present. The error will be thrown at runtime instead.
let supabaseAdminInstance: ReturnType<typeof createClient> | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Set it in your .env file.");
  }

  supabaseAdminInstance = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
};