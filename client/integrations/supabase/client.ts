import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

// Supabase istemcisini, oturumu sessionStorage'da saklayacak şekilde oluşturuyoruz.
// Bu, tarayıcı sekmesi kapatıldığında oturumun otomatik olarak temizlenmesini sağlar.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    // Depolama mekanizması olarak doğrudan sessionStorage'ı belirtiyoruz.
    storage: typeof window !== 'undefined' ? window.sessionStorage : undefined as any,
    persistSession: true,
    // autoRefreshToken'i açık bırakmak, seansın aktif kalmasına yardımcı olur.
    autoRefreshToken: true,
    // Token'ın süresi dolduğunda otomatik olarak yenilenmesini algıla.
    detectSessionInUrl: true,
  },
});