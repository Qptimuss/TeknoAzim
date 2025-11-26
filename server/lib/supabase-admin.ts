import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Server-side admin client (bypass RLS)
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_URL) {
    console.error("FATAL ERROR: SUPABASE_URL is missing from environment variables.");
    throw new Error("SUPABASE_URL is missing. Please check your .env file and ensure the server is restarted.");
  }

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error("FATAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing from environment variables.");
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Please check your .env file and ensure the server is restarted.");
  }

  supabaseAdminInstance = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
};
