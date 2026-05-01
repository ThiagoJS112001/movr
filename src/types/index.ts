export type UserRole = 'personal' | 'aluno' | 'academia';
export type RolePrefix = 'PT' | 'ALN' | 'ACD';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  rolePrefix: RolePrefix;
  avatarUrl?: string;
  isBlocked?: boolean;
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
  status?: 'ativo' | 'rascunho';
  level?: 'iniciante' | 'intermediario' | 'avancado';
  durationMinutes?: number;
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
  goal?: string;
  status?: 'ativa' | 'pausada';
  personalId: string;
  meals: Meal[];
  createdAt: string;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
}

export interface DietAssignment {
  id: string;
  dietId: string;
  dietName: string;
  studentId: string;
  personalId: string;
  assignedAt: string;
}

// ── Weekly Workout Plan ────────────────────────────────────────────────────────
export interface WeeklyDay {
  dayOfWeek: string;   // 'segunda' | 'terca' | 'quarta' | 'quinta' | 'sexta' | 'sabado' | 'domingo'
  label: string;       // e.g. 'Peito', 'Costas', 'Pernas' – empty means rest day
  exerciseIds: string[];
}

export interface WeeklyPlan {
  id: string;
  studentId: string;
  personalId: string;
  days: WeeklyDay[];
  updatedAt: string;
}

export interface WeeklyPlanArchive {
  id: string;
  studentId: string;
  studentName: string;
  personalId: string;
  days: WeeklyDay[];
  archivedAt: string;
}

// ── Workout Session (new student log) ─────────────────────────────────────────
export interface WorkoutSession {
  id: string;
  studentId: string;
  dayOfWeek: string;
  label: string;
  completedExerciseIds: string[];
  durationMinutes: number;
  completedAt: string;
}

// ── Academia / Gym ─────────────────────────────────────────────────────────────
export interface GymHours {
  segunda?: string;
  terca?: string;
  quarta?: string;
  quinta?: string;
  sexta?: string;
  sabado?: string;
  domingo?: string;
}

export interface Gym {
  id: string; // same as the User.id for this academia account
  name: string;
  email: string;
  bio?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  openingHours?: GymHours;
  hasPersonal: boolean;
  hasNutrition: boolean;
  amenities: string[];
  photos: string[]; // base64 data-URLs or empty
}

export interface GymRating {
  id: string;
  gymId: string;
  userId: string;
  userName: string;
  rating: number; // 1–5
  comment?: string;
  createdAt: string;
}

// ── Social ────────────────────────────────────────────────────────────────────
export interface FriendRequest {
  id: string;
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface StudentGroup {
  id: string;
  name: string;
  memberIds: string[];
  createdBy: string;
  createdAt: string;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  fromId: string;
  fromName: string;
  content: string;
  type: 'text' | 'image' | 'offer';
  imageUrl?: string;
  offerGymId?: string;
  offerGymName?: string;
  createdAt: string;
}

// ── Student Assessments ───────────────────────────────────────────────────────
export interface StudentAssessment {
  id: string;
  studentId: string;
  personalId: string;
  date: string;          // ISO date string
  weight?: number;       // kg
  bodyFat?: number;      // %
  muscleMass?: number;   // kg
  leanMass?: number;     // kg (massa magra)
  chest?: number;        // cm (peitoral)
  waist?: number;        // cm (cintura)
  hip?: number;          // cm (quadril)
  thigh?: number;        // cm (coxa)
  arm?: number;          // cm (braço)
  calf?: number;         // cm (panturrilha)
  abdomen?: number;      // cm (abdômen)
  notes?: string;
  createdAt: string;
}
