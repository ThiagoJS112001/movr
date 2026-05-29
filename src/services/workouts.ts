import { supabase } from '../lib/supabase';
import type { Workout, WorkoutAssignment, WorkoutExercise, WorkoutLog } from '../types';

// ── Mappers ────────────────────────────────────────────────────────────────────

function mapWorkout(row: Record<string, unknown>, exercises: WorkoutExercise[] = []): Workout {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string | null) ?? undefined,
    personalId: row.personal_id as string,
    status: (row.status as Workout['status']) ?? 'ativo',
    level: (row.level as Workout['level']) ?? undefined,
    durationMinutes: (row.duration_minutes as number | null) ?? undefined,
    createdAt: row.created_at as string,
    exercises,
  };
}

function mapExercise(row: Record<string, unknown>): WorkoutExercise {
  // Support joined exercises table: row.exercises may be { muscle_group: string }
  const joined = row.exercises as Record<string, unknown> | null | undefined;
  return {
    id: row.id as string,
    exerciseId: (row.exercise_id as string | null) ?? '',
    exerciseName: row.exercise_name as string,
    muscleGroup: (joined?.muscle_group as string | null) ?? undefined,
    sets: row.sets as number,
    reps: row.reps as string,
    weight: (row.weight as string | null) ?? undefined,
    restSeconds: row.rest_seconds as number,
    notes: (row.notes as string | null) ?? undefined,
    imageUrl: (row.image_url as string | null) ?? undefined,
    videoUrl: (row.video_url as string | null) ?? undefined,
  };
}

function mapAssignment(row: Record<string, unknown>): WorkoutAssignment {
  return {
    id: row.id as string,
    workoutId: row.workout_id as string,
    workoutName: row.workout_name as string,
    studentId: row.student_id as string,
    personalId: row.personal_id as string,
    assignedAt: row.assigned_at as string,
    scheduledDays: (row.scheduled_days as string[]) ?? [],
  };
}

// ── Workouts ───────────────────────────────────────────────────────────────────

export async function fetchWorkouts(personalId: string): Promise<Workout[]> {
  const { data: workoutRows, error: wErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('personal_id', personalId)
    .order('created_at', { ascending: false });

  if (wErr) throw new Error(wErr.message);
  if (!workoutRows || workoutRows.length === 0) return [];

  const workoutIds = workoutRows.map((w) => w.id);

  const { data: exRows, error: exErr } = await supabase
    .from('workout_exercises')
    .select('*, exercises(muscle_group)')
    .in('workout_id', workoutIds)
    .order('order_index', { ascending: true });

  if (exErr) throw new Error(exErr.message);

  return workoutRows.map((w) => {
    const exercises = (exRows ?? [])
      .filter((e) => e.workout_id === w.id)
      .map((e) => mapExercise(e as Record<string, unknown>));
    return mapWorkout(w as Record<string, unknown>, exercises);
  });
}

export async function fetchWorkoutById(id: string): Promise<Workout | null> {
  const { data: w, error: wErr } = await supabase
    .from('workouts')
    .select('*')
    .eq('id', id)
    .single();

  if (wErr) return null;

  const { data: exRows } = await supabase
    .from('workout_exercises')
    .select('*, exercises(muscle_group)')
    .eq('workout_id', id)
    .order('order_index', { ascending: true });

  const exercises = (exRows ?? []).map((e) => mapExercise(e as Record<string, unknown>));
  return mapWorkout(w as Record<string, unknown>, exercises);
}

export async function fetchWorkoutsByIds(ids: string[]): Promise<Workout[]> {
  if (!ids.length) return [];

  const { data: workoutRows, error: wErr } = await supabase
    .from('workouts')
    .select('*')
    .in('id', ids);

  if (wErr) throw new Error(wErr.message);
  if (!workoutRows?.length) return [];

  const { data: exRows, error: exErr } = await supabase
    .from('workout_exercises')
    .select('*, exercises(muscle_group)')
    .in('workout_id', ids)
    .order('order_index', { ascending: true });

  if (exErr) throw new Error(exErr.message);

  return workoutRows.map((w) => {
    const exercises = (exRows ?? [])
      .filter((e) => e.workout_id === w.id)
      .map((e) => mapExercise(e as Record<string, unknown>));
    return mapWorkout(w as Record<string, unknown>, exercises);
  });
}

export async function createWorkout(
  data: Omit<Workout, 'id' | 'createdAt' | 'exercises'>
): Promise<Workout> {
  const { data: row, error } = await supabase
    .from('workouts')
    .insert({
      name: data.name,
      description: data.description ?? null,
      personal_id: data.personalId,
      status: data.status ?? 'ativo',
      level: data.level ?? null,
      duration_minutes: data.durationMinutes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapWorkout(row as Record<string, unknown>, []);
}

export async function updateWorkout(id: string, data: Partial<Omit<Workout, 'exercises'>>): Promise<void> {
  const { error } = await supabase
    .from('workouts')
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description ?? null }),
      ...(data.status !== undefined && { status: data.status }),
      ...(data.level !== undefined && { level: data.level ?? null }),
      ...(data.durationMinutes !== undefined && { duration_minutes: data.durationMinutes ?? null }),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function deleteWorkout(id: string): Promise<void> {
  const { error } = await supabase.from('workouts').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Workout Exercises ──────────────────────────────────────────────────────────

export async function addExerciseToWorkout(
  workoutId: string,
  ex: Omit<WorkoutExercise, 'id'>
): Promise<WorkoutExercise> {
  const { count } = await supabase
    .from('workout_exercises')
    .select('*', { count: 'exact', head: true })
    .eq('workout_id', workoutId);

  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({
      workout_id: workoutId,
      exercise_id: ex.exerciseId || null,
      exercise_name: ex.exerciseName,
      sets: ex.sets,
      reps: ex.reps,
      weight: ex.weight ?? null,
      rest_seconds: ex.restSeconds,
      notes: ex.notes ?? null,
      image_url: ex.imageUrl ?? null,
      video_url: ex.videoUrl ?? null,
      order_index: count ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapExercise(data as Record<string, unknown>);
}

export async function updateExerciseInWorkout(
  workoutId: string,
  exerciseId: string,
  data: Partial<WorkoutExercise>
): Promise<void> {
  const { error } = await supabase
    .from('workout_exercises')
    .update({
      ...(data.exerciseName !== undefined && { exercise_name: data.exerciseName }),
      ...(data.sets !== undefined && { sets: data.sets }),
      ...(data.reps !== undefined && { reps: data.reps }),
      ...(data.weight !== undefined && { weight: data.weight ?? null }),
      ...(data.restSeconds !== undefined && { rest_seconds: data.restSeconds }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
      ...(data.imageUrl !== undefined && { image_url: data.imageUrl ?? null }),
      ...(data.videoUrl !== undefined && { video_url: data.videoUrl ?? null }),
    })
    .eq('id', exerciseId)
    .eq('workout_id', workoutId);

  if (error) throw new Error(error.message);
}

export async function removeExerciseFromWorkout(
  workoutId: string,
  exerciseId: string
): Promise<void> {
  const { error } = await supabase
    .from('workout_exercises')
    .delete()
    .eq('id', exerciseId)
    .eq('workout_id', workoutId);

  if (error) throw new Error(error.message);
}

// ── Assignments ────────────────────────────────────────────────────────────────

export async function fetchAssignments(personalId: string): Promise<WorkoutAssignment[]> {
  const { data, error } = await supabase
    .from('workout_assignments')
    .select('*')
    .eq('personal_id', personalId)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapAssignment(r as Record<string, unknown>));
}

export async function fetchStudentAssignments(studentId: string): Promise<WorkoutAssignment[]> {
  const { data, error } = await supabase
    .from('workout_assignments')
    .select('*')
    .eq('student_id', studentId)
    .order('assigned_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => mapAssignment(r as Record<string, unknown>));
}

export async function assignWorkout(
  data: Omit<WorkoutAssignment, 'id' | 'assignedAt'>
): Promise<WorkoutAssignment> {
  const { data: row, error } = await supabase
    .from('workout_assignments')
    .insert({
      workout_id: data.workoutId,
      workout_name: data.workoutName,
      student_id: data.studentId,
      personal_id: data.personalId,
      scheduled_days: data.scheduledDays ?? [],
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapAssignment(row as Record<string, unknown>);
}

export async function updateAssignment(
  id: string,
  data: Partial<WorkoutAssignment>
): Promise<void> {
  const { error } = await supabase
    .from('workout_assignments')
    .update({
      ...(data.scheduledDays !== undefined && { scheduled_days: data.scheduledDays }),
      ...(data.workoutName !== undefined && { workout_name: data.workoutName }),
    })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function removeAssignment(id: string): Promise<void> {
  const { error } = await supabase.from('workout_assignments').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Workout Logs ──────────────────────────────────────────────────────────────

export async function addWorkoutLog(log: Omit<WorkoutLog, 'id'>): Promise<void> {
  const { error } = await supabase.from('workout_logs').insert({
    assignment_id: log.assignmentId ?? null,
    workout_id: log.workoutId ?? null,
    workout_name: log.workoutName,
    student_id: log.studentId,
    completed_at: log.completedAt,
    completed_exercises: log.completedExercises,
    exercise_weights: (log.exerciseWeights as Record<string, unknown>) ?? {},
    duration_minutes: log.durationMinutes ?? null,
    notes: log.notes ?? null,
  });
  if (error) throw new Error(error.message);
}

export async function fetchWorkoutLogs(studentId: string): Promise<WorkoutLog[]> {
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .eq('student_id', studentId)
    .order('completed_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    assignmentId: r.assignment_id ?? '',
    workoutId: r.workout_id ?? '',
    workoutName: r.workout_name,
    studentId: r.student_id,
    completedAt: r.completed_at,
    completedExercises: r.completed_exercises ?? [],
    exerciseWeights: (r.exercise_weights as Record<string, number>) ?? {},
    durationMinutes: r.duration_minutes ?? undefined,
    notes: r.notes ?? undefined,
  }));
}

export async function fetchWorkoutLogsForPersonal(studentIds: string[]): Promise<WorkoutLog[]> {
  if (studentIds.length === 0) return [];
  const { data, error } = await supabase
    .from('workout_logs')
    .select('*')
    .in('student_id', studentIds)
    .order('completed_at', { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => ({
    id: r.id,
    assignmentId: r.assignment_id ?? '',
    workoutId: r.workout_id ?? '',
    workoutName: r.workout_name,
    studentId: r.student_id,
    completedAt: r.completed_at,
    completedExercises: r.completed_exercises ?? [],
    exerciseWeights: (r.exercise_weights as Record<string, number>) ?? {},
    durationMinutes: r.duration_minutes ?? undefined,
    notes: r.notes ?? undefined,
  }));
}
