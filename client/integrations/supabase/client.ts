import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

// Supabase istemcisini, oturum bilgilerini HİÇBİR YERDE saklamayacak şekilde oluşturuyoruz.
// Oturum sadece uygulama belleğinde yaşayacak ve sayfa yenilendiğinde kaybolacak.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Oturumun tarayıcı depolama alanına (localStorage veya sessionStorage) kaydedilmesini engelle.
    persistSession: false,
  },
});