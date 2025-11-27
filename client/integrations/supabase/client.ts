import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

// Supabase istemcisini, oturumu HİÇBİR YERDE saklamayacak şekilde oluşturuyoruz.
// Oturum sadece sayfa açık olduğu sürece bellekte tutulur.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // persistSession: false ayarı, oturumun tarayıcı deposuna (localStorage/sessionStorage)
    // kaydedilmesini engeller.
    persistSession: false,
  },
});