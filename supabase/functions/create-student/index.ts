// supabase/functions/create-student/index.ts
// Invoked by a personal trainer to create a student auth account.
// Uses SUPABASE_SERVICE_ROLE_KEY (server-side only — never exposed to the browser).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Step 1: Verify the caller has a valid JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { name, email, password, personalId } = await req.json() as {
      name: string;
      email: string;
      password: string;
      personalId: string;
    };

    if (!name || !email || !password || !personalId) {
      return new Response(JSON.stringify({ error: 'Missing required fields.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Step 2: Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: 'A senha deve ter ao menos 8 caracteres.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAnon = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );

    // Step 3: Validate the JWT and confirm the caller is the personalId they claim
    const { data: { user: callerUser }, error: callerErr } = await supabaseAnon.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (callerErr || !callerUser || callerUser.id !== personalId) {
      return new Response(JSON.stringify({ error: 'Forbidden.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Step 4: Confirm the caller has role = 'personal' in the DB
    const { data: callerProfile, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', callerUser.id)
      .single();
    if (profileErr || callerProfile?.role !== 'personal') {
      return new Response(JSON.stringify({ error: 'Forbidden.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create the auth user (email already confirmed)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      user_metadata: { name: name.trim(), role: 'aluno', personal_id: personalId },
      email_confirm: true,
    });

    if (authError) {
      return new Response(JSON.stringify({ error: authError.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Ensure personal_id is set (trigger may not fire with admin.createUser metadata)
    await supabaseAdmin
      .from('profiles')
      .update({ personal_id: personalId, role: 'aluno', connection_status: 'pending' })
      .eq('id', authData.user.id);

    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, name, email, avatar_url, is_blocked, personal_id, role')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return new Response(JSON.stringify({ error: profileError.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(profile), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
