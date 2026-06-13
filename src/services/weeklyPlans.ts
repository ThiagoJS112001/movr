import { supabase } from '../lib/supabase';
import type { WeeklyPlan, WeeklyPlanArchive, WeeklyDay } from '../types';

function mapPlan(row: Record<string, unknown>): WeeklyPlan {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    personalId: row.personal_id as string,
    days: (row.days as WeeklyDay[]) ?? [],
    updatedAt: row.updated_at as string,
  };
}

function mapArchive(row: Record<string, unknown>): WeeklyPlanArchive {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    studentName: row.student_name as string,
    personalId: row.personal_id as string,
    days: (row.days as WeeklyDay[]) ?? [],
    archivedAt: row.archived_at as string,
  };
}

// ── Weekly Plans ──────────────────────────────────────────────────────────────

export async function fetchWeeklyPlan(
  studentId: string,
  personalId?: string,
): Promise<WeeklyPlan | null> {
  let query = supabase
    .from('weekly_plans')
    .select('*')
    .eq('student_id', studentId);

  if (personalId) {
    query = query.eq('personal_id', personalId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapPlan(data as Record<string, unknown>);
}

export async function setWeeklyPlan(
  studentId: string,
  personalId: string,
  days: WeeklyDay[],
): Promise<void> {
  const { error } = await supabase
    .from('weekly_plans')
    .upsert(
      { student_id: studentId, personal_id: personalId, days, updated_at: new Date().toISOString() } as any,
      { onConflict: 'student_id,personal_id' },
    );
  if (error) throw error;
}

// ── Plan Archives ─────────────────────────────────────────────────────────────

export async function fetchPlanArchives(personalId: string): Promise<WeeklyPlanArchive[]> {
  const { data, error } = await supabase
    .from('weekly_plan_archives')
    .select('*')
    .eq('personal_id', personalId)
    .order('archived_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((r) => mapArchive(r as Record<string, unknown>));
}

export async function archiveWeeklyPlan(
  studentId: string,
  personalId: string,
  studentName: string,
  days: WeeklyDay[],
): Promise<void> {
  const { error } = await supabase.from('weekly_plan_archives').insert({
    student_id: studentId,
    personal_id: personalId,
    student_name: studentName,
    days: days as any,
    archived_at: new Date().toISOString(),
  } as any);
  if (error) throw error;
}

export async function deletePlanArchive(id: string): Promise<void> {
  const { error } = await supabase.from('weekly_plan_archives').delete().eq('id', id);
  if (error) throw error;
}
