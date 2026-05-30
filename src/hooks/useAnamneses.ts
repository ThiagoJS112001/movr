import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchAnamnese,
  fetchAllAnamneses,
  upsertAnamnese,
} from '../services/anamneses';
import { useAuth } from '../contexts/AuthContext';
import type { StudentAnamnese } from '../types';

export const anamneseKey = (studentId: string) => ['anamnese', studentId] as const;
export const allAnamnesesKey = (personalId: string) => ['anamneses', personalId] as const;

export function useAnamnese(studentId: string) {
  return useQuery({
    queryKey: anamneseKey(studentId),
    queryFn: () => fetchAnamnese(studentId),
    enabled: !!studentId,
  });
}

export function useAllAnamneses() {
  const { user } = useAuth();
  return useQuery({
    queryKey: allAnamnesesKey(user?.id ?? ''),
    queryFn: () => fetchAllAnamneses(user!.id),
    enabled: !!user?.id && user.role === 'personal',
  });
}

export function useUpsertAnamnese(studentId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (params: Omit<StudentAnamnese, 'id' | 'createdAt' | 'updatedAt'>) =>
      upsertAnamnese(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: anamneseKey(studentId) });
      qc.invalidateQueries({ queryKey: allAnamnesesKey(user?.id ?? '') });
    },
  });
}
