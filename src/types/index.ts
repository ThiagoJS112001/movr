export type UserRole = 'personal' | 'aluno';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  description?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: string; // e.g. "12" or "12-15"
  weight?: string; // e.g. "20kg" or "bodyweight"
  restSeconds: number;
  notes?: string;
  imageUrl?: string;
  videoUrl?: string;
}

export interface Workout {
  id: string;
  name: string;
  description?: string;
  personalId: string;
  exercises: WorkoutExercise[];
  createdAt: string;
}

export interface WorkoutAssignment {
  id: string;
  workoutId: string;
  workoutName: string;
  studentId: string;
  personalId: string;
  assignedAt: string;
  scheduledDays?: string[]; // e.g. ['segunda', 'quarta']
}

export interface WorkoutLog {
  id: string;
  assignmentId: string;
  workoutId: string;
  workoutName: string;
  studentId: string;
  completedAt: string;
  completedExercises: string[]; // WorkoutExercise ids completed
  exerciseWeights?: Record<string, number>; // WorkoutExercise id → kg used
  durationMinutes?: number;
  notes?: string;
}

export interface Message {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  content: string;
  sentAt: string;
  read: boolean;
}

// ── Dieta ──────────────────────────────────────────────────────────────────────
export interface FoodItem {
  id: string;
  name: string;
  quantity: string;   // e.g. "100g", "2 unidades", "1 col. sopa"
  calories?: number;
  protein?: number;   // g
  carbs?: number;     // g
  fat?: number;       // g
}

export interface Meal {
  id: string;
  name: string;       // e.g. "Café da manhã", "Almoço"
  time: string;       // e.g. "07:00"
  foods: FoodItem[];
  notes?: string;
}

export interface Diet {
  id: string;
  name: string;
  description?: string;
  personalId: string;
  meals: Meal[];
  createdAt: string;
}

export interface DietAssignment {
  id: string;
  dietId: string;
  dietName: string;
  studentId: string;
  personalId: string;
  assignedAt: string;
}
