import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = "https://yswvdavntaevzbxluvkh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing. Set it in your .env file.");
}

// This client bypasses Row Level Security (RLS) and should only be used on the server.
export const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});