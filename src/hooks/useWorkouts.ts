import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import {
  fetchWorkouts,
  fetchWorkoutById,
  fetchWorkoutsByIds,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  addExerciseToWorkout,
  updateExerciseInWorkout,
  removeExerciseFromWorkout,
  fetchAssignments,
  fetchStudentAssignments,
  assignWorkout,
  updateAssignment,
  removeAssignment,
  addWorkoutLog,
  fetchWorkoutLogs,
  fetchWorkoutLogsForPersonal,
} from '../services/workouts';
import type { Workout, WorkoutExercise, WorkoutAssignment, WorkoutLog } from '../types';

// ── Query Keys ─────────────────────────────────────────────────────────────────

export const workoutsKey = (personalId: string) => ['workouts', personalId] as const;
export const workoutKey = (id: string) => ['workout', id] as const;
export const assignmentsKey = (personalId: string) => ['assignments', 'personal', personalId] as const;
export const studentAssignmentsKey = (studentId: string) => ['assignments', 'student', studentId] as const;

// ── Personal Workouts ─────────────────────────────────────────────────────────

export function useWorkouts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: workoutsKey(user?.id ?? ''),
    queryFn: () => fetchWorkouts(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    queryKey: workoutKey(id ?? ''),
    queryFn: () => fetchWorkoutById(id!),
    enabled: !!id,
  });
}

export function useCreateWorkout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<Workout, 'id' | 'createdAt' | 'exercises'>) => createWorkout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutsKey(user?.id ?? '') });
    },
  });
}

export function useUpdateWorkout(workoutId: string) {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Partial<Omit<Workout, 'exercises'>>) => updateWorkout(workoutId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutKey(workoutId) });
      qc.invalidateQueries({ queryKey: workoutsKey(user?.id ?? '') });
    },
  });
}

export function useDeleteWorkout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => deleteWorkout(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: workoutsKey(user?.id ?? '') });
    },
  });
}

// ── Exercises within workout ──────────────────────────────────────────────────

export function useAddExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ex: Omit<WorkoutExercise, 'id'>) => addExerciseToWorkout(workoutId, ex),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKey(workoutId) }),
  });
}

export function useUpdateExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ exerciseId, data }: { exerciseId: string; data: Partial<WorkoutExercise> }) =>
      updateExerciseInWorkout(workoutId, exerciseId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKey(workoutId) }),
  });
}

export function useRemoveExercise(workoutId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (exerciseId: string) => removeExerciseFromWorkout(workoutId, exerciseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: workoutKey(workoutId) }),
  });
}

// ── Assignments ────────────────────────────────────────────────────────────────

export function useAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: assignmentsKey(user?.id ?? ''),
    queryFn: () => fetchAssignments(user!.id),
    enabled: !!user && user.role === 'personal',
  });
}

export function useStudentAssignments() {
  const { user } = useAuth();
  return useQuery({
    queryKey: studentAssignmentsKey(user?.id ?? ''),
    queryFn: () => fetchStudentAssignments(user!.id),
    enabled: !!user && user.role === 'aluno',
  });
}

export function useStudentWorkouts(workoutIds: string[]) {
  return useQuery({
    queryKey: ['student_workouts', [...workoutIds].sort().join(',')],
    queryFn: () => fetchWorkoutsByIds(workoutIds),
    enabled: workoutIds.length > 0,
  });
}

export function useAssignWorkout() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (data: Omit<WorkoutAssignment, 'id' | 'assignedAt'>) => assignWorkout(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentsKey(user?.id ?? '') });
    },
  });
}

export function useUpdateAssignment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkoutAssignment> }) =>
      updateAssignment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentsKey(user?.id ?? '') });
    },
  });
}

export function useRemoveAssignment() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (id: string) => removeAssignment(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: assignmentsKey(user?.id ?? '') });
    },
  });
}

// ── Workout Logs ───────────────────────────────────────────────────────────────

export const workoutLogsKey = (studentId: string) => ['workout_logs', 'student', studentId] as const;
export const personalWorkoutLogsKey = (personalId: string) => ['workout_logs', 'personal', personalId] as const;

export function useWorkoutLogs(studentId: string) {
  return useQuery({
    queryKey: workoutLogsKey(studentId),
    queryFn: () => fetchWorkoutLogs(studentId),
    enabled: !!studentId,
  });
}

export function usePersonalWorkoutLogs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const students: { id: string }[] = qc.getQueryData(['students', user?.id ?? '']) ?? [];
  const studentIds = students.map((s) => s.id);
  return useQuery({
    queryKey: personalWorkoutLogsKey(user?.id ?? ''),
    queryFn: () => fetchWorkoutLogsForPersonal(studentIds),
    enabled: !!user && user.role === 'personal',
  });
}

export function useAddWorkoutLog() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: (log: Omit<WorkoutLog, 'id'>) => addWorkoutLog(log),
    onSuccess: (_data, log) => {
      qc.invalidateQueries({ queryKey: workoutLogsKey(log.studentId) });
      qc.invalidateQueries({ queryKey: personalWorkoutLogsKey(user?.id ?? '') });
    },
  });
}
