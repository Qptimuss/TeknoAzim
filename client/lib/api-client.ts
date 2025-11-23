import { supabase } from "@/integrations/supabase/client";

async function getAuthToken() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error("Kullanıcı doğrulanmadı.");
  }
  return session.access_token;
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getAuthToken();
  
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);
  if (options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    // Use the specific message from the toxicity middleware if available
    throw new Error(errorData.message || "API isteği başarısız oldu");
  }

  if (response.status === 204) { // No Content
    return null;
  }

  return response.json();
}