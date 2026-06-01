import { supabase } from '../lib/supabase';
import type { TrainingSession, SessionStatus } from '../types';

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapSession(row: Record<string, unknown>): TrainingSession {
  const profile = row.profiles as Record<string, unknown> | null;
  return {
    id: row.id as string,
    personalId: row.personal_id as string,
    studentId: row.student_id as string,
    studentName: (profile?.name as string) ?? undefined,
    title: row.title as string,
    date: row.date as string,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    status: row.status as SessionStatus,
    notes: (row.notes as string | null) ?? undefined,
    createdAt: row.created_at as string,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchSessions(personalId: string): Promise<TrainingSession[]> {
  const { data, error } = await supabase
    .from('training_sessions')
    .select('*, profiles!training_sessions_student_id_fkey(name)')
    .eq('personal_id', personalId)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapSession(r as Record<string, unknown>));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function createSession(params: {
  personalId: string;
  studentId: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  notes?: string;
}): Promise<TrainingSession> {
  const { data, error } = await supabase
    .from('training_sessions')
    .insert({
      personal_id: params.personalId,
      student_id: params.studentId,
      title: params.title,
      date: params.date,
      start_time: params.startTime,
      end_time: params.endTime,
      notes: params.notes ?? null,
    })
    .select('*, profiles!training_sessions_student_id_fkey(name)')
    .single();

  if (error) throw new Error(error.message);
  return mapSession(data as Record<string, unknown>);
}

export async function updateSessionStatus(
  id: string,
  status: SessionStatus,
): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .update({ status })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function updateSession(
  id: string,
  params: {
    title?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    notes?: string | null;
  },
): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .update({
      ...(params.title !== undefined && { title: params.title }),
      ...(params.date !== undefined && { date: params.date }),
      ...(params.startTime !== undefined && { start_time: params.startTime }),
      ...(params.endTime !== undefined && { end_time: params.endTime }),
      ...(params.notes !== undefined && { notes: params.notes }),
    })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteSession(id: string): Promise<void> {
  const { error } = await supabase
    .from('training_sessions')
    .delete()
    .eq('id', id);
  if (error) throw new Error(error.message);
}
