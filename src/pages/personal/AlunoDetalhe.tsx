import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents, useBlockStudent } from '../../hooks/useStudents';
import {
  useWorkouts,
  useAssignments,
  useAssignWorkout,
  useRemoveAssignment,
  useWorkoutLogs,
} from '../../hooks/useWorkouts';
import { useDiets, useDietAssignments, useAssignDiet, useRemoveDietAssignment } from '../../hooks/useDiets';
import { useExercises } from '../../hooks/useExercises';
import { usePlanArchives } from '../../hooks/useWeeklyPlans';
import { useAssessments, useDeleteAssessment } from '../../hooks/useAssessments';
import type { StudentAssessment } from '../../types';
import { toast } from 'sonner';
import {
  ArrowLeft, MessageSquare, ShieldOff, ShieldCheck,
  Dumbbell, Salad, History,
  Eye, Pencil, Copy, Trash2, Plus, CalendarDays,
  ChevronDown, ChevronUp, Archive, MoreHorizontal,
  TrendingUp, TrendingDown, Target, Clock, Zap, MoreVertical, Activity,
} from 'lucide-react';
import type { Workout, Diet } from '../../types';
import WorkoutViewModal from '../../components/WorkoutViewModal';
import WorkoutEditModal from '../../components/WorkoutEditModal';
import NewWorkoutModal from '../../components/NewWorkoutModal';
import NewDietModal from '../../components/NewDietModal';
import NewAssessmentModal from '../../components/NewAssessmentModal';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const AVATAR_COLORS = [
  'bg-violet-600', 'bg-blue-600', 'bg-rose-500',
  'bg-amber-500',  'bg-teal-500', 'bg-indigo-600',
  'bg-pink-500',   'bg-emerald-600',
];
function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

const WORKOUT_LETTER_COLORS = [
  'bg-blue-500', 'bg-indigo-500', 'bg-teal-500', 'bg-amber-500',
  'bg-rose-500',  'bg-violet-500', 'bg-emerald-500', 'bg-pink-500',
];

const DAYS_ORDER = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const DAYS_SHORT: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
};
function formatArchiveDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

const MUSCLE_BADGE: Record<string, string> = {
  'Peito':       'bg-purple-500/20 text-purple-300',
  'Costas':      'bg-teal-500/20 text-teal-300',
  'Pernas':      'bg-emerald-500/20 text-emerald-300',
  'Glúteos':     'bg-emerald-500/20 text-emerald-300',
  'Ombros':      'bg-orange-500/20 text-orange-300',
  'Bíceps':      'bg-indigo-500/20 text-indigo-300',
  'Tríceps':     'bg-pink-500/20 text-pink-300',
  'Abdômen':     'bg-amber-500/20 text-amber-300',
  'Panturrilha': 'bg-cyan-500/20 text-cyan-300',
};
function muscleBadge(g: string) {
  return MUSCLE_BADGE[g] ?? 'bg-slate-500/20 text-slate-300';
}

type Tab = 'treinos' | 'dieta' | 'historico' | 'evolucao';

// â”€â”€ Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AlunoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { data: workouts = [] } = useWorkouts();
  const { data: assignments = [] } = useAssignments();
  const { data: logs = [] } = useWorkoutLogs(id ?? '');
  const { data: catalogExercises = [] } = useExercises();
  const { data: diets = [] } = useDiets();
  const { data: dietAssignments = [] } = useDietAssignments();
  const assignWorkoutMutation = useAssignWorkout();
  const removeAssignmentMutation = useRemoveAssignment();
  const assignDietMutation = useAssignDiet();
  const removeDietAssignmentMutation = useRemoveDietAssignment();
  const blockStudentMutation = useBlockStudent();
  const { data: allArchives = [] } = usePlanArchives();
  const { data: allAssessmentsData = [] } = useAssessments(id ?? '');
  const deleteAssessmentMutation = useDeleteAssessment(id ?? '');

  const [activeTab, setActiveTab] = useState<Tab>('treinos');
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [workoutMenuOpenId, setWorkoutMenuOpenId] = useState<string | null>(null);
  const [dietMenuOpenId, setDietMenuOpenId] = useState<string | null>(null);

  // View workout modal
  const [viewingWorkout, setViewingWorkout] = useState<Workout | null>(null);

  // Edit workout modal
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);

  // Create workout modal
  const [weeklyPlanOpen, setWeeklyPlanOpen] = useState(false);

  // Assign workout modal
  const [assignWorkoutOpen, setAssignWorkoutOpen] = useState(false);
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('');

  // Assign diet modal
  const [assignDietOpen, setAssignDietOpen] = useState(false);
  const [selectedDietId, setSelectedDietId] = useState('');

  // New diet modal
  const [newDietOpen, setNewDietOpen] = useState(false);

  // New assessment modal
  const [newAssessmentOpen, setNewAssessmentOpen] = useState(false);

  // Evolução tab state
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);
  const [chartPeriod, setChartPeriod] = useState(30);
  const [showAllAssessments, setShowAllAssessments] = useState(false);

  // Plan archives
  const [expandedArchiveIds, setExpandedArchiveIds] = useState<Set<string>>(new Set());
  function toggleArchiveExpanded(archiveId: string) {
    setExpandedArchiveIds((prev) => {
      const next = new Set(prev);
      next.has(archiveId) ? next.delete(archiveId) : next.add(archiveId);
      return next;
    });
  }

  // â”€â”€ Student data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const student = students.find((s) => s.id === id);
  if (studentsLoading) return (
    <div className="p-6 max-w-6xl mx-auto space-y-5 animate-pulse">
      <div className="h-5 w-32 bg-slate-700/60 rounded-lg" />
      <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-slate-700/60 shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-5 w-48 bg-slate-700/60 rounded-lg" />
            <div className="h-3 w-64 bg-slate-700/40 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-slate-700/40 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-9 w-28 bg-slate-700/60 rounded-xl" />)}
      </div>
      <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl h-64" />
    </div>
  );
  if (!student) {
    return (
      <div className="p-6 text-center text-slate-400 dark:text-slate-500 py-20">
        <p>Aluno não encontrado.</p>
        <button onClick={() => navigate('/personal/alunos')} className="mt-3 text-sm text-indigo-500 hover:underline">
          Voltar para Alunos
        </button>
      </div>
    );
  }

  const blocked = student.isBlocked ?? false;
  const avatarColor = blocked ? 'bg-red-500' : getAvatarColor(student.name);

  // Since date: earliest assignment
  const studentAssignments = useMemo(
    () => assignments.filter((a) => a.studentId === id),
    [assignments, id],
  );
  const sinceDate = useMemo(() => {
    if (studentAssignments.length === 0) return null;
    const earliest = [...studentAssignments].sort((a, b) => a.assignedAt.localeCompare(b.assignedAt))[0];
    return new Date(earliest.assignedAt);
  }, [studentAssignments]);

  // Assigned workouts
  const assignedWorkoutIds = useMemo(
    () => [...new Set(studentAssignments.map((a) => a.workoutId))],
    [studentAssignments],
  );
  const assignedWorkouts = useMemo(
    () => workouts.filter((w) => assignedWorkoutIds.includes(w.id)),
    [workouts, assignedWorkoutIds],
  );

  // Assigned diets
  const studentDietAssignments = useMemo(
    () => dietAssignments.filter((a) => a.studentId === id && a.personalId === user?.id),
    [dietAssignments, id, user?.id],
  );
  const assignedDiets = useMemo(
    () => diets.filter((d) => studentDietAssignments.some((a) => a.dietId === d.id)),
    [diets, studentDietAssignments],
  );

  // Logs
  const studentLogs = useMemo(
    () => [...logs.filter((l) => l.studentId === id)].sort((a, b) => b.completedAt.localeCompare(a.completedAt)),
    [logs, id],
  );

  // Plan archives for this student
  const studentArchives = useMemo(
    () => [...allArchives.filter((a) => a.studentId === id && a.personalId === user?.id)]
      .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)),
    [allArchives, id, user?.id],
  );

  // Unassigned workouts (available to assign)
  const myWorkouts = workouts.filter((w) => w.personalId === user?.id);
  const unassignedWorkouts = myWorkouts.filter((w) => !assignedWorkoutIds.includes(w.id));

  // Unassigned diets
  const myDiets = diets.filter((d) => d.personalId === user?.id);
  const assignedDietIds = studentDietAssignments.map((a) => a.dietId);
  const unassignedDiets = myDiets.filter((d) => !assignedDietIds.includes(d.id));

  // â”€â”€ Header metrics â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const lastLog = studentLogs[0] ?? null;
  const lastLogRelative = lastLog ? (() => {
    const days = Math.floor((Date.now() - new Date(lastLog.completedAt).getTime()) / 86_400_000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    return `há ${Math.floor(days / 7)} sem.`;
  })() : null;

  const logsThisMonth = studentLogs.filter((l) => {
    const d = new Date(l.completedAt);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const logsLast4Weeks = studentLogs.filter((l) =>
    Date.now() - new Date(l.completedAt).getTime() < 28 * 86_400_000,
  );
  const freqPct = Math.min(100, Math.round((logsLast4Weeks.length / 12) * 100));

  const nextAssignmentLabel = (() => {
    const dowMap: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
    const todayDow = new Date().getDay();
    for (const a of studentAssignments) {
      for (const day of a.scheduledDays ?? []) {
        if ((dowMap[day] ?? -1) > todayDow) return a.workoutName.replace(/^(Treino [A-Z])\s*[-–]\s*.+/, '$1');
      }
    }
    return studentAssignments[0]?.workoutName.replace(/^(Treino [A-Z])\s*[-–]\s*.+/, '$1') ?? null;
  })();

  const now2 = Date.now();
  const week2 = 14 * 86_400_000;
  const recentLogs = studentLogs.filter((l) => now2 - new Date(l.completedAt).getTime() < week2);
  const prevLogs   = studentLogs.filter((l) => {
    const age = now2 - new Date(l.completedAt).getTime();
    return age >= week2 && age < week2 * 2;
  });
  const progressTrend: 'up' | 'down' | 'stable' =
    recentLogs.length > prevLogs.length ? 'up' :
    recentLogs.length < prevLogs.length ? 'down' : 'stable';

  // Helpers
  function getWorkoutMuscleGroups(workout: Workout): string[] {
    const groups = new Set<string>();
    for (const we of workout.exercises) {
      const ex = catalogExercises.find((e) => e.id === we.exerciseId);
      if (ex) groups.add(ex.muscleGroup);
    }
    return [...groups];
  }

  function getLastLogDuration(workoutId: string): string {
    const wLogs = studentLogs.filter((l) => l.workoutId === workoutId);
    if (wLogs.length === 0) return '—';
    return `${wLogs[0].durationMinutes ?? '—'} min`;
  }

  function getDietTotalCals(diet: Diet): number {
    return diet.meals.reduce(
      (sum, m) => sum + m.foods.reduce((s, f) => s + (f.calories ?? 0), 0),
      0,
    );
  }

  function handleAssignWorkout() {
    if (!selectedWorkoutId || !user) return;
    const w = myWorkouts.find((wk) => wk.id === selectedWorkoutId);
    if (!w) return;
    assignWorkoutMutation.mutate({ workoutId: w.id, workoutName: w.name, studentId: student.id, personalId: user.id });
    setAssignWorkoutOpen(false);
    setSelectedWorkoutId('');
    toast.success(`"${w.name}" atribuído!`);
  }

  function handleAssignDiet() {
    if (!selectedDietId || !user) return;
    const d = myDiets.find((dt) => dt.id === selectedDietId);
    if (!d) return;
    assignDietMutation.mutate({ dietId: d.id, dietName: d.name, studentId: student.id, personalId: user.id });
    setAssignDietOpen(false);
    setSelectedDietId('');
    toast.success(`"${d.name}" atribuída!`);
  }

  function handleRemoveWorkout(workoutId: string) {
    const a = studentAssignments.find((sa) => sa.workoutId === workoutId);
    if (a) { removeAssignmentMutation.mutate(a.id); toast.success('Treino removido.'); }
  }

  function handleRemoveDiet(dietId: string) {
    const a = studentDietAssignments.find((da) => da.dietId === dietId);
    if (a) { removeDietAssignmentMutation.mutate(a.id); toast.success('Dieta removida.'); }
  }

  // â”€â”€ Tabs config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const TABS: { key: Tab; label: string; Icon: typeof Dumbbell }[] = [
    { key: 'treinos',   label: 'Treinos',             Icon: Dumbbell },
    { key: 'dieta',     label: 'Dieta',               Icon: Salad },
    { key: 'evolucao',  label: 'Evolução',            Icon: Activity },
    { key: 'historico', label: 'Histórico de Treinos', Icon: History },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* Back button */}
      <button
        onClick={() => navigate('/personal/alunos')}
        className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-5 transition-colors"
      >
        <ArrowLeft size={15} />
        Voltar para alunos
      </button>

      {/* Close header menu on outside click */}
      {headerMenuOpen && (
        <div className="fixed inset-0 z-10" onClick={() => setHeaderMenuOpen(false)} />
      )}
      {(workoutMenuOpenId || dietMenuOpenId) && (
        <div className="fixed inset-0 z-10" onClick={() => { setWorkoutMenuOpenId(null); setDietMenuOpenId(null); }} />
      )}

      {/* Student header card */}
      <div className="bg-white dark:bg-[#0D1025] border border-slate-100 dark:border-white/[0.07] rounded-2xl mb-4 overflow-hidden">
        {/* Top row */}
        <div className="flex items-center gap-4 px-5 pt-5 pb-4">
          <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center font-bold text-xl text-white ${avatarColor}`}>
            {student.name.charAt(0).toUpperCase()}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-bold text-slate-800 dark:text-white">{student.name}</h1>
              <span className={`flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                blocked
                  ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${blocked ? 'bg-red-500' : 'bg-emerald-500'}`} />
                {blocked ? 'Bloqueado' : 'Ativo'}
              </span>
            </div>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              {student.email}
              {sinceDate && (
                <span className="ml-2 before:content-['·'] before:mr-2 before:opacity-50">
                  desde {sinceDate.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => navigate('/personal/chat')}
              className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
              title="Chat"
            >
              <MessageSquare size={16} />
            </button>
            {/* â‹¯ secondary menu */}
            <div className="relative">
              <button
                onClick={() => setHeaderMenuOpen((o) => !o)}
                className="p-2.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title="Mais opções"
              >
                <MoreVertical size={16} />
              </button>
              {headerMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-[#0D1025] rounded-xl shadow-lg border border-slate-200 dark:border-white/[0.07] z-20 py-1.5">
                  <button
                    onClick={() => { blockStudentMutation.mutate({ id: student.id, blocked: !blocked }); setHeaderMenuOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                      blocked
                        ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                        : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                    }`}
                  >
                    {blocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                    {blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metrics strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-700/50 border-t border-slate-100 dark:border-white/[0.07]">
          {/* Last session */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
              <Clock size={14} className="text-indigo-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Ãšltima sessão</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{lastLogRelative ?? '—'}</p>
            </div>
          </div>

          {/* This month */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
              <TrendingUp size={14} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Este mês</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {logsThisMonth.length} treino{logsThisMonth.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Frequency */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center shrink-0">
              <Zap size={14} className="text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Frequência</p>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{freqPct}%</p>
                <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-700 rounded-full min-w-[40px]">
                  <div
                    className={`h-1 rounded-full ${
                      freqPct >= 80 ? 'bg-emerald-500' : freqPct >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${freqPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Next workout */}
          <div className="flex items-center gap-3 px-5 py-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
              <Target size={14} className="text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wide font-medium">Próximo treino</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{nextAssignmentLabel ?? '—'}</p>
            </div>
          </div>
        </div>

        {/* Progress trend banner (only if data exists) */}
        {studentLogs.length > 0 && (
          <div className={`flex items-center gap-2 px-5 py-2.5 border-t border-slate-100 dark:border-white/[0.07] ${
            progressTrend === 'up'
              ? 'bg-emerald-50/60 dark:bg-emerald-900/10'
              : progressTrend === 'down'
              ? 'bg-amber-50/60 dark:bg-amber-900/10'
              : 'bg-slate-50/60 dark:bg-[#0D1025]/20'
          }`}>
            <TrendingUp
              size={13}
              className={progressTrend === 'up' ? 'text-emerald-500' : progressTrend === 'down' ? 'text-amber-500' : 'text-slate-400'}
            />
            <p className={`text-xs font-medium ${
              progressTrend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
              progressTrend === 'down' ? 'text-amber-600 dark:text-amber-400' :
              'text-slate-500 dark:text-slate-400'
            }`}>
              {progressTrend === 'up'
                ? `Evolução positiva — ${recentLogs.length} treinos nas últimas 2 semanas (vs ${prevLogs.length} anteriores)`
                : progressTrend === 'down'
                ? `Frequência caindo — ${recentLogs.length} treinos nas últimas 2 semanas (vs ${prevLogs.length} anteriores)`
                : `Frequência estável — ${recentLogs.length} treinos nas últimas 2 semanas`}
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-200 dark:border-white/[0.07] mb-5">
        {TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap -mb-px ${
              activeTab === key
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* â”€â”€ Tab: Treinos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'treinos' && (
        <div className="flex flex-col gap-4">
          {/* Treinos section */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/[0.07]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                  <Dumbbell size={15} className="text-indigo-400" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-white">Treinos</p>
                  <p className="text-xs text-slate-400">Crie, edite e gerencie os treinos do aluno.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setWeeklyPlanOpen(true)}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
                >
                  <Plus size={14} />
                  Novo treino
                </button>
              </div>
            </div>

            {assignedWorkouts.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <Dumbbell size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum treino atribuído.</p>
                <button
                  onClick={() => setAssignWorkoutOpen(true)}
                  className="mt-3 text-xs text-indigo-500 hover:underline"
                >
                  Atribuir um treino
                </button>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-white/[0.07]">
                        <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-6 py-3 uppercase tracking-wide">Nome do treino</th>
                        <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Grupos musculares</th>
                        <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Duração</th>
                        <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Status</th>
                        <th className="text-right text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                      {assignedWorkouts.map((workout, i) => {
                        const letterColor = WORKOUT_LETTER_COLORS[i % WORKOUT_LETTER_COLORS.length];
                        const letter = String.fromCharCode(65 + (i % 26));
                        const muscleGroups = getWorkoutMuscleGroups(workout);
                        const duration = getLastLogDuration(workout.id);
                        return (
                          <tr key={workout.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                            <td className="px-6 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg ${letterColor} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                                  {letter}
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 dark:text-slate-100">{workout.name}</p>
                                  <p className="text-xs text-slate-400">{workout.exercises.length} exercícios</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3.5">
                              <div className="flex flex-wrap gap-1">
                                {muscleGroups.slice(0, 3).map((g) => (
                                  <span key={g} className={`text-xs px-2 py-0.5 rounded-full font-medium ${muscleBadge(g)}`}>{g}</span>
                                ))}
                              </div>
                            </td>
                            <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                              {workout.durationMinutes ? `${workout.durationMinutes} min` : duration}
                            </td>
                            <td className="px-4 py-3.5">
                              {workout.status === 'rascunho' ? (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Rascunho
                                </span>
                              ) : (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Ativo
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingWorkout(workout)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors"
                                  title="Editar"
                                >
                                  <Pencil size={14} />
                                </button>
                                {/* â‹¯ row menu */}
                                <div className="relative">
                                  <button
                                    onClick={() => setWorkoutMenuOpenId(workoutMenuOpenId === workout.id ? null : workout.id)}
                                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                                  >
                                    <MoreHorizontal size={14} />
                                  </button>
                                  {workoutMenuOpenId === workout.id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-[#0D1025] rounded-xl shadow-lg border border-slate-200 dark:border-white/[0.07] z-20 py-1.5">
                                      <button
                                        onClick={() => { setViewingWorkout(workout); setWorkoutMenuOpenId(null); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                                      >
                                        <Eye size={13} className="text-indigo-400" /> Visualizar
                                      </button>
                                      <button
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                                      >
                                        <Copy size={13} className="text-slate-400" /> Duplicar
                                      </button>
                                      <div className="my-1 border-t border-slate-100 dark:border-white/[0.07]" />
                                      <button
                                        onClick={() => { handleRemoveWorkout(workout.id); setWorkoutMenuOpenId(null); }}
                                        className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                      >
                                        <Trash2 size={13} /> Remover
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07]">
                  <p className="text-xs text-slate-400">
                    Mostrando 1 a {assignedWorkouts.length} de {assignedWorkouts.length} treino{assignedWorkouts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Tab: Dieta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'dieta' && (() => {
        const panelDietId = selectedDietId || assignedDiets[0]?.id || null;
        const panelDiet = assignedDiets.find((d) => d.id === panelDietId) ?? assignedDiets[0] ?? null;

        const panelTotalCals  = panelDiet ? panelDiet.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + (f.calories ?? 0), 0), 0) : 0;
        const panelTotalProt  = panelDiet ? panelDiet.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + (f.protein  ?? 0), 0), 0) : 0;
        const panelTotalCarbs = panelDiet ? panelDiet.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + (f.carbs    ?? 0), 0), 0) : 0;
        const panelTotalFat   = panelDiet ? panelDiet.meals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + (f.fat      ?? 0), 0), 0) : 0;
        const panelMacroTotal = panelTotalProt + panelTotalCarbs + panelTotalFat;
        const pctProt  = panelMacroTotal > 0 ? Math.round((panelTotalProt  / panelMacroTotal) * 100) : 0;
        const pctCarbs = panelMacroTotal > 0 ? Math.round((panelTotalCarbs / panelMacroTotal) * 100) : 0;
        const pctFat   = panelMacroTotal > 0 ? Math.round((panelTotalFat   / panelMacroTotal) * 100) : 0;

        const MEAL_ICONS: Record<string, string> = {
          'café': 'â˜€ï¸', 'cafe': 'â˜€ï¸', 'manhã': 'â˜€ï¸', 'manha': 'â˜€ï¸',
          'almoço': 'ðŸ½ï¸', 'almoco': 'ðŸ½ï¸',
          'tarde': 'ðŸ§ƒ', 'lanche': 'ðŸ¥™',
          'pré': 'âš¡', 'pre': 'âš¡', 'treino': 'âš¡',
          'pós': 'ðŸŒ™', 'pos': 'ðŸŒ™', 'jantar': 'ðŸŒ™', 'ceia': 'ðŸŒ™',
        };
        function getMealIcon(name: string): string {
          const n = name.toLowerCase();
          for (const [key, icon] of Object.entries(MEAL_ICONS)) {
            if (n.includes(key)) return icon;
          }
          return 'ðŸ´';
        }

        return (
          <div className="grid grid-cols-[300px_1fr] gap-4 items-start">

            {/* Left panel: diet list */}
            <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
                <div>
                  <p className="text-sm font-semibold text-white">Dietas</p>
                  <p className="text-xs text-slate-500 mt-0.5">Crie, edite e gerencie as dietas do aluno.</p>
                </div>
                <button
                  onClick={() => setNewDietOpen(true)}
                  className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-colors shrink-0"
                >
                  <Plus size={13} />
                  Nova dieta
                </button>
              </div>
              {assignedDiets.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Salad size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhuma dieta atribuída.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-700/40">
                    {assignedDiets.map((diet) => {
                      const cals = getDietTotalCals(diet);
                      const isSelected = diet.id === panelDietId;
                      return (
                        <button
                          key={diet.id}
                          onClick={() => setSelectedDietId(diet.id)}
                          className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-l-2 border-emerald-500'
                              : 'hover:bg-slate-700/30 border-l-2 border-transparent'
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-100 truncate">{diet.name}</p>
                              {diet.status === 'pausada' ? (
                                <span className="shrink-0 text-[10px] font-semibold text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-full">Pausada</span>
                              ) : (
                                <span className="shrink-0 text-[10px] font-semibold text-emerald-400 bg-emerald-500/15 px-1.5 py-0.5 rounded-full">Ativa</span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400">{diet.meals.length} refeições â€¢ {cals > 0 ? `${cals} kcal` : '—'}</p>
                          </div>
                          <ChevronDown size={14} className={`shrink-0 mt-0.5 -rotate-90 ${isSelected ? 'text-emerald-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t border-white/[0.07]/40">
                    <p className="text-xs text-slate-500">Mostrando 1 a {assignedDiets.length} de {assignedDiets.length} dieta{assignedDiets.length !== 1 ? 's' : ''}</p>
                  </div>
                </>
              )}
            </div>

            {/* Right panel: diet detail */}
            {panelDiet ? (
              <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl overflow-hidden">

                {/* Diet header */}
                <div className="flex items-start justify-between px-5 py-4 border-b border-white/[0.07]">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-base font-bold text-white">{panelDiet.name}</p>
                      {panelDiet.status === 'pausada' ? (
                        <span className="text-xs font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Pausada
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Ativa
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {panelDiet.goal ? `Objetivo: ${panelDiet.goal} â€¢ ` : ''}{panelDiet.meals.length} refeições por dia
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/personal/dietas/${panelDiet.id}`)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-600 text-slate-300 text-xs font-medium hover:bg-slate-700 transition-colors"
                    >
                      <Pencil size={13} /> Editar dieta
                    </button>
                    <button
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors"
                      onClick={() => toast.info('Função em desenvolvimento.')}
                    >
                      <TrendingUp size={13} /> Enviar para aluno
                    </button>
                    <div className="relative">
                      <button
                        onClick={() => setDietMenuOpenId(dietMenuOpenId === panelDiet.id ? null : panelDiet.id)}
                        className="p-2 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {dietMenuOpenId === panelDiet.id && (
                        <div className="absolute right-0 top-full mt-1 w-44 bg-[#0D1025] rounded-xl shadow-lg border border-white/[0.07] z-20 py-1.5">
                          <button
                            onClick={() => { navigate(`/personal/dietas/${panelDiet.id}`); setDietMenuOpenId(null); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors"
                          >
                            <Eye size={13} className="text-indigo-400" /> Visualizar
                          </button>
                          <button className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/60 transition-colors">
                            <Copy size={13} className="text-slate-400" /> Duplicar
                          </button>
                          <div className="my-1 border-t border-white/[0.07]" />
                          <button
                            onClick={() => { handleRemoveDiet(panelDiet.id); setDietMenuOpenId(null); setSelectedDietId(''); }}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            <Trash2 size={13} /> Remover
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Macro cards */}
                <div className="grid grid-cols-4 divide-x divide-slate-700/50 border-b border-white/[0.07]">
                  {[
                    { label: 'Calorias',     value: panelTotalCals,  unit: 'kcal', pct: null,     color: 'bg-emerald-500' },
                    { label: 'Proteínas',    value: panelTotalProt,  unit: 'g',    pct: pctProt,  color: 'bg-violet-500'  },
                    { label: 'Carboidratos', value: panelTotalCarbs, unit: 'g',    pct: pctCarbs, color: 'bg-amber-500'   },
                    { label: 'Gorduras',     value: panelTotalFat,   unit: 'g',    pct: pctFat,   color: 'bg-rose-500'    },
                  ].map(({ label, value, unit, pct, color }) => (
                    <div key={label} className="px-5 py-4">
                      <p className="text-xs text-slate-400 mb-2">{label}</p>
                      <p className="text-2xl font-bold text-white">
                        {value > 0 ? Math.round(value) : '—'}
                        <span className="text-sm font-normal text-slate-400 ml-1">{unit}</span>
                        {pct != null && value > 0 && (
                          <span className="text-xs font-normal text-slate-500 ml-1.5">{pct}%</span>
                        )}
                      </p>
                      <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${color} transition-all`}
                          style={{ width: label === 'Calorias' ? '100%' : `${pct ?? 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Meals list */}
                <div className="px-5 py-4">
                  <p className="text-sm font-semibold text-white mb-3">Refeições</p>
                  <div className="flex flex-col divide-y divide-slate-700/40">
                    {panelDiet.meals.map((meal) => {
                      const mealCals = meal.foods.reduce((s, f) => s + (f.calories ?? 0), 0);
                      const foodNames = meal.foods.map((f) => f.name).join(', ');
                      return (
                        <div key={meal.id} className="flex items-center gap-3 py-3">
                          <span className="text-xl w-8 text-center shrink-0">{getMealIcon(meal.name)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                            {(meal.time || foodNames) && (
                              <p className="text-xs text-slate-500 truncate">
                                {meal.time && <span className="mr-2">{meal.time}</span>}
                                {foodNames}
                              </p>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-300 shrink-0">{mealCals > 0 ? `${mealCals} kcal` : '—'}</p>
                          <ChevronDown size={14} className="text-slate-600 shrink-0 -rotate-90" />
                          <button
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors shrink-0"
                          >
                            <MoreVertical size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily summary footer */}
                <div className="px-5 py-3 border-t border-white/[0.07] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-300 mb-0.5">Resumo diário</p>
                    <p className="text-xs text-slate-500">
                      {panelTotalCals > 0 ? `${Math.round(panelTotalCals)} kcal` : '—'}
                      {panelTotalProt  > 0 && ` â€¢ ${Math.round(panelTotalProt)}g proteínas`}
                      {panelTotalCarbs > 0 && ` â€¢ ${Math.round(panelTotalCarbs)}g carboidratos`}
                      {panelTotalFat   > 0 && ` â€¢ ${Math.round(panelTotalFat)}g gorduras`}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/personal/dietas/${panelDiet.id}`)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white border border-slate-600 px-3 py-1.5 rounded-xl transition-colors"
                  >
                    Ver detalhes nutricionais <ChevronDown size={12} className="-rotate-90" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Salad size={32} className="opacity-30" />
                <p className="text-sm">Nenhuma dieta atribuída ainda.</p>
                <button onClick={() => setNewDietOpen(true)} className="text-xs text-emerald-400 hover:underline">
                  Criar primeira dieta
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* â”€â”€ Tab: Histórico â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'historico' && (
        <div className="flex flex-col gap-4">
          {/* Plan Archives section */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Archive size={15} className="text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">Histórico de Planos</p>
                <p className="text-xs text-slate-400">
                  {studentArchives.length} plano{studentArchives.length !== 1 ? 's' : ''} arquivado{studentArchives.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {studentArchives.length === 0 ? (
              <div className="py-16 text-center text-slate-400 dark:text-slate-500">
                <Archive size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm font-medium">Nenhum plano arquivado ainda.</p>
                <p className="text-xs mt-1">Abra o plano do aluno e clique em "Novo plano" para arquivar o atual.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50">
                {studentArchives.map((archive) => {
                  const expanded = expandedArchiveIds.has(archive.id);
                  const activeDays = archive.days.filter((d) => d.label.trim() || d.exerciseIds.length > 0);
                  const totalExs = archive.days.reduce((acc, d) => acc + d.exerciseIds.length, 0);
                  return (
                    <div key={archive.id}>
                      <div className="flex items-start gap-3 px-6 py-4">
                        <div className="w-9 h-9 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                          <Archive size={15} className="text-amber-600 dark:text-amber-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                            Plano arquivado
                          </p>
                          <p className="text-xs text-slate-400 dark:text-slate-500">
                            {formatArchiveDate(archive.archivedAt)}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {DAYS_ORDER.map((day) => {
                              const dayData = archive.days.find((d) => d.dayOfWeek === day);
                              const hasContent = dayData && (dayData.label.trim() || dayData.exerciseIds.length > 0);
                              if (!hasContent) return null;
                              return (
                                <span
                                  key={day}
                                  className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full"
                                >
                                  <span className="font-semibold">{DAYS_SHORT[day]}:</span>
                                  {dayData.label.trim() || `${dayData.exerciseIds.length}ex`}
                                </span>
                              );
                            })}
                            {activeDays.length === 0 && (
                              <span className="text-xs text-slate-400 dark:text-slate-500 italic">Plano vazio</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-slate-400 dark:text-slate-500">{totalExs} ex.</span>
                          <button
                            onClick={() => toggleArchiveExpanded(archive.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                          >
                            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </div>
                      </div>

                      {expanded && (
                        <div className="border-t border-slate-100 dark:border-white/[0.07] px-6 py-4 bg-slate-50/50 dark:bg-[#0D1025]/40">
                          {DAYS_ORDER.map((day) => {
                            const dayData = archive.days.find((d) => d.dayOfWeek === day);
                            const hasContent = dayData && (dayData.label.trim() || dayData.exerciseIds.length > 0);
                            if (!hasContent) return null;
                            return (
                              <div key={day} className="mb-4 last:mb-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                                    {DAYS_SHORT[day]}
                                  </span>
                                  {dayData.label && (
                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                      {dayData.label}
                                    </span>
                                  )}
                                </div>
                                {dayData.exerciseIds.length > 0 ? (
                                  <div className="flex flex-col gap-1 pl-2">
                                    {dayData.exerciseIds.map((exId) => {
                                      const ex = catalogExercises.find((e) => e.id === exId);
                                      return (
                                        <div key={exId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-white dark:bg-slate-700/50 border border-slate-100 dark:border-white/[0.07]">
                                          <span className="text-sm text-slate-700 dark:text-slate-200">
                                            {ex?.name ?? exId}
                                          </span>
                                          {ex?.muscleGroup && (
                                            <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                              {ex.muscleGroup}
                                            </span>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400 dark:text-slate-500 pl-2 italic">
                                    Sem exercícios — apenas rótulo
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Workout logs section */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-white/[0.07] flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center">
                <History size={15} className="text-violet-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 dark:text-white">Histórico de treinos</p>
                <p className="text-xs text-slate-400">Sessões registradas pelo aluno.</p>
              </div>
            </div>

            {studentLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 dark:text-slate-500">
                <History size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Nenhum treino registrado ainda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-white/[0.07]">
                      <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-6 py-3 uppercase tracking-wide">Treino</th>
                      <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Exercícios</th>
                      <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Duração</th>
                      <th className="text-left text-xs font-medium text-slate-400 dark:text-slate-500 px-4 py-3 uppercase tracking-wide">Data</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700/40">
                    {studentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-6 py-3.5">
                          <p className="font-medium text-slate-800 dark:text-slate-100">{log.workoutName}</p>
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {log.completedExercises.length} completados
                        </td>
                        <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400">
                          {log.durationMinutes ? `${log.durationMinutes} min` : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                            <CalendarDays size={13} />
                            {new Date(log.completedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-6 py-3 border-t border-slate-100 dark:border-white/[0.07]">
                  <p className="text-xs text-slate-400">
                    {studentLogs.length} sessão{studentLogs.length !== 1 ? 'ões' : ''} no total
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* â”€â”€ Tab: Evolução â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {activeTab === 'evolucao' && (() => {
        const allAssessments: StudentAssessment[] = allAssessmentsData;

        // Selected assessment for detail view
        const selectedId = selectedAssessmentId ?? allAssessments[0]?.id ?? null;
        const selected = allAssessments.find((a) => a.id === selectedId) ?? allAssessments[0] ?? null;
        const latest = allAssessments[0] ?? null;

        // Visible list
        const VISIBLE_LIMIT = 4;
        const visibleAssessments = showAllAssessments ? allAssessments : allAssessments.slice(0, VISIBLE_LIMIT);

        // 30-day comparison
        const cutoff30 = Date.now() - 30 * 86_400_000;
        const ref30 = allAssessments.find((a) => new Date(a.date).getTime() <= cutoff30) ?? null;
        const weightDiff30 = (latest?.weight != null && ref30?.weight != null) ? latest.weight - ref30.weight : null;
        const bfDiff30     = (latest?.bodyFat != null && ref30?.bodyFat != null) ? latest.bodyFat - ref30.bodyFat : null;
        const weeklyAvg    = (weightDiff30 != null && ref30 != null && latest != null) ? (() => {
          const days = Math.max(1, (new Date(latest.date).getTime() - new Date(ref30.date).getTime()) / 86_400_000);
          return weightDiff30 / (days / 7);
        })() : null;

        // Chart data filtered by period
        const chartCutoff = chartPeriod === 0 ? 0 : Date.now() - chartPeriod * 86_400_000;
        const chartData = [...allAssessments]
          .filter((a) => chartPeriod === 0 || new Date(a.date).getTime() >= chartCutoff)
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((a) => ({
            date: new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
            peso: a.weight,
          }));

        const PERIOD_OPTIONS = [
          { label: 'Ãšltimos 30 dias', value: 30 },
          { label: 'Ãšltimos 60 dias', value: 60 },
          { label: 'Ãšltimos 90 dias', value: 90 },
          { label: 'Tudo',            value: 0  },
        ];

        const _hasWeight = allAssessments.some((a) => a.weight != null);
        const _hasBF = allAssessments.some((a) => a.bodyFat != null);
        void _hasWeight; void _hasBF;

        return (
          <div className="grid grid-cols-[300px_1fr] gap-4 items-start">

            {/* â”€â”€ Left: Assessment list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            <div className="bg-white dark:bg-[#0D1025] border border-slate-100 dark:border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-white/[0.07]">
                <p className="text-sm font-semibold text-white">Avaliações</p>
                <button
                  onClick={() => setNewAssessmentOpen(true)}
                  className="flex items-center gap-1 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium px-3 py-1.5 rounded-xl transition-colors"
                >
                  <Plus size={13} />
                  Nova avaliação
                </button>
              </div>

              {allAssessments.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Activity size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Nenhuma avaliação ainda.</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-700/40">
                    {visibleAssessments.map((a) => {
                      const isSelected = a.id === selectedId;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedAssessmentId(a.id)}
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all ${
                            isSelected
                              ? 'bg-violet-500/10 border-l-2 border-violet-500'
                              : 'hover:bg-slate-700/30 border-l-2 border-transparent'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-violet-500/20' : 'bg-slate-700/50'}`}>
                            <CalendarDays size={16} className={isSelected ? 'text-violet-400' : 'text-slate-500'} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-slate-200 mb-1.5">
                              {new Date(a.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                            </p>
                            <div className="flex gap-4">
                              {a.weight != null && (
                                <div>
                                  <p className="text-sm font-bold text-white leading-none">{a.weight} kg</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Peso</p>
                                </div>
                              )}
                              {a.bodyFat != null && (
                                <div>
                                  <p className="text-sm font-bold text-white leading-none">{a.bodyFat} %</p>
                                  <p className="text-[10px] text-slate-500 mt-0.5">Gordura</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <ChevronDown size={14} className={`shrink-0 -rotate-90 ${isSelected ? 'text-violet-400' : 'text-slate-600'}`} />
                        </button>
                      );
                    })}
                  </div>

                  {allAssessments.length > VISIBLE_LIMIT && (
                    <button
                      onClick={() => setShowAllAssessments((p) => !p)}
                      className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-violet-400 hover:text-violet-300 border-t border-white/[0.07]/40 transition-colors"
                    >
                      {showAllAssessments
                        ? <><ChevronUp size={13} /> Mostrar menos</>
                        : <><ChevronDown size={13} /> Ver todas avaliações ({allAssessments.length})</>
                      }
                    </button>
                  )}
                </>
              )}
            </div>

            {/* â”€â”€ Right: Detail panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {selected ? (
              <div className="flex flex-col gap-4">

                {/* Metric cards row */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-400 mb-1.5">Peso atual</p>
                    <p className="text-2xl font-bold text-white">{latest?.weight != null ? `${latest.weight} kg` : '—'}</p>
                    {weightDiff30 != null && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${weightDiff30 <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {weightDiff30 <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {weightDiff30 > 0 ? '+' : ''}{weightDiff30.toFixed(1)} kg (30 dias)
                      </p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-400 mb-1.5">Méd. 30 dias</p>
                    <p className="text-2xl font-bold text-white">
                      {weeklyAvg != null ? `${weeklyAvg > 0 ? '+' : ''}${weeklyAvg.toFixed(1)}` : '—'}
                    </p>
                    {weeklyAvg != null && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${weeklyAvg <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {weeklyAvg <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {Math.abs(weeklyAvg).toFixed(2)} kg/semana
                      </p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-400 mb-1.5">Gordura atual</p>
                    <p className="text-2xl font-bold text-white">{latest?.bodyFat != null ? `${latest.bodyFat} %` : '—'}</p>
                    {bfDiff30 != null && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${bfDiff30 <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {bfDiff30 <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {bfDiff30 > 0 ? '+' : ''}{bfDiff30.toFixed(1)} p.p. (30 dias)
                      </p>
                    )}
                  </div>

                  <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl px-4 py-4">
                    <p className="text-xs text-slate-400 mb-1.5">Massa muscular</p>
                    <p className="text-2xl font-bold text-white">{latest?.muscleMass != null ? `${latest.muscleMass} kg` : '—'}</p>
                    {latest?.muscleMass != null && allAssessments[1]?.muscleMass != null && (() => {
                      const diff = latest.muscleMass - allAssessments[1].muscleMass;
                      return (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {diff >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                          {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                        </p>
                      );
                    })()}
                  </div>
                </div>

                {/* Chart */}
                <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-semibold text-white">Evolução do peso (kg)</p>
                    <div className="relative">
                      <select
                        value={chartPeriod}
                        onChange={(e) => setChartPeriod(Number(e.target.value))}
                        className="appearance-none bg-slate-700/60 border border-slate-600 text-xs text-slate-300 rounded-xl pl-3 pr-7 py-1.5 focus:outline-none focus:ring-1 focus:ring-violet-500 cursor-pointer"
                      >
                        {PERIOD_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                  </div>
                  {chartData.length >= 2 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} domain={['auto', 'auto']} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Line type="monotone" dataKey="peso" name="Peso (kg)" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4, fill: '#818cf8' }} activeDot={{ r: 6 }} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[200px] flex items-center justify-center text-xs text-slate-500">
                      {allAssessments.length < 2
                        ? 'Registre pelo menos 2 avaliações para ver o gráfico.'
                        : 'Sem dados no período. Selecione um intervalo mais amplo.'}
                    </div>
                  )}
                </div>

                {/* Outras medidas */}
                <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
                  <p className="text-sm font-semibold text-white mb-4">Outras medidas</p>
                  {[selected.leanMass, selected.waist, selected.hip, selected.arm, selected.thigh, selected.chest, selected.calf, selected.abdomen].every((v) => v == null) ? (
                    <p className="text-xs text-slate-500 italic">Nenhuma medida registrada.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
                      {[
                        { label: 'Massa magra',  value: selected.leanMass   != null ? `${selected.leanMass} kg`   : null },
                        { label: 'Cintura',      value: selected.waist      != null ? `${selected.waist} cm`      : null },
                        { label: 'Quadril',      value: selected.hip        != null ? `${selected.hip} cm`        : null },
                        { label: 'Braço',        value: selected.arm        != null ? `${selected.arm} cm`        : null },
                        { label: 'Coxa',         value: selected.thigh      != null ? `${selected.thigh} cm`      : null },
                        { label: 'Peitoral',     value: selected.chest      != null ? `${selected.chest} cm`      : null },
                        { label: 'Panturrilha',  value: selected.calf       != null ? `${selected.calf} cm`       : null },
                        { label: 'Abdômen',      value: selected.abdomen    != null ? `${selected.abdomen} cm`    : null },
                      ].filter((m) => m.value != null).map(({ label, value }) => (
                        <div key={label} className="flex items-center justify-between py-1.5 border-b border-white/[0.07]/30 last:border-0">
                          <p className="text-xs text-slate-400">{label}</p>
                          <p className="text-xs font-semibold text-slate-200">{value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {selected.notes && (
                  <div className="bg-white dark:bg-[#0D1025] border border-white/[0.07] rounded-2xl px-5 py-4">
                    <p className="text-sm font-semibold text-white mb-2">Observações da avaliação</p>
                    <p className="text-sm text-slate-300">{selected.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
                <Activity size={32} className="opacity-30" />
                <p className="text-sm">Nenhuma avaliação registrada ainda.</p>
                <button
                  onClick={() => setNewAssessmentOpen(true)}
                  className="text-xs text-violet-400 hover:underline"
                >
                  Registrar primeira avaliação
                </button>
              </div>
            )}
          </div>
        );
      })()}

      {/* â”€â”€ Modal: New Assessment â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {newAssessmentOpen && (
        <NewAssessmentModal
          studentId={student.id}
          studentName={student.name}
          onClose={() => setNewAssessmentOpen(false)}
        />
      )}

      {/* â”€â”€ Modal: New Diet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {newDietOpen && (
        <NewDietModal
          studentId={student.id}
          studentName={student.name}
          onClose={() => setNewDietOpen(false)}
        />
      )}

      {/* â”€â”€ Modal: New Workout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {weeklyPlanOpen && (
        <NewWorkoutModal
          studentId={student.id}
          studentName={student.name}
          onClose={() => setWeeklyPlanOpen(false)}
        />
      )}

      {/* â”€â”€ Modal: Assign Workout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {assignWorkoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-white mb-1">Atribuir treino</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Para: <strong className="text-slate-700 dark:text-slate-200">{student.name}</strong></p>
            {unassignedWorkouts.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Todos os treinos já foram atribuídos.</p>
            ) : (
              <select
                value={selectedWorkoutId}
                onChange={(e) => setSelectedWorkoutId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecione um treino</option>
                {unassignedWorkouts.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={() => setAssignWorkoutOpen(false)} className="flex-1 border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#0D1025] transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAssignWorkout}
                disabled={!selectedWorkoutId}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-indigo-700 transition-colors"
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Modal: Assign Diet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {assignDietOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-white mb-1">Atribuir dieta</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Para: <strong className="text-slate-700 dark:text-slate-200">{student.name}</strong></p>
            {unassignedDiets.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">Todas as dietas já foram atribuídas.</p>
            ) : (
              <select
                value={selectedDietId}
                onChange={(e) => setSelectedDietId(e.target.value)}
                className="w-full border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Selecione uma dieta</option>
                {unassignedDiets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            )}
            <div className="flex gap-3">
              <button onClick={() => setAssignDietOpen(false)} className="flex-1 border border-slate-200 dark:border-white/[0.07] text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-[#0D1025] transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleAssignDiet}
                disabled={!selectedDietId}
                className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-40 hover:bg-emerald-700 transition-colors"
              >
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Workout view modal */}
      {viewingWorkout && (
        <WorkoutViewModal
          workout={viewingWorkout}
          exercises={exercises}
          onClose={() => setViewingWorkout(null)}
        />
      )}

      {/* Workout edit modal */}
      {editingWorkout && (
        <WorkoutEditModal
          workout={editingWorkout}
          exercises={exercises}
          assignment={studentAssignments.find((a) => a.workoutId === editingWorkout.id)}
          onClose={() => setEditingWorkout(null)}
        />
      )}

    </div>
  );
}
