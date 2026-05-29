import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, RolePrefix } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
  signUp: (name: string, email: string, password: string, role: 'aluno' | 'personal') => Promise<{ success: boolean; error?: string; role?: string; needsEmailConfirmation?: boolean }>;
  signUpAcademia: (
    name: string,
    email: string,
    password: string,
    city?: string,
    state?: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string, timeoutMs = 12000): Promise<User | null> {
  try {
    const queryPromise = supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url, is_blocked, connection_status, personal_id')
      .eq('id', userId)
      .single();
    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), timeoutMs)
    );
    const result = await Promise.race([queryPromise, timeoutPromise]);
    if (!result) {
      if (import.meta.env.DEV) console.error('[fetchProfile] timeout ou resultado nulo para userId:', userId);
      return null;
    }
    const { data, error } = result as Awaited<typeof queryPromise>;
    if (error || !data) {
      if (import.meta.env.DEV) console.error('[fetchProfile] erro ou dados nulos:', { error, data, userId });
      return null;
    }
    const rolePrefix: RolePrefix =
      data.role === 'personal' ? 'PT' : data.role === 'academia' ? 'ACD' : 'ALN';

    // For alunos with a pending connection, fetch personal's name
    let personalName: string | undefined;
    if (data.role === 'aluno' && data.connection_status === 'pending' && data.personal_id) {
      const { data: pData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', data.personal_id)
        .single();
      personalName = pData?.name ?? undefined;
    }

    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as User['role'],
      rolePrefix: rolePrefix,
      avatarUrl: data.avatar_url ?? undefined,
      isBlocked: data.is_blocked ?? false,
      connectionStatus: (data.connection_status as User['connectionStatus']) ?? undefined,
      personalName,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Flag to prevent onAuthStateChange from clearing user during signUp/login flows
  const signingUpRef = React.useRef(false);

  useEffect(() => {
    // Safety net: always resolve loading within 8 seconds
    const safetyTimer = setTimeout(() => setLoading(false), 8000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
      }
      clearTimeout(safetyTimer);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Se o login/signup está sendo gerenciado diretamente, ignorar o listener
      // para evitar race condition de fetchProfile duplicado.
      if (signingUpRef.current) return;

      if (session?.user) {
        // SIGNED_IN disparado por uma sessão existente (ex: refresh de aba)
        let profile = await fetchProfile(session.user.id);
        if (!profile && event === 'SIGNED_IN') {
          // Trigger pode ainda não ter criado o perfil (caso de signUp externo)
          for (let i = 0; i < 3 && !profile; i++) {
            await new Promise((r) => setTimeout(r, 800));
            profile = await fetchProfile(session.user.id);
          }
        }
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => {
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function login(email: string, password: string) {
    // Bloquear o onAuthStateChange de fazer fetchProfile em paralelo
    signingUpRef.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('email not confirmed') || msg.includes('not confirmed')) {
          return { success: false, error: 'E-mail não confirmado. Verifique sua caixa de entrada e clique no link de confirmação.' };
        }
        return { success: false, error: 'E-mail ou senha inválidos.' };
      }
      if (!data.session) {
        return { success: false, error: 'E-mail ou senha inválidos.' };
      }

      // Buscar perfil; se falhar, tentar mais 2x com delays progressivos
      let profile = await fetchProfile(data.session.user.id);
      if (!profile) {
        await new Promise((r) => setTimeout(r, 1000));
        profile = await fetchProfile(data.session.user.id);
      }
      if (!profile) {
        await new Promise((r) => setTimeout(r, 2000));
        profile = await fetchProfile(data.session.user.id);
      }
      // Perfil ausente: trigger pode ter falhado na criação da conta.
      // Tentar criar o perfil com os metadados disponíveis.
      if (!profile) {
        const meta = data.session.user.user_metadata ?? {};
        const fallbackName =
          (meta.name as string | undefined) ??
          (data.session.user.email ?? '').split('@')[0];
        const fallbackRole: string = (meta.role as string | undefined) ?? 'aluno';
        const { error: insertError } = await supabase.from('profiles').insert({
          id: data.session.user.id,
          name: fallbackName,
          email: data.session.user.email ?? '',
          role: ['personal', 'aluno', 'academia'].includes(fallbackRole)
            ? fallbackRole
            : 'aluno',
        });
        if (!insertError) {
          profile = await fetchProfile(data.session.user.id);
        }
      }
      if (!profile) {
        await supabase.auth.signOut();
        return { success: false, error: 'Não foi possível carregar seu perfil. Tente novamente.' };
      }
      setUser(profile);
      return { success: true, role: profile.role };
    } catch (err) {
      if (import.meta.env.DEV) console.error('[login] catch:', err);
      return { success: false, error: 'Erro de conexão. Verifique sua internet e tente novamente.' };
    } finally {
      signingUpRef.current = false;
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  function translateAuthError(msg: string): string {
    if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('email rate')) {
      return 'Limite de e-mails atingido. Aguarde alguns minutos e tente novamente.';
    }
    if (msg.toLowerCase().includes('user already registered') || msg.toLowerCase().includes('already registered')) {
      return 'Este e-mail já está cadastrado.';
    }
    if (msg.toLowerCase().includes('invalid email')) {
      return 'E-mail inválido.';
    }
    if (msg.toLowerCase().includes('password')) {
      return 'Senha muito fraca. Use pelo menos 6 caracteres.';
    }
    return 'Erro ao criar conta. Tente novamente.';
  }

  async function signUp(name: string, email: string, password: string, role: 'aluno' | 'personal') {
    signingUpRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: { name: name.trim(), role } },
      });
      if (error) return { success: false, error: translateAuthError(error.message) };
      if (data.session) {
        // Retry até 3x â€” trigger pode levar um momento para criar o profile
        let profile = null;
        for (let i = 0; i < 3; i++) {
          profile = await fetchProfile(data.session.user.id);
          if (profile) break;
          await new Promise((r) => setTimeout(r, 700));
        }
        if (!profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'Erro ao configurar sua conta. Verifique sua conexão e tente novamente.' };
        }
        setUser(profile);
        return { success: true, role: profile.role };
      }
      // Email confirmation enabled â€” session not available yet
      return { success: true, role, needsEmailConfirmation: true };
    } finally {
      signingUpRef.current = false;
    }
  }

  async function signUpAcademia(
    name: string,
    email: string,
    password: string,
    city?: string,
    state?: string,
  ) {
    signingUpRef.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: { data: { name: name.trim(), role: 'academia' } },
      });
      if (error) return { success: false, error: translateAuthError(error.message) };

      if (data.session) {
        // Retry até 3x â€” trigger pode levar um momento
        let profile = null;
        for (let i = 0; i < 3; i++) {
          profile = await fetchProfile(data.session.user.id);
          if (profile) break;
          await new Promise((r) => setTimeout(r, 700));
        }
        if (!profile) {
          await supabase.auth.signOut();
          return { success: false, error: 'Erro ao configurar sua conta. Verifique sua conexão e tente novamente.' };
        }
        if (city || state) {
          await supabase
            .from('profiles')
            .update({ city: city ?? null, state: state ?? null })
            .eq('id', data.session.user.id);
        }
        setUser(profile);
        return { success: true };
      }
      // Email confirmation enabled
      return { success: true };
    } finally {
      signingUpRef.current = false;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signUp, signUpAcademia }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
