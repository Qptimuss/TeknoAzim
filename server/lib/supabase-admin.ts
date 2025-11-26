import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

// Supabase URL'sini doğrudan ortam değişkeninden okumayı tercih ediyoruz.
const SUPABASE_URL = process.env.SUPABASE_URL || "https://vbnkhhrlgszewrswyksz.supabase.co";

// This client bypasses Row Level Security (RLS) and should only be used on the server.
// We are making it a singleton getter to avoid crashing the dev server on startup
// if the service role key is not present. The error will be thrown at runtime instead.
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    // Hata ayıklama için daha net bir mesaj
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