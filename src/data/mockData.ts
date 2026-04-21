import { v4 as uuidv4 } from 'uuid';
import type {
  User,
  Workout,
  WorkoutAssignment,
  WorkoutLog,
  Message,
  Exercise,
  Diet,
  DietAssignment,
} from '../types';

// ── Usuários ──────────────────────────────────────────────────────────────────
export const MOCK_USERS: User[] = [
  {
    id: 'personal-1',
    name: 'Carlos Silva',
    email: 'carlos@personal.com',
    role: 'personal',
  },
  {
    id: 'aluno-1',
    name: 'Ana Souza',
    email: 'ana@aluno.com',
    role: 'aluno',
  },
  {
    id: 'aluno-2',
    name: 'Bruno Ramos',
    email: 'bruno@aluno.com',
    role: 'aluno',
  },
  {
    id: 'aluno-3',
    name: 'Fernanda Lima',
    email: 'fernanda@aluno.com',
    role: 'aluno',
  },
];

// Senha padrão para todos (apenas mock): 123456
export const MOCK_PASSWORDS: Record<string, string> = {
  'carlos@personal.com': '123456',
  'ana@aluno.com': '123456',
  'bruno@aluno.com': '123456',
  'fernanda@aluno.com': '123456',
};

// ── Exercícios ────────────────────────────────────────────────────────────────
export const MOCK_EXERCISES: Exercise[] = [
  { id: 'ex-1', name: 'Supino Reto', muscleGroup: 'Peito' },
  { id: 'ex-2', name: 'Agachamento Livre', muscleGroup: 'Pernas' },
  { id: 'ex-3', name: 'Remada Curvada', muscleGroup: 'Costas' },
  { id: 'ex-4', name: 'Desenvolvimento', muscleGroup: 'Ombros' },
  { id: 'ex-5', name: 'Rosca Direta', muscleGroup: 'Bíceps' },
  { id: 'ex-6', name: 'Tríceps Testa', muscleGroup: 'Tríceps' },
  { id: 'ex-7', name: 'Leg Press', muscleGroup: 'Pernas' },
  { id: 'ex-8', name: 'Puxada Frente', muscleGroup: 'Costas' },
  { id: 'ex-9', name: 'Elevação Lateral', muscleGroup: 'Ombros' },
  { id: 'ex-10', name: 'Cadeira Extensora', muscleGroup: 'Pernas' },
  { id: 'ex-11', name: 'Mesa Flexora', muscleGroup: 'Pernas' },
  { id: 'ex-12', name: 'Panturrilha em Pé', muscleGroup: 'Panturrilha' },
  { id: 'ex-13', name: 'Abdominal Crunch', muscleGroup: 'Abdômen' },
  { id: 'ex-14', name: 'Prancha', muscleGroup: 'Abdômen' },
];

// ── Treinos ───────────────────────────────────────────────────────────────────
export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'workout-1',
    name: 'Treino A – Peito e Tríceps',
    description: 'Foco em força e hipertrofia de peito e tríceps.',
    personalId: 'personal-1',
    createdAt: '2026-04-01T10:00:00Z',
    exercises: [
      {
        id: 'we-1-1',
        exerciseId: 'ex-1',
        exerciseName: 'Supino Reto',
        sets: 4,
        reps: '10-12',
        weight: '60kg',
        restSeconds: 90,
        notes: 'Manter escápulas retraídas',
      },
      {
        id: 'we-1-2',
        exerciseId: 'ex-6',
        exerciseName: 'Tríceps Testa',
        sets: 3,
        reps: '12',
        weight: '30kg',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'workout-2',
    name: 'Treino B – Costas e Bíceps',
    description: 'Foco em força e hipertrofia de costas e bíceps.',
    personalId: 'personal-1',
    createdAt: '2026-04-01T10:30:00Z',
    exercises: [
      {
        id: 'we-2-1',
        exerciseId: 'ex-3',
        exerciseName: 'Remada Curvada',
        sets: 4,
        reps: '10',
        weight: '50kg',
        restSeconds: 90,
      },
      {
        id: 'we-2-2',
        exerciseId: 'ex-8',
        exerciseName: 'Puxada Frente',
        sets: 3,
        reps: '12',
        weight: '55kg',
        restSeconds: 60,
      },
      {
        id: 'we-2-3',
        exerciseId: 'ex-5',
        exerciseName: 'Rosca Direta',
        sets: 3,
        reps: '12',
        weight: '20kg',
        restSeconds: 60,
      },
    ],
  },
  {
    id: 'workout-3',
    name: 'Treino C – Pernas',
    description: 'Foco em força e hipertrofia de quadríceps, posterior e panturrilha.',
    personalId: 'personal-1',
    createdAt: '2026-04-01T11:00:00Z',
    exercises: [
      {
        id: 'we-3-1',
        exerciseId: 'ex-2',
        exerciseName: 'Agachamento Livre',
        sets: 4,
        reps: '10',
        weight: '80kg',
        restSeconds: 120,
      },
      {
        id: 'we-3-2',
        exerciseId: 'ex-7',
        exerciseName: 'Leg Press',
        sets: 3,
        reps: '12',
        weight: '120kg',
        restSeconds: 90,
      },
      {
        id: 'we-3-3',
        exerciseId: 'ex-11',
        exerciseName: 'Mesa Flexora',
        sets: 3,
        reps: '12',
        weight: '40kg',
        restSeconds: 60,
      },
      {
        id: 'we-3-4',
        exerciseId: 'ex-12',
        exerciseName: 'Panturrilha em Pé',
        sets: 4,
        reps: '20',
        weight: 'corporal',
        restSeconds: 45,
      },
    ],
  },
];

// ── Atribuições ───────────────────────────────────────────────────────────────
export const MOCK_ASSIGNMENTS: WorkoutAssignment[] = [
  {
    id: 'assign-1',
    workoutId: 'workout-1',
    workoutName: 'Treino A – Peito e Tríceps',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2026-04-10T08:00:00Z',
    scheduledDays: ['segunda', 'quinta'],
  },
  {
    id: 'assign-2',
    workoutId: 'workout-2',
    workoutName: 'Treino B – Costas e Bíceps',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2026-04-10T08:00:00Z',
    scheduledDays: ['terça', 'sexta'],
  },
  {
    id: 'assign-3',
    workoutId: 'workout-3',
    workoutName: 'Treino C – Pernas',
    studentId: 'aluno-2',
    personalId: 'personal-1',
    assignedAt: '2026-04-12T09:00:00Z',
    scheduledDays: ['quarta', 'sábado'],
  },
];

// ── Histórico ─────────────────────────────────────────────────────────────────
export const MOCK_LOGS: WorkoutLog[] = [
  // ── Ana (aluno-1) ──────────────────────────────────────────────────────────
  // week 02/03
  { id: 'log-1',  assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-03-03T10:00:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 48,  exerciseWeights: { 'we-1-1': 55,   'we-1-2': 28   } },
  // week 09/03
  { id: 'log-2',  assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-03-10T09:00:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 58, exerciseWeights: { 'we-2-1': 45,   'we-2-2': 50,   'we-2-3': 18   } },
  { id: 'log-3',  assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-03-12T10:30:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 50,  exerciseWeights: { 'we-1-1': 57.5, 'we-1-2': 30   } },
  // week 16/03
  { id: 'log-4',  assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-03-17T09:30:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 62, exerciseWeights: { 'we-2-1': 47.5, 'we-2-2': 52.5, 'we-2-3': 20   } },
  // week 23/03
  { id: 'log-5',  assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-03-24T10:00:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 53,  exerciseWeights: { 'we-1-1': 60,   'we-1-2': 30   } },
  // week 30/03
  { id: 'log-6',  assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-03-31T09:00:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 57, exerciseWeights: { 'we-2-1': 50,   'we-2-2': 55,   'we-2-3': 20   } },
  { id: 'log-7',  assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-04-02T10:30:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 51,  exerciseWeights: { 'we-1-1': 60,   'we-1-2': 32.5 } },
  // week 06/04
  { id: 'log-8',  assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-04-07T09:30:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 59, exerciseWeights: { 'we-2-1': 50,   'we-2-2': 57.5, 'we-2-3': 22.5 } },
  { id: 'log-9',  assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-04-09T10:00:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 54,  exerciseWeights: { 'we-1-1': 62.5, 'we-1-2': 32.5 } },
  // week 13/04
  { id: 'log-10', assignmentId: 'assign-1', workoutId: 'workout-1', workoutName: 'Treino A – Peito e Tríceps', studentId: 'aluno-1', completedAt: '2026-04-14T10:00:00Z', completedExercises: ['we-1-1','we-1-2'], durationMinutes: 55,  exerciseWeights: { 'we-1-1': 65,   'we-1-2': 35   } },
  { id: 'log-11', assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-04-15T09:30:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 60, exerciseWeights: { 'we-2-1': 52.5, 'we-2-2': 57.5, 'we-2-3': 22.5 } },
  // week 20/04
  { id: 'log-12', assignmentId: 'assign-2', workoutId: 'workout-2', workoutName: 'Treino B – Costas e Bíceps', studentId: 'aluno-1', completedAt: '2026-04-20T08:30:00Z', completedExercises: ['we-2-1','we-2-2','we-2-3'], durationMinutes: 61, exerciseWeights: { 'we-2-1': 52.5, 'we-2-2': 60,   'we-2-3': 25   } },

  // ── Bruno (aluno-2) ────────────────────────────────────────────────────────
  // week 02/03
  { id: 'log-13', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-03-04T15:00:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 65, exerciseWeights: { 'we-3-1': 70,   'we-3-2': 110 } },
  // week 23/03
  { id: 'log-14', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-03-25T15:00:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 70, exerciseWeights: { 'we-3-1': 75,   'we-3-2': 115 } },
  // week 30/03
  { id: 'log-15', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-04-01T15:30:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 68, exerciseWeights: { 'we-3-1': 77.5, 'we-3-2': 120 } },
  // week 06/04
  { id: 'log-16', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-04-08T15:00:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 72, exerciseWeights: { 'we-3-1': 80,   'we-3-2': 125 } },
  // week 13/04
  { id: 'log-17', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-04-16T15:00:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 65, exerciseWeights: { 'we-3-1': 82.5, 'we-3-2': 125 } },
  // week 20/04
  { id: 'log-18', assignmentId: 'assign-3', workoutId: 'workout-3', workoutName: 'Treino C – Pernas', studentId: 'aluno-2', completedAt: '2026-04-20T14:00:00Z', completedExercises: ['we-3-1','we-3-2','we-3-3','we-3-4'], durationMinutes: 67, exerciseWeights: { 'we-3-1': 85,   'we-3-2': 130 } },
];

// ── Mensagens ─────────────────────────────────────────────────────────────────
export const MOCK_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    fromId: 'personal-1',
    fromName: 'Carlos Silva',
    toId: 'aluno-1',
    content: 'Oi Ana! Lembra de focar na técnica no supino hoje 💪',
    sentAt: '2026-04-18T08:00:00Z',
    read: true,
  },
  {
    id: 'msg-2',
    fromId: 'aluno-1',
    fromName: 'Ana Souza',
    toId: 'personal-1',
    content: 'Oi Carlos! Treinei ontem, ficou ótimo!',
    sentAt: '2026-04-18T18:00:00Z',
    read: false,
  },
];

// ── Dietas ────────────────────────────────────────────────────────────────────
export const MOCK_DIETS: Diet[] = [
  {
    id: 'diet-1',
    name: 'Dieta de Hipertrofia',
    description: 'Dieta hipercalórica focada em ganho de massa muscular.',
    personalId: 'personal-1',
    createdAt: '2026-04-05T09:00:00Z',
    meals: [
      {
        id: 'meal-1',
        name: 'Café da manhã',
        time: '07:00',
        foods: [
          { id: uuidv4(), name: 'Ovos mexidos', quantity: '3 unidades', calories: 210, protein: 18, carbs: 2, fat: 15 },
          { id: uuidv4(), name: 'Pão integral', quantity: '2 fatias', calories: 140, protein: 6, carbs: 24, fat: 2 },
          { id: uuidv4(), name: 'Banana', quantity: '1 unidade média', calories: 90, protein: 1, carbs: 23, fat: 0 },
        ],
      },
      {
        id: 'meal-2',
        name: 'Almoço',
        time: '12:00',
        foods: [
          { id: uuidv4(), name: 'Arroz integral', quantity: '150g', calories: 165, protein: 4, carbs: 34, fat: 1 },
          { id: uuidv4(), name: 'Feijão carioca', quantity: '100g', calories: 130, protein: 8, carbs: 22, fat: 1 },
          { id: uuidv4(), name: 'Frango grelhado', quantity: '200g', calories: 330, protein: 62, carbs: 0, fat: 7 },
          { id: uuidv4(), name: 'Salada verde', quantity: 'à vontade', calories: 20, protein: 1, carbs: 3, fat: 0 },
        ],
      },
      {
        id: 'meal-3',
        name: 'Pré-treino',
        time: '16:00',
        foods: [
          { id: uuidv4(), name: 'Batata doce', quantity: '150g', calories: 130, protein: 2, carbs: 30, fat: 0 },
          { id: uuidv4(), name: 'Peito de frango', quantity: '100g', calories: 165, protein: 31, carbs: 0, fat: 3 },
        ],
        notes: 'Consumir 60 minutos antes do treino.',
      },
      {
        id: 'meal-4',
        name: 'Pós-treino',
        time: '19:30',
        foods: [
          { id: uuidv4(), name: 'Whey protein', quantity: '30g (1 scoop)', calories: 120, protein: 24, carbs: 3, fat: 2 },
          { id: uuidv4(), name: 'Leite desnatado', quantity: '200ml', calories: 70, protein: 7, carbs: 10, fat: 0 },
        ],
        notes: 'Consumir imediatamente após o treino.',
      },
      {
        id: 'meal-5',
        name: 'Jantar',
        time: '21:00',
        foods: [
          { id: uuidv4(), name: 'Salmão grelhado', quantity: '150g', calories: 280, protein: 38, carbs: 0, fat: 14 },
          { id: uuidv4(), name: 'Brócolis cozido', quantity: '100g', calories: 35, protein: 3, carbs: 7, fat: 0 },
          { id: uuidv4(), name: 'Azeite de oliva', quantity: '1 col. sopa', calories: 90, protein: 0, carbs: 0, fat: 10 },
        ],
      },
    ],
  },
];

export const MOCK_DIET_ASSIGNMENTS: DietAssignment[] = [
  {
    id: 'diet-assign-1',
    dietId: 'diet-1',
    dietName: 'Dieta de Hipertrofia',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2026-04-10T08:00:00Z',
  },
];
