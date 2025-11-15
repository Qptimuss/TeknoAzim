import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { username, password } = await req.json()

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Kullanıcı adı ve şifre gereklidir' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('name', username)
      .single()

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: 'Invalid login credentials' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { data: authUser, error: userError } = await supabaseAdmin.auth.admin.getUserById(profile.id)
    
    if (userError || !authUser.user) {
        return new Response(JSON.stringify({ error: 'Kullanıcı bulunamadı' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
    
    const email = authUser.user.email

    if (!email) {
        return new Response(JSON.stringify({ error: 'Bu kullanıcı için e-posta bulunamadı' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }

    const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { data: sessionData, error: signInError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password,
    })

    if (signInError) {
      return new Response(JSON.stringify({ error: signInError.message || 'Geçersiz kullanıcı adı veya şifre' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify(sessionData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})