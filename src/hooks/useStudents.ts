import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchStudents,
  createStudent,
  setStudentBlocked,
  searchAlunoByEmail,
  inviteExistingStudent,
  confirmStudentConnection,
  rejectStudentConnection,
} from '../services/students';
import { useAuth } from '../contexts/AuthContext';

export const studentsKey = (personalId: string) => ['students', personalId] as const;

// ── Queries ───────────────────────────────────────────────────────────────────

export function useStudents() {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentsKey(user?.id ?? ''),
    queryFn: () => fetchStudents(user!.id),
    enabled: !!user?.id && user.role === 'personal',
  });
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateStudent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { name: string; email: string; password: string }) =>
      createStudent({ ...params, personalId: user!.id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKey(user?.id ?? '') });
    },
  });
}

export function useBlockStudent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ studentId, blocked }: { studentId: string; blocked: boolean }) =>
      setStudentBlocked(studentId, blocked),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKey(user?.id ?? '') });
    },
  });
}

/** Search an existing aluno by email (one-shot query triggered manually). */
export function useSearchAluno() {
  return useMutation({
    mutationFn: (email: string) => searchAlunoByEmail(email),
  });
}

/** Invite an existing Movr aluno — sets pending connection. */
export function useInviteStudent() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => inviteExistingStudent(studentId, user!.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: studentsKey(user?.id ?? '') });
    },
  });
}

/** Aluno confirms the pending connection with their personal. */
export function useConfirmConnection() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => confirmStudentConnection(user!.id),
  });
}

/** Aluno rejects the pending connection (clears personal_id). */
export function useRejectConnection() {
  const { user } = useAuth();
  return useMutation({
    mutationFn: () => rejectStudentConnection(user!.id),
  });
}
