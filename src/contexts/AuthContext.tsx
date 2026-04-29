import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
  signUpAcademia: (
    name: string,
    email: string,
    password: string,
    city?: string,
    state?: string,
  ) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, email, role, avatar_url, is_blocked')
      .eq('id', userId)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role as User['role'],
      avatarUrl: data.avatar_url ?? undefined,
      isBlocked: data.is_blocked ?? false,
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setUser(profile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        if (profile) setUser(profile);
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 10000)
    );
    try {
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({ email: email.toLowerCase().trim(), password }),
        timeout,
      ]) as Awaited<ReturnType<typeof supabase.auth.signInWithPassword>>;

      if (error || !data.session) {
        return { success: false, error: 'E-mail ou senha inválidos.' };
      }
      let profile = await fetchProfile(data.session.user.id);
      if (!profile) {
        await new Promise((r) => setTimeout(r, 500));
        profile = await fetchProfile(data.session.user.id);
      }
      if (profile) setUser(profile);
      return { success: true, role: profile?.role };
    } catch {
      return { success: false, error: 'Erro de conexão. Tente novamente.' };
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    setUser(null);
  }

  async function signUpAcademia(
    name: string,
    email: string,
    password: string,
    city?: string,
    state?: string,
  ) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: { data: { name: name.trim(), role: 'academia' } },
    });
    if (error) return { success: false, error: error.message };

    // If email confirmation is disabled, session is available immediately
    if (data.session) {
      // Update city/state in profile if provided
      if (city || state) {
        await supabase
          .from('profiles')
          .update({ city: city ?? null, state: state ?? null })
          .eq('id', data.session.user.id);
      }
      const profile = await fetchProfile(data.session.user.id);
      if (profile) setUser(profile);
    }

    return { success: true };
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, signUpAcademia }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
