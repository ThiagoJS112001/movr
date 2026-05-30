import { supabase } from '../lib/supabase';
import type { StudentAnamnese, ActivityLevel, PreferredTime } from '../types';

// ── Mapper ────────────────────────────────────────────────────────────────────

function mapAnamnese(row: Record<string, unknown>): StudentAnamnese {
  return {
    id: row.id as string,
    personalId: row.personal_id as string,
    studentId: row.student_id as string,
    objective: (row.objective as string | null) ?? undefined,
    activityLevel: (row.activity_level as ActivityLevel | null) ?? undefined,
    hasHealthIssues: (row.has_health_issues as boolean) ?? false,
    healthIssues: (row.health_issues as string | null) ?? undefined,
    medications: (row.medications as string | null) ?? undefined,
    injuries: (row.injuries as string | null) ?? undefined,
    sleepHours: (row.sleep_hours as number | null) ?? undefined,
    stressLevel: (row.stress_level as number | null) ?? undefined,
    waterIntakeLiters: (row.water_intake_liters as number | null) ?? undefined,
    previousTraining: (row.previous_training as string | null) ?? undefined,
    trainingYears: (row.training_years as number | null) ?? undefined,
    preferredDays: (row.preferred_days as string[]) ?? [],
    preferredTime: (row.preferred_time as PreferredTime | null) ?? undefined,
    observations: (row.observations as string | null) ?? undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

export async function fetchAnamnese(studentId: string): Promise<StudentAnamnese | null> {
  const { data, error } = await supabase
    .from('student_anamneses')
    .select('*')
    .eq('student_id', studentId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapAnamnese(data as Record<string, unknown>);
}

export async function fetchAllAnamneses(personalId: string): Promise<StudentAnamnese[]> {
  const { data, error } = await supabase
    .from('student_anamneses')
    .select('*')
    .eq('personal_id', personalId);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapAnamnese(r as Record<string, unknown>));
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export async function upsertAnamnese(
  params: Omit<StudentAnamnese, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<StudentAnamnese> {
  const payload = {
    personal_id: params.personalId,
    student_id: params.studentId,
    objective: params.objective ?? null,
    activity_level: params.activityLevel ?? null,
    has_health_issues: params.hasHealthIssues,
    health_issues: params.healthIssues ?? null,
    medications: params.medications ?? null,
    injuries: params.injuries ?? null,
    sleep_hours: params.sleepHours ?? null,
    stress_level: params.stressLevel ?? null,
    water_intake_liters: params.waterIntakeLiters ?? null,
    previous_training: params.previousTraining ?? null,
    training_years: params.trainingYears ?? null,
    preferred_days: params.preferredDays,
    preferred_time: params.preferredTime ?? null,
    observations: params.observations ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('student_anamneses')
    .upsert(payload, { onConflict: 'student_id' })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAnamnese(data as Record<string, unknown>);
}
