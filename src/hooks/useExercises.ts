import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
} from '../services/exercises';
import type { Exercise } from '../types';

export const exercisesKey = (personalId: string) => ['exercises', personalId] as const;

export function useExercises() {
  const { user } = useAuth();
  return useQuery({
    queryKey: exercisesKey(user?.id ?? ''),
    queryFn: () => fetchExercises(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) => createExercise(user!.id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      updateExercise(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}
