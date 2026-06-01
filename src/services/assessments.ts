import { supabase } from '../lib/supabase';
import type { StudentAssessment } from '../types';

// ── Mapper ────────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapAssessment(row: any): StudentAssessment {
  return {
    id:          row.id,
    studentId:   row.student_id,
    personalId:  row.personal_id,
    date:        row.date,
    weight:      row.weight      ?? undefined,
    bodyFat:     row.body_fat    ?? undefined,
    muscleMass:  row.muscle_mass ?? undefined,
    leanMass:    row.lean_mass   ?? undefined,
    chest:       row.chest       ?? undefined,
    waist:       row.waist       ?? undefined,
    hip:         row.hip         ?? undefined,
    thigh:       row.thigh       ?? undefined,
    arm:         row.arm         ?? undefined,
    calf:        row.calf        ?? undefined,
    abdomen:     row.abdomen     ?? undefined,
    notes:       row.notes       ?? undefined,
    createdAt:   row.created_at,
  };
}

// ── Queries ───────────────────────────────────────────────────────────────────

/** Personal: fetch all assessments for a specific student. */
export async function fetchAssessments(
  studentId: string,
  personalId: string,
): Promise<StudentAssessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', studentId)
    .eq('personal_id', personalId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAssessment);
}

/** Aluno: fetch their own assessments (any personal — RLS filters by student_id). */
export async function fetchMyAssessments(studentId: string): Promise<StudentAssessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('student_id', studentId)
    .order('date', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapAssessment);
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface CreateAssessmentData {
  studentId:  string;
  personalId: string;
  date:       string;
  weight?:      number;
  bodyFat?:     number;
  muscleMass?:  number;
  leanMass?:    number;
  chest?:       number;
  waist?:       number;
  hip?:         number;
  thigh?:       number;
  arm?:         number;
  calf?:        number;
  abdomen?:     number;
  notes?:       string;
}

export async function createAssessment(data: CreateAssessmentData): Promise<void> {
  const { error } = await supabase.from('assessments').insert({
    student_id:  data.studentId,
    personal_id: data.personalId,
    date:        data.date,
    weight:      data.weight      ?? null,
    body_fat:    data.bodyFat     ?? null,
    muscle_mass: data.muscleMass  ?? null,
    lean_mass:   data.leanMass    ?? null,
    chest:       data.chest       ?? null,
    waist:       data.waist       ?? null,
    hip:         data.hip         ?? null,
    thigh:       data.thigh       ?? null,
    arm:         data.arm         ?? null,
    calf:        data.calf        ?? null,
    abdomen:     data.abdomen     ?? null,
    notes:       data.notes       ?? null,
  });
  if (error) throw error;
}

export type UpdateAssessmentData = Partial<Omit<CreateAssessmentData, 'studentId' | 'personalId'>>;

export async function updateAssessment(id: string, data: UpdateAssessmentData): Promise<void> {
  const { error } = await supabase.from('assessments').update({
    ...(data.date       !== undefined && { date:        data.date }),
    ...(data.weight     !== undefined && { weight:      data.weight     ?? null }),
    ...(data.bodyFat    !== undefined && { body_fat:    data.bodyFat    ?? null }),
    ...(data.muscleMass !== undefined && { muscle_mass: data.muscleMass ?? null }),
    ...(data.leanMass   !== undefined && { lean_mass:   data.leanMass   ?? null }),
    ...(data.chest      !== undefined && { chest:       data.chest      ?? null }),
    ...(data.waist      !== undefined && { waist:       data.waist      ?? null }),
    ...(data.hip        !== undefined && { hip:         data.hip        ?? null }),
    ...(data.thigh      !== undefined && { thigh:       data.thigh      ?? null }),
    ...(data.arm        !== undefined && { arm:         data.arm        ?? null }),
    ...(data.calf       !== undefined && { calf:        data.calf       ?? null }),
    ...(data.abdomen    !== undefined && { abdomen:     data.abdomen    ?? null }),
    ...(data.notes      !== undefined && { notes:       data.notes      ?? null }),
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteAssessment(id: string): Promise<void> {
  const { error } = await supabase.from('assessments').delete().eq('id', id);
  if (error) throw error;
}
