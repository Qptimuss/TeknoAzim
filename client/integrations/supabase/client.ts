import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

// Oturum bilgilerini localStorage yerine sessionStorage'da saklamak için
// özel bir depolama adaptörü oluşturuyoruz.
const sessionStorageAdapter = {
  getItem: (key: string) => {
    // Sunucu tarafında veya sessionStorage'ın olmadığı ortamlarda hata vermemesi için kontrol
    if (typeof sessionStorage === 'undefined') {
      return null;
    }
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string) => {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem(key);
    }
  },
};

// Supabase istemcisini, oturumu sessionStorage'da saklayacak şekilde oluşturuyoruz.
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: sessionStorageAdapter,
    persistSession: true, // Oturumun sekme boyunca devam etmesini istiyoruz, sadece depolama yerini değiştirdik.
  },
});