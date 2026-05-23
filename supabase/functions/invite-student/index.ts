// supabase/functions/invite-student/index.ts
// Invoked by a personal trainer to invite an existing Movr aluno.
// Uses SUPABASE_SERVICE_ROLE_KEY to bypass RLS when setting personal_id.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { studentId, personalId } = await req.json() as {
      studentId: string;
      personalId: string;
    };

    if (!studentId || !personalId) {
      return new Response(JSON.stringify({ error: 'Missing studentId or personalId.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    // Verify the caller JWT is the personal in question
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
    );
    const { data: { user: callerUser }, error: callerErr } = await supabaseUser.auth.getUser(
      authHeader.replace('Bearer ', ''),
    );
    if (callerErr || !callerUser || callerUser.id !== personalId) {
      return new Response(JSON.stringify({ error: 'Forbidden.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify target is an aluno not already linked to someone else
    const { data: target, error: targetErr } = await supabaseAdmin
      .from('profiles')
      .select('id, role, personal_id, connection_status')
      .eq('id', studentId)
      .single();

    if (targetErr || !target) {
      return new Response(JSON.stringify({ error: 'Aluno não encontrado.' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (target.role !== 'aluno') {
      return new Response(JSON.stringify({ error: 'O usuário não é um aluno.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Allow re-invite only if not already linked to a DIFFERENT personal
    if (target.personal_id && target.personal_id !== personalId) {
      return new Response(JSON.stringify({ error: 'Este aluno já está vinculado a outro personal.' }), {
        status: 409,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Already linked to this personal — idempotent
    if (target.personal_id === personalId) {
      return new Response(JSON.stringify({ ok: true, alreadyLinked: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Set link as pending
    const { error: updateErr } = await supabaseAdmin
      .from('profiles')
      .update({ personal_id: personalId, connection_status: 'pending' })
      .eq('id', studentId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
