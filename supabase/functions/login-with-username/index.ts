import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper to create consistent JSON error responses
const createErrorResponse = (message: string, status: number) => {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return createErrorResponse('Kullanıcı adı ve şifre gereklidir', 400);
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Step 1: Find profile by username
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('name', username)
      .single();

    if (profileError || !profile) {
      return createErrorResponse('Geçersiz kullanıcı adı veya şifre.', 400);
    }

    // Step 2: Get user email using the ID from profile
    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id);
    
    if (userError || !authUser.user?.email) {
      return createErrorResponse('Kullanıcı bilgileri alınamadı.', 500);
    }
    
    const email = authUser.user.email;

    // Step 3: Attempt to sign in with email and password
    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
    );

    const { data, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        return createErrorResponse('Geçersiz kullanıcı adı veya şifre.', 400);
      }
      return createErrorResponse(signInError.message, 400);
    }

    if (!data.session && data.user) {
      return createErrorResponse('Giriş yapmadan önce lütfen e-postanızı doğrulayın.', 401);
    }

    if (!data.session || !data.user) {
      return createErrorResponse('Oturum oluşturulamadı.', 500);
    }

    // Step 4: Success
    return new Response(JSON.stringify({ session: data.session, user: data.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('Edge function error:', e);
    return createErrorResponse(e.message || 'Sunucuda beklenmedik bir hata oluştu.', 500);
  }
});