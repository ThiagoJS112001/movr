import { supabase } from '../lib/supabase';
import type { Exercise } from '../types';

function mapExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    muscleGroup: row.muscle_group as string,
    description: (row.description as string | null) ?? undefined,
    equipment: (row.equipment as string | null) ?? undefined,
    level: (row.level as string | null) ?? undefined,
    exerciseType: (row.exercise_type as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    videoUrl: (row.video_url as string | null) ?? undefined,
    tips: (row.tips as string[] | null) ?? undefined,
    suggestedRest: (row.suggested_rest as number | null) ?? undefined,
    suggestedSets: (row.suggested_sets as number | null) ?? undefined,
    suggestedReps: (row.suggested_reps as string | null) ?? undefined,
    primaryMuscles: (row.primary_muscles as string[] | null) ?? undefined,
    secondaryMuscles: (row.secondary_muscles as string[] | null) ?? undefined,
  };
}

export async function fetchExercises(personalId: string): Promise<Exercise[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('personal_id', personalId)
    .order('name', { ascending: true });

  if (error) throw error;
  return (data ?? []).map((r) => mapExercise(r as Record<string, unknown>));
}

export async function createExercise(
  personalId: string,
  data: Omit<Exercise, 'id'>
): Promise<Exercise> {
  const { data: row, error } = await supabase
    .from('exercises')
    .insert({
      personal_id: personalId,
      name: data.name,
      muscle_group: data.muscleGroup,
      description: data.description ?? null,
      equipment: data.equipment ?? null,
      level: data.level ?? null,
      exercise_type: data.exerciseType ?? null,
      image_url: data.imageUrl ?? null,
      video_url: data.videoUrl ?? null,
      tips: data.tips ?? null,
      suggested_rest: data.suggestedRest ?? null,
      suggested_sets: data.suggestedSets ?? null,
      suggested_reps: data.suggestedReps ?? null,
      primary_muscles: data.primaryMuscles ?? null,
      secondary_muscles: data.secondaryMuscles ?? null,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return mapExercise(row as Record<string, unknown>);
}

export async function updateExercise(id: string, data: Partial<Exercise>): Promise<void> {
  const { error } = await supabase
    .from('exercises')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.muscleGroup !== undefined && { muscle_group: data.muscleGroup }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.equipment !== undefined && { equipment: data.equipment ?? null }),
      ...(data.level !== undefined && { level: data.level ?? null }),
      ...(data.exerciseType !== undefined && { exercise_type: data.exerciseType ?? null }),
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl ?? null }),
      ...(data.videoUrl !== undefined && { video_url: data.videoUrl ?? null }),
      ...(data.tips !== undefined && { tips: data.tips ?? null }),
      ...(data.suggestedRest !== undefined && { suggested_rest: data.suggestedRest ?? null }),
      ...(data.suggestedSets !== undefined && { suggested_sets: data.suggestedSets ?? null }),
      ...(data.suggestedReps !== undefined && { suggested_reps: data.suggestedReps ?? null }),
      ...(data.primaryMuscles !== undefined && { primary_muscles: data.primaryMuscles ?? null }),
      ...(data.secondaryMuscles !== undefined && { secondary_muscles: data.secondaryMuscles ?? null }),
    } as any)
    .eq('id', id);

  if (error) throw error;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}

export async function bulkCreateExercises(
  personalId: string,
  exercises: Omit<Exercise, 'id'>[],
): Promise<Exercise[]> {
  const rows = exercises.map((data) => ({
    personal_id: personalId,
    name: data.name,
    muscle_group: data.muscleGroup,
    description: data.description ?? null,
    equipment: data.equipment ?? null,
    level: data.level ?? null,
    exercise_type: data.exerciseType ?? null,
    image_url: data.imageUrl ?? null,
    video_url: data.videoUrl ?? null,
    suggested_rest: data.suggestedRest ?? null,
    suggested_sets: data.suggestedSets ?? null,
    suggested_reps: data.suggestedReps ?? null,
  }));

  const { data, error } = await supabase
    .from('exercises')
    .insert(rows as any)
    .select();

  if (error) throw error;
  return (data ?? []).map((r) => mapExercise(r as Record<string, unknown>));
}
