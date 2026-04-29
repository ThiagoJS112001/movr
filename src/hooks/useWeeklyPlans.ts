import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchWeeklyPlan,
  setWeeklyPlan,
  fetchPlanArchives,
  archiveWeeklyPlan,
  deletePlanArchive,
} from '../services/weeklyPlans';
import type { WeeklyDay } from '../types';

// ── Query Keys ────────────────────────────────────────────────────────────────

export const weeklyPlanKey = (studentId: string, personalId?: string) =>
  ['weekly_plan', studentId, personalId ?? ''] as const;

export const planArchivesKey = (personalId: string) =>
  ['plan_archives', personalId] as const;

// ── Weekly Plan ───────────────────────────────────────────────────────────────

/** For personal: fetch a student's plan (scoped to this personal). */
export function useWeeklyPlan(studentId: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: weeklyPlanKey(studentId, user?.id),
    queryFn: () => fetchWeeklyPlan(studentId, user!.id),
    enabled: !!user && !!studentId,
  });
}

/** For aluno: fetch their own plan (any personal, RLS filters by student_id). */
export function useMyWeeklyPlan() {
  const { user } = useAuth();
  return useQuery({
    queryKey: weeklyPlanKey(user?.id ?? ''),
    queryFn: () => fetchWeeklyPlan(user!.id),
    enabled: !!user && user.role === 'aluno',
  });
}

export function useSetWeeklyPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ studentId, days }: { studentId: string; days: WeeklyDay[] }) =>
      setWeeklyPlan(studentId, user!.id, days),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: weeklyPlanKey(vars.studentId, user?.id) });
    },
  });
}

// ── Plan Archives ─────────────────────────────────────────────────────────────

export function usePlanArchives() {
  const { user } = useAuth();
  return useQuery({
    queryKey: planArchivesKey(user?.id ?? ''),
    queryFn: () => fetchPlanArchives(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useArchiveWeeklyPlan() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({
      studentId,
      studentName,
      days,
    }: {
      studentId: string;
      studentName: string;
      days: WeeklyDay[];
    }) => archiveWeeklyPlan(studentId, user!.id, studentName, days),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planArchivesKey(user?.id ?? '') });
    },
  });
}

export function useDeletePlanArchive() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deletePlanArchive(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: planArchivesKey(user?.id ?? '') });
    },
  });
}
