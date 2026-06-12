import { supabase } from '../lib/supabase';
import type { User } from '../types';

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchStudents(personalId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role, avatar_url, is_blocked, connection_status')
    .eq('personal_id', personalId)
    .eq('role', 'aluno')
    .order('name');

  if (error) throw new Error(error.message);

  // Corrigido: adicionado (r: any) para o mapeamento dos alunos
  return (data ?? []).map((r: any) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role as User['role'],
    rolePrefix: 'ALN' as const,
    avatarUrl: r.avatar_url ?? undefined,
    isBlocked: r.is_blocked,
    connectionStatus: (r.connection_status as User['connectionStatus']) ?? undefined,
  }));
}

// ── Search existing aluno by email (via RPC) ──────────────────────────────────

export type AlunoSearchResult = {
  id: string;
  name: string;
  avatarUrl?: string;
  alreadyLinked: boolean;
};

export async function searchAlunoByEmail(email: string): Promise<AlunoSearchResult | null> {
  const { data, error } = await supabase.rpc('find_aluno_by_email', {
    search_email: email.toLowerCase().trim(),
  });
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;
  
  // Corrigido: Castado data[0] como any para ler as propriedades dinâmicas do banco
  const row = data[0] as any;
  return {
    id: row.id,
    name: row.name,
    avatarUrl: row.avatar_url ?? undefined,
    alreadyLinked: row.already_linked,
  };
}

// ── Invite existing aluno (via Edge Function) ─────────────────────────────────

export async function inviteExistingStudent(
  studentId: string,
  personalId: string,
): Promise<void> {
  const { data, error } = await supabase.functions.invoke('invite-student', {
    body: { studentId, personalId },
  });
  if (error) throw new Error(error.message);
  if (data?.error) throw new Error(data.error);
}

// ── Aluno confirms or rejects connection ──────────────────────────────────────

export async function confirmStudentConnection(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ connection_status: 'confirmed' })
    .eq('id', studentId);
  if (error) throw new Error(error.message);
}

export async function rejectStudentConnection(studentId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ personal_id: null, connection_status: null })
    .eq('id', studentId);
  if (error) throw new Error(error.message);
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
  
  // Corrigido: Castado o retorno da Edge Function como any para mapear com segurança o objeto final
  const res = data as any;
  return {
    id: res.id,
    name: res.name,
    email: res.email,
    role: 'aluno',
    rolePrefix: 'ALN',
    avatarUrl: res.avatar_url ?? undefined,
    isBlocked: res.is_blocked ?? false,
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