import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchAssessments,
  fetchMyAssessments,
  createAssessment,
  deleteAssessment,
  type CreateAssessmentData,
} from '../services/assessments';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const assessmentsKey = (studentId: string, personalId: string) =>
  ['assessments', studentId, personalId] as const;

export const myAssessmentsKey = (studentId: string) =>
  ['assessments', 'my', studentId] as const;

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Personal: fetch assessments for a specific student. */
export function useAssessments(studentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: assessmentsKey(studentId, user?.id ?? ''),
    queryFn: () => fetchAssessments(studentId, user!.id),
    enabled: !!user && !!studentId,
  });
}

/** Aluno: fetch their own assessments. */
export function useMyAssessments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: myAssessmentsKey(user?.id ?? ''),
    queryFn: () => fetchMyAssessments(user!.id),
    enabled: !!user && user.role === 'aluno',
  });
}

export function useCreateAssessment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: CreateAssessmentData) => createAssessment(data),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({
        queryKey: assessmentsKey(vars.studentId, user?.id ?? ''),
      });
    },
  });
}

export function useDeleteAssessment(studentId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteAssessment(id),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: assessmentsKey(studentId, user?.id ?? ''),
      });
    },
  });
}
