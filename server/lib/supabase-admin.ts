import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import { Database } from "./database.types";

const SUPABASE_URL = "https://yswvdavntaevzbxluvkh.supabase.co";


let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

export const getSupabaseAdmin = () => {
  if (supabaseAdminInstance) {
    return supabaseAdminInstance;
  }

  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Set it in your .env file.");
  }

  supabaseAdminInstance = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return supabaseAdminInstance;
};