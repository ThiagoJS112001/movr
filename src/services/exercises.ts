import { supabase } from '../lib/supabase';
import type { Exercise } from '../types';

function mapExercise(row: Record<string, unknown>): Exercise {
  return {
    id: row.id as string,
    name: row.name as string,
    muscleGroup: row.muscle_group as string,
    description: (row.description as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    videoUrl: (row.video_url as string | null) ?? undefined,
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
      image_url: data.imageUrl ?? null,
      video_url: data.videoUrl ?? null,
    })
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
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl ?? null }),
      ...(data.videoUrl !== undefined && { video_url: data.videoUrl ?? null }),
    })
    .eq('id', id);

  if (error) throw error;
}

export async function deleteExercise(id: string): Promise<void> {
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  if (error) throw error;
}
