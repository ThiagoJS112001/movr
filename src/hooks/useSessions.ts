import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSessions,
  createSession,
  updateSessionStatus,
  deleteSession,
} from '../services/sessions';
import { useAuth } from '../contexts/AuthContext';
import type { SessionStatus } from '../types';

export const sessionsKey = (personalId: string) => ['sessions', personalId] as const;

export function useSessions() {
  const { user } = useAuth();
  return useQuery({
    queryKey: sessionsKey(user?.id ?? ''),
    queryFn: () => fetchSessions(user!.id),
    enabled: !!user?.id && user.role === 'personal',
  });
}

export function useCreateSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: {
      studentId: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      notes?: string;
    }) => createSession({ ...params, personalId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKey(user?.id ?? '') });
    },
  });
}

export function useUpdateSessionStatus() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: SessionStatus }) =>
      updateSessionStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKey(user?.id ?? '') });
    },
  });
}

export function useDeleteSession() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: sessionsKey(user?.id ?? '') });
    },
  });
}
