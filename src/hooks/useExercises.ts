import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchExercises,
  createExercise,
  updateExercise,
  deleteExercise,
  bulkCreateExercises,
} from '../services/exercises';
import type { Exercise } from '../types';

export const exercisesKey = (personalId: string) => ['exercises', personalId] as const;

export function useExercises() {
  const { user } = useAuth();
  return useQuery({
    queryKey: exercisesKey(user?.id ?? ''),
    queryFn: () => fetchExercises(user!.id),
    enabled: !!user && user.role === 'personal',
    staleTime: 5 * 60 * 1000, // 5 minutes – avoid unnecessary refetches
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<Exercise, 'id'>) => createExercise(user!.id, data),
    onMutate: async (data) => {
      const key = exercisesKey(user?.id ?? '');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Exercise[]>(key);
      qc.setQueryData<Exercise[]>(key, (old = []) => [
        ...old,
        { ...data, id: `temp-${Date.now()}` },
      ]);
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(exercisesKey(user?.id ?? ''), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}

export function useUpdateExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Exercise> }) =>
      updateExercise(id, data),
    onMutate: async ({ id, data }) => {
      const key = exercisesKey(user?.id ?? '');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Exercise[]>(key);
      qc.setQueryData<Exercise[]>(key, (old = []) =>
        old.map((ex) => (ex.id === id ? { ...ex, ...data } : ex)),
      );
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(exercisesKey(user?.id ?? ''), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}

export function useDeleteExercise() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteExercise(id),
    onMutate: async (id) => {
      const key = exercisesKey(user?.id ?? '');
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Exercise[]>(key);
      qc.setQueryData<Exercise[]>(key, (old = []) => old.filter((ex) => ex.id !== id));
      return { previous };
    },
    onError: (_err, _data, ctx) => {
      if (ctx?.previous !== undefined)
        qc.setQueryData(exercisesKey(user?.id ?? ''), ctx.previous);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}

export function useBulkCreateExercises() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (exercises: Omit<Exercise, 'id'>[]) =>
      bulkCreateExercises(user!.id, exercises),
    onSettled: () => qc.invalidateQueries({ queryKey: exercisesKey(user?.id ?? '') }),
  });
}