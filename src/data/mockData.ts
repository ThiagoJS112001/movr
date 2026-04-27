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
  { id: 'ex-15', name: 'Supino Inclinado', muscleGroup: 'Peito' },
  { id: 'ex-16', name: 'Crucifixo', muscleGroup: 'Peito' },
  { id: 'ex-17', name: 'Peck Deck', muscleGroup: 'Peito' },
  { id: 'ex-18', name: 'Tríceps Corda', muscleGroup: 'Tríceps' },
  { id: 'ex-19', name: 'Tríceps Pulley', muscleGroup: 'Tríceps' },
  { id: 'ex-20', name: 'Rosca Martelo', muscleGroup: 'Bíceps' },
  { id: 'ex-21', name: 'Rosca Concentrada', muscleGroup: 'Bíceps' },
  { id: 'ex-22', name: 'Serrote', muscleGroup: 'Costas' },
  { id: 'ex-23', name: 'Levantamento Terra', muscleGroup: 'Costas' },
  { id: 'ex-24', name: 'Stiff', muscleGroup: 'Glúteos' },
  { id: 'ex-25', name: 'Glúteo no Cabo', muscleGroup: 'Glúteos' },
  { id: 'ex-26', name: 'Elevação Frontal', muscleGroup: 'Ombros' },
];

// ── Treinos ───────────────────────────────────────────────────────────────────
export const MOCK_WORKOUTS: Workout[] = [
  {
    id: 'workout-1',
    name: 'Treino A - Peito e Tríceps',
    description: 'Foco em força e hipertrofia de peito e tríceps.',
    personalId: 'personal-1',
    createdAt: '2024-05-19T10:00:00Z',
    status: 'ativo',
    durationMinutes: 60,
    exercises: [
      { id: 'we-1-1', exerciseId: 'ex-1',  exerciseName: 'Supino Reto',       sets: 4, reps: '10-12', weight: '60kg',     restSeconds: 90, notes: 'Manter escápulas retraídas' },
      { id: 'we-1-2', exerciseId: 'ex-15', exerciseName: 'Supino Inclinado',  sets: 3, reps: '12',    weight: '50kg',     restSeconds: 75 },
      { id: 'we-1-3', exerciseId: 'ex-16', exerciseName: 'Crucifixo',         sets: 3, reps: '15',    weight: '16kg',     restSeconds: 60 },
      { id: 'we-1-4', exerciseId: 'ex-17', exerciseName: 'Peck Deck',         sets: 3, reps: '15',    weight: '50kg',     restSeconds: 60 },
      { id: 'we-1-5', exerciseId: 'ex-6',  exerciseName: 'Tríceps Testa',     sets: 3, reps: '12',    weight: '30kg',     restSeconds: 60 },
      { id: 'we-1-6', exerciseId: 'ex-18', exerciseName: 'Tríceps Corda',     sets: 3, reps: '15',    weight: '25kg',     restSeconds: 60 },
      { id: 'we-1-7', exerciseId: 'ex-19', exerciseName: 'Tríceps Pulley',    sets: 3, reps: '15',    weight: '30kg',     restSeconds: 45 },
      { id: 'we-1-8', exerciseId: 'ex-14', exerciseName: 'Prancha',           sets: 3, reps: '30s',   weight: 'corporal', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-2',
    name: 'Treino B - Costas e Bíceps',
    description: 'Foco em força e hipertrofia de costas e bíceps.',
    personalId: 'personal-1',
    createdAt: '2024-05-17T10:00:00Z',
    status: 'ativo',
    durationMinutes: 55,
    exercises: [
      { id: 'we-2-1', exerciseId: 'ex-3',  exerciseName: 'Remada Curvada',       sets: 4, reps: '10',    weight: '50kg',     restSeconds: 90 },
      { id: 'we-2-2', exerciseId: 'ex-8',  exerciseName: 'Puxada Frente',        sets: 3, reps: '12',    weight: '55kg',     restSeconds: 60 },
      { id: 'we-2-3', exerciseId: 'ex-22', exerciseName: 'Serrote',              sets: 3, reps: '12',    weight: '20kg',     restSeconds: 60 },
      { id: 'we-2-4', exerciseId: 'ex-23', exerciseName: 'Levantamento Terra',   sets: 3, reps: '8',     weight: '80kg',     restSeconds: 120 },
      { id: 'we-2-5', exerciseId: 'ex-5',  exerciseName: 'Rosca Direta',         sets: 3, reps: '12',    weight: '20kg',     restSeconds: 60 },
      { id: 'we-2-6', exerciseId: 'ex-20', exerciseName: 'Rosca Martelo',        sets: 3, reps: '12',    weight: '14kg',     restSeconds: 60 },
      { id: 'we-2-7', exerciseId: 'ex-21', exerciseName: 'Rosca Concentrada',    sets: 3, reps: '15',    weight: '10kg',     restSeconds: 45 },
      { id: 'we-2-8', exerciseId: 'ex-8',  exerciseName: 'Puxada Neutra',        sets: 3, reps: '12',    weight: '52kg',     restSeconds: 60 },
      { id: 'we-2-9', exerciseId: 'ex-13', exerciseName: 'Abdominal Crunch',     sets: 3, reps: '20',    weight: 'corporal', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-3',
    name: 'Treino C - Pernas e Glúteos',
    description: 'Foco em força e hipertrofia de quadríceps, posterior, glúteos e panturrilha.',
    personalId: 'personal-1',
    createdAt: '2024-05-15T10:00:00Z',
    status: 'ativo',
    durationMinutes: 70,
    exercises: [
      { id: 'we-3-1',  exerciseId: 'ex-2',  exerciseName: 'Agachamento Livre',      sets: 4, reps: '10',       weight: '80kg',     restSeconds: 120 },
      { id: 'we-3-2',  exerciseId: 'ex-7',  exerciseName: 'Leg Press',              sets: 3, reps: '12',       weight: '120kg',    restSeconds: 90 },
      { id: 'we-3-3',  exerciseId: 'ex-11', exerciseName: 'Mesa Flexora',           sets: 3, reps: '12',       weight: '40kg',     restSeconds: 60 },
      { id: 'we-3-4',  exerciseId: 'ex-10', exerciseName: 'Cadeira Extensora',      sets: 3, reps: '15',       weight: '50kg',     restSeconds: 60 },
      { id: 'we-3-5',  exerciseId: 'ex-12', exerciseName: 'Panturrilha em Pé',      sets: 4, reps: '20',       weight: 'corporal', restSeconds: 45 },
      { id: 'we-3-6',  exerciseId: 'ex-24', exerciseName: 'Stiff',                  sets: 3, reps: '12',       weight: '60kg',     restSeconds: 75 },
      { id: 'we-3-7',  exerciseId: 'ex-25', exerciseName: 'Glúteo no Cabo',         sets: 3, reps: '15',       weight: '25kg',     restSeconds: 60 },
      { id: 'we-3-8',  exerciseId: 'ex-2',  exerciseName: 'Agachamento Sumô',       sets: 3, reps: '15',       weight: '40kg',     restSeconds: 75 },
      { id: 'we-3-9',  exerciseId: 'ex-7',  exerciseName: 'Passada com Halteres',   sets: 3, reps: '12 cada',  weight: '12kg',     restSeconds: 60 },
      { id: 'we-3-10', exerciseId: 'ex-13', exerciseName: 'Abdominal Crunch',       sets: 3, reps: '20',       weight: 'corporal', restSeconds: 45 },
    ],
  },
  {
    id: 'workout-4',
    name: 'Treino D - Ombros e Abdômen',
    description: 'Foco em força e definição de ombros e fortalecimento do core.',
    personalId: 'personal-1',
    createdAt: '2024-05-10T10:00:00Z',
    status: 'rascunho',
    durationMinutes: 45,
    exercises: [
      { id: 'we-4-1', exerciseId: 'ex-4',  exerciseName: 'Desenvolvimento',          sets: 4, reps: '10-12',   weight: '25kg',     restSeconds: 90 },
      { id: 'we-4-2', exerciseId: 'ex-9',  exerciseName: 'Elevação Lateral',         sets: 3, reps: '15',      weight: '8kg',      restSeconds: 60 },
      { id: 'we-4-3', exerciseId: 'ex-26', exerciseName: 'Elevação Frontal',         sets: 3, reps: '12',      weight: '6kg',      restSeconds: 60 },
      { id: 'we-4-4', exerciseId: 'ex-4',  exerciseName: 'Desenvolvimento Arnold',   sets: 3, reps: '12',      weight: '20kg',     restSeconds: 75 },
      { id: 'we-4-5', exerciseId: 'ex-13', exerciseName: 'Abdominal Crunch',         sets: 4, reps: '20',      weight: 'corporal', restSeconds: 45 },
      { id: 'we-4-6', exerciseId: 'ex-14', exerciseName: 'Prancha',                  sets: 3, reps: '45s',     weight: 'corporal', restSeconds: 45 },
      { id: 'we-4-7', exerciseId: 'ex-13', exerciseName: 'Abdominal Oblíquo',        sets: 3, reps: '20 cada', weight: 'corporal', restSeconds: 45 },
    ],
  },
];

// ── Atribuições ───────────────────────────────────────────────────────────────
export const MOCK_ASSIGNMENTS: WorkoutAssignment[] = [
  {
    id: 'assign-1',
    workoutId: 'workout-1',
    workoutName: 'Treino A - Peito e Tríceps',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2024-03-12T08:00:00Z',
    scheduledDays: ['segunda', 'quinta'],
  },
  {
    id: 'assign-2',
    workoutId: 'workout-2',
    workoutName: 'Treino B - Costas e Bíceps',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2024-03-12T08:00:00Z',
    scheduledDays: ['terca', 'sexta'],
  },
  {
    id: 'assign-3',
    workoutId: 'workout-3',
    workoutName: 'Treino C - Pernas e Glúteos',
    studentId: 'aluno-2',
    personalId: 'personal-1',
    assignedAt: '2024-04-01T09:00:00Z',
    scheduledDays: ['quarta', 'sabado'],
  },
  {
    id: 'assign-4',
    workoutId: 'workout-3',
    workoutName: 'Treino C - Pernas e Glúteos',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2024-03-12T08:00:00Z',
    scheduledDays: ['quarta', 'sabado'],
  },
  {
    id: 'assign-5',
    workoutId: 'workout-4',
    workoutName: 'Treino D - Ombros e Abdômen',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2024-03-12T08:00:00Z',
    scheduledDays: ['quinta', 'domingo'],
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
  // ── Ana (aluno-1) ──────────────────────────────────────────────────────────
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
    read: true,
  },
  {
    id: 'msg-3',
    fromId: 'aluno-1',
    fromName: 'Ana Souza',
    toId: 'personal-1',
    content: 'Oi! Tudo bem? Posso mudar o treino de hoje? Estou com a academia fechada aqui perto',
    sentAt: '2026-04-26T10:38:00Z',
    read: true,
  },
  {
    id: 'msg-4',
    fromId: 'personal-1',
    fromName: 'Carlos Silva',
    toId: 'aluno-1',
    content: 'Oi Ana! Claro, sem problema. Posso adaptar para treino em casa, sem equipamentos',
    sentAt: '2026-04-26T10:40:00Z',
    read: true,
  },
  {
    id: 'msg-5',
    fromId: 'aluno-1',
    fromName: 'Ana Souza',
    toId: 'personal-1',
    content: 'Que ótimo! Me manda o treino adaptado quando puder 🙏',
    sentAt: '2026-04-26T10:42:00Z',
    read: false,
  },
  // ── Bruno (aluno-2) ────────────────────────────────────────────────────────
  {
    id: 'msg-6',
    fromId: 'personal-1',
    fromName: 'Carlos Silva',
    toId: 'aluno-2',
    content: 'Bruno, seu desempenho nesta semana está excelente! Continue assim 💪',
    sentAt: '2026-04-25T11:00:00Z',
    read: true,
  },
  {
    id: 'msg-7',
    fromId: 'aluno-2',
    fromName: 'Bruno Ramos',
    toId: 'personal-1',
    content: 'Ok, obrigado!',
    sentAt: '2026-04-25T14:30:00Z',
    read: true,
  },
  // ── Fernanda (aluno-3) ─────────────────────────────────────────────────────
  {
    id: 'msg-8',
    fromId: 'personal-1',
    fromName: 'Carlos Silva',
    toId: 'aluno-3',
    content: 'Fernanda, não esqueça do treino de pernas hoje!',
    sentAt: '2026-04-21T08:00:00Z',
    read: true,
  },
  {
    id: 'msg-9',
    fromId: 'aluno-3',
    fromName: 'Fernanda Lima',
    toId: 'personal-1',
    content: 'Fiz o treino completo 💪',
    sentAt: '2026-04-21T11:00:00Z',
    read: true,
  },
];

// ── Dietas ────────────────────────────────────────────────────────────────────
export const MOCK_DIETS: Diet[] = [
  {
    id: 'diet-1',
    name: 'Dieta de Hipertrofia',
    description: 'Dieta hipercalórica focada em ganho de massa muscular.',
    goal: 'Hipertrofia',
    status: 'ativa',
    personalId: 'personal-1',
    createdAt: '2024-05-18T09:00:00Z',
    meals: [
      {
        id: 'meal-1',
        name: 'Café da manhã',
        time: '07:00',
        foods: [
          { id: uuidv4(), name: 'Ovos mexidos',    quantity: '4 unidades',    calories: 280, protein: 24, carbs: 2,  fat: 20 },
          { id: uuidv4(), name: 'Pão integral',     quantity: '3 fatias',      calories: 210, protein: 9,  carbs: 36, fat: 3  },
          { id: uuidv4(), name: 'Banana',           quantity: '2 unidades',    calories: 180, protein: 2,  carbs: 46, fat: 0  },
          { id: uuidv4(), name: 'Pasta de amendoim', quantity: '1 col. sopa',  calories: 95,  protein: 4,  carbs: 3,  fat: 8  },
        ],
      },
      {
        id: 'meal-2',
        name: 'Lanche da manhã',
        time: '10:00',
        foods: [
          { id: uuidv4(), name: 'Iogurte grego',   quantity: '200g',           calories: 132, protein: 20, carbs: 8,  fat: 3 },
          { id: uuidv4(), name: 'Granola',          quantity: '40g',            calories: 160, protein: 3,  carbs: 28, fat: 5 },
          { id: uuidv4(), name: 'Castanhas',        quantity: '30g',            calories: 190, protein: 4,  carbs: 4,  fat: 18 },
        ],
      },
      {
        id: 'meal-3',
        name: 'Almoço',
        time: '12:30',
        foods: [
          { id: uuidv4(), name: 'Arroz integral',  quantity: '200g',           calories: 220, protein: 5,  carbs: 45, fat: 2  },
          { id: uuidv4(), name: 'Feijão carioca',  quantity: '100g',           calories: 130, protein: 8,  carbs: 22, fat: 1  },
          { id: uuidv4(), name: 'Frango grelhado', quantity: '250g',           calories: 413, protein: 78, carbs: 0,  fat: 9  },
          { id: uuidv4(), name: 'Salada verde',    quantity: 'à vontade',      calories: 20,  protein: 1,  carbs: 3,  fat: 0  },
          { id: uuidv4(), name: 'Azeite de oliva', quantity: '1 col. sopa',    calories: 90,  protein: 0,  carbs: 0,  fat: 10 },
        ],
      },
      {
        id: 'meal-4',
        name: 'Pré-treino',
        time: '16:00',
        foods: [
          { id: uuidv4(), name: 'Batata doce',     quantity: '200g',           calories: 172, protein: 3,  carbs: 40, fat: 0 },
          { id: uuidv4(), name: 'Peito de frango', quantity: '150g',           calories: 248, protein: 47, carbs: 0,  fat: 5 },
        ],
        notes: 'Consumir 60 minutos antes do treino.',
      },
      {
        id: 'meal-5',
        name: 'Pós-treino',
        time: '19:30',
        foods: [
          { id: uuidv4(), name: 'Whey protein',    quantity: '40g (1,5 scoops)', calories: 160, protein: 32, carbs: 4,  fat: 3 },
          { id: uuidv4(), name: 'Leite desnatado', quantity: '300ml',             calories: 105, protein: 11, carbs: 15, fat: 0 },
        ],
        notes: 'Consumir imediatamente após o treino.',
      },
      {
        id: 'meal-6',
        name: 'Jantar',
        time: '21:00',
        foods: [
          { id: uuidv4(), name: 'Salmão grelhado', quantity: '200g',            calories: 373, protein: 50, carbs: 0,  fat: 18 },
          { id: uuidv4(), name: 'Arroz integral',  quantity: '120g',            calories: 132, protein: 3,  carbs: 27, fat: 1  },
          { id: uuidv4(), name: 'Brócolis cozido', quantity: '150g',            calories: 53,  protein: 5,  carbs: 10, fat: 0  },
          { id: uuidv4(), name: 'Azeite de oliva', quantity: '1 col. sopa',     calories: 90,  protein: 0,  carbs: 0,  fat: 10 },
        ],
      },
    ],
  },
  {
    id: 'diet-2',
    name: 'Dieta de Definição',
    description: 'Dieta moderada focada em emagrecimento e definição muscular.',
    goal: 'Definição',
    status: 'pausada',
    personalId: 'personal-1',
    createdAt: '2024-05-05T09:00:00Z',
    meals: [
      {
        id: 'meal-d2-1',
        name: 'Café da manhã',
        time: '07:00',
        foods: [
          { id: uuidv4(), name: 'Ovos mexidos',   quantity: '3 unidades',   calories: 210, protein: 18, carbs: 2,  fat: 15 },
          { id: uuidv4(), name: 'Aveia',           quantity: '50g',          calories: 190, protein: 6,  carbs: 32, fat: 4  },
          { id: uuidv4(), name: 'Morango',         quantity: '100g',         calories: 32,  protein: 1,  carbs: 8,  fat: 0  },
        ],
      },
      {
        id: 'meal-d2-2',
        name: 'Almoço',
        time: '12:00',
        foods: [
          { id: uuidv4(), name: 'Arroz integral',      quantity: '120g',     calories: 132, protein: 3,  carbs: 27, fat: 1 },
          { id: uuidv4(), name: 'Feijão carioca',      quantity: '80g',      calories: 104, protein: 6,  carbs: 18, fat: 1 },
          { id: uuidv4(), name: 'Tilápia grelhada',    quantity: '200g',     calories: 218, protein: 45, carbs: 0,  fat: 4 },
          { id: uuidv4(), name: 'Salada verde',        quantity: 'à vontade', calories: 20, protein: 1,  carbs: 3,  fat: 0 },
        ],
      },
      {
        id: 'meal-d2-3',
        name: 'Lanche',
        time: '15:30',
        foods: [
          { id: uuidv4(), name: 'Iogurte grego',  quantity: '200g',          calories: 132, protein: 20, carbs: 8, fat: 3 },
          { id: uuidv4(), name: 'Castanhas',      quantity: '20g',            calories: 127, protein: 3,  carbs: 3, fat: 12 },
        ],
      },
      {
        id: 'meal-d2-4',
        name: 'Pré-treino',
        time: '17:00',
        foods: [
          { id: uuidv4(), name: 'Batata doce',    quantity: '100g',          calories: 86,  protein: 2,  carbs: 20, fat: 0 },
          { id: uuidv4(), name: 'Whey protein',   quantity: '30g',           calories: 120, protein: 24, carbs: 3,  fat: 2 },
        ],
      },
      {
        id: 'meal-d2-5',
        name: 'Jantar',
        time: '20:00',
        foods: [
          { id: uuidv4(), name: 'Frango grelhado', quantity: '180g',         calories: 297, protein: 56, carbs: 0,  fat: 7 },
          { id: uuidv4(), name: 'Abobrinha',       quantity: '150g',         calories: 27,  protein: 2,  carbs: 5,  fat: 0 },
          { id: uuidv4(), name: 'Brócolis',        quantity: '100g',         calories: 35,  protein: 3,  carbs: 7,  fat: 0 },
        ],
      },
      {
        id: 'meal-d2-6',
        name: 'Ceia',
        time: '22:00',
        foods: [
          { id: uuidv4(), name: 'Queijo cottage', quantity: '150g',          calories: 150, protein: 17, carbs: 6,  fat: 5 },
          { id: uuidv4(), name: 'Amêndoas',       quantity: '20g',           calories: 116, protein: 4,  carbs: 3,  fat: 10 },
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
    assignedAt: '2024-03-12T08:00:00Z',
  },
  {
    id: 'diet-assign-2',
    dietId: 'diet-2',
    dietName: 'Dieta de Definição',
    studentId: 'aluno-1',
    personalId: 'personal-1',
    assignedAt: '2024-03-12T08:00:00Z',
  },
];
