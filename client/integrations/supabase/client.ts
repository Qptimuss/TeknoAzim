import { createClient } from '@supabase/supabase-js';

// Lütfen bu değerleri kendi Supabase projenizle eşleşecek şekilde güncelleyin.
// Eğer .env kullanıyorsanız, bu değerleri oradan alabilirsiniz.
const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co"; // Kendi URL'nizle değiştirin
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA"; // Kendi Anon Key'inizle değiştirin


// Supabase istemcisini varsayılan ayarlarla oluşturuyoruz.
// Bu, oturumun tarayıcının yerel depolamasında saklanmasını sağlar (persistSession: true).
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);