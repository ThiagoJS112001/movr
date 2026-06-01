import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ROLE_ROUTES } from '../lib/constants';
import { PageSkeleton } from '../components/ui';

/**
 * Handles the OAuth redirect from Google (and other providers).
 * Supabase exchanges the code for a session automatically via the URL hash/query.
 * We wait for the session, fetch the profile, then redirect to the right dashboard.
 */
export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    async function handle() {
      // Give Supabase a moment to exchange the OAuth code
      const { data: { session }, error } = await supabase.auth.getSession();

      if (cancelled) return;

      if (error || !session) {
        navigate('/login?error=oauth_failed', { replace: true });
        return;
      }

      // Fetch role and phone from profiles table to route correctly
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, phone')
        .eq('id', session.user.id)
        .single();

      if (cancelled) return;

      const role = profile?.role ?? 'aluno';

      // If phone is not set, user hasn't completed onboarding yet
      const onboardingDone = Boolean(profile?.phone);
      if (!onboardingDone) {
        navigate('/completar-perfil', { replace: true });
        return;
      }

      navigate(ROLE_ROUTES[role] ?? '/aluno/dashboard', { replace: true });
    }

    handle();
    return () => { cancelled = true; };
  }, [navigate]);

  return <PageSkeleton />;
}
