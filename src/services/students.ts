import { supabase } from '../lib/supabase';
import type { User } from '../types';

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchStudents(personalId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, avatar_url, is_blocked')
    .eq('personal_id', personalId)
    .eq('role', 'aluno')
    .order('name');

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as User['role'],
    avatarUrl: r.avatar_url ?? undefined,
    isBlocked: r.is_blocked,
  }));
}

// ── Create (via Edge Function) ────────────────────────────────────────────────

export async function createStudent(params: {
  name: string;
  email: string;
  password: string;
  personalId: string;
}): Promise<User> {
  const { data, error } = await supabase.functions.invoke('create-student', {
    body: params,
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: 'aluno',
    avatarUrl: data.avatar_url ?? undefined,
    isBlocked: data.is_blocked ?? false,
  };
}

// ── Block / Unblock ───────────────────────────────────────────────────────────

export async function setStudentBlocked(studentId: string, blocked: boolean): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ is_blocked: blocked })
    .eq('id', studentId);

  if (error) throw new Error(error.message);
}
