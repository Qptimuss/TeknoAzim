import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

// Supabase istemcisini, oturumu tarayıcıda (localStorage) saklayacak şekilde oluşturuyoruz.
// Bu, sayfa yenilendiğinde veya sekme arka planda kaldığında oturumun korunmasını sağlar.
// Varsayılan ayarlar (persistSession: true, autoRefreshToken: true) bu davranışı yönetir.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);