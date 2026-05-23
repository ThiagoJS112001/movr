import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  useStudentAssignments,
  useStudentWorkouts,
  useWorkoutLogs,
  useAddWorkoutLog,
} from '../../hooks/useWorkouts';
import { useMyWeeklyPlan } from '../../hooks/useWeeklyPlans';
import { supabase } from '../../lib/supabase';
import { Play, CheckSquare, Square, Video, Trophy, Check } from 'lucide-react';
import type { WorkoutAssignment, Workout, WorkoutLog, WorkoutExercise } from '../../types';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const WEEK_KEYS  = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const WEEK_ABBRS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÃB', 'DOM'];

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function getWeekDates(): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getTodayWeekIdx(): number {
  const dow = new Date().getDay();
  return dow === 0 ? 6 : dow - 1;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function fmtShortDate(date: Date): string {
  const wd = date.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dd = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  return `${wd.charAt(0).toUpperCase()}${wd.slice(1)}, ${dd}`;
}

// â”€â”€ Muscle-group tag colours â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const MG_COLORS: Record<string, string> = {
  QuadrÃ­ceps:  'bg-indigo-900/60 text-indigo-300',
  Posterior:   'bg-purple-900/60 text-purple-300',
  GlÃºteos:     'bg-pink-900/60 text-pink-300',
  Costas:      'bg-teal-900/60 text-teal-300',
  BÃ­ceps:      'bg-blue-900/60 text-blue-300',
  AntebraÃ§o:   'bg-cyan-900/60 text-cyan-300',
  Peito:       'bg-violet-900/60 text-violet-300',
  TrÃ­ceps:     'bg-orange-900/60 text-orange-300',
  Ombros:      'bg-amber-900/60 text-amber-300',
  DeltÃ³ide:    'bg-amber-900/60 text-amber-300',
  AbdÃ´men:     'bg-lime-900/60 text-lime-300',
  Panturrilha: 'bg-emerald-900/60 text-emerald-300',
};

function getMgClass(mg: string): string {
  return MG_COLORS[mg] ?? 'bg-slate-700/80 text-slate-300';
}

// â”€â”€ Day-card type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type DayCard = {
  idx: number;
  date: Date;
  dayKey: string;
  abbr: string;
  assignment: WorkoutAssignment | null;
  workout: Workout | null;
  log: WorkoutLog | null;
  planLabel: string;
  status: 'done' | 'today' | 'upcoming' | 'rest';
};

type WorkoutStep = 'list' | 'active' | 'done';

// â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
export default function AlunoTreinoPage() {
  const { user } = useAuth();
  const { data: assignments = [] }   = useStudentAssignments();
  const workoutIds = [...new Set(assignments.map((a) => a.workoutId))];
  const { data: workoutsList = [] }  = useStudentWorkouts(workoutIds);
  const { data: allLogs = [] }       = useWorkoutLogs(user?.id ?? '');
  const addLogMutation               = useAddWorkoutLog();
  const { data: weeklyPlan }         = useMyWeeklyPlan();

  const weekDates = getWeekDates();
  const todayIdx  = getTodayWeekIdx();

  const [view,             setView]             = useState<'semana' | 'todas'>('semana');
  const [step,             setStep]             = useState<WorkoutStep>('list');
  const [selectedAssignId, setSelectedAssignId] = useState<string | null>(null);
  const [checked,          setChecked]          = useState<Set<string>>(new Set());
  const [personalName,     setPersonalName]     = useState('');
  const startTimeRef = useRef<Date>(new Date());

  const workoutsMap: Record<string, Workout> = Object.fromEntries(
    (workoutsList ?? []).map((w) => [w.id, w]),
  );

  useEffect(() => {
    const pid = assignments[0]?.personalId;
    if (!pid) return;
    supabase.from('profiles').select('name').eq('id', pid).single()
      .then(({ data }) => { if (data?.name) setPersonalName(data.name); });
  }, [assignments]);

  // â”€â”€ Data helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function getAssignmentForDay(dayKey: string): WorkoutAssignment | null {
    return assignments.find((a) => a.scheduledDays?.includes(dayKey)) ?? null;
  }

  function getLogForDay(assignmentId: string, date: Date): WorkoutLog | null {
    return (
      allLogs.find(
        (l) => l.assignmentId === assignmentId && isSameDay(new Date(l.completedAt), date),
      ) ?? null
    );
  }

  function getLogThisWeek(assignmentId: string): WorkoutLog | null {
    for (const d of weekDates) {
      const log = getLogForDay(assignmentId, d);
      if (log) return log;
    }
    return null;
  }

  // â”€â”€ Week cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weekCards: DayCard[] = weekDates.map((date, idx) => {
    const dayKey     = WEEK_KEYS[idx];
    const assignment = getAssignmentForDay(dayKey);
    const workout    = assignment ? (workoutsMap[assignment.workoutId] ?? null) : null;
    const log        = assignment ? getLogThisWeek(assignment.id) : null;
    const planDay    = weeklyPlan?.days.find((d) => d.dayOfWeek === dayKey);
    const planLabel  = planDay?.label ?? '';

    let status: DayCard['status'];
    if (!assignment)           status = 'rest';
    else if (log)              status = 'done';
    else if (idx === todayIdx) status = 'today';
    else                       status = 'upcoming';

    return { idx, date, dayKey, abbr: WEEK_ABBRS[idx], assignment, workout, log, planLabel, status };
  });

  // â”€â”€ Active workout data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const selectedAssign  = assignments.find((a) => a.id === selectedAssignId);
  const selectedWorkout = selectedAssign ? workoutsMap[selectedAssign.workoutId] : null;
  const workoutExercises: WorkoutExercise[] = selectedWorkout?.exercises ?? [];
  const progress = workoutExercises.length > 0 ? (checked.size / workoutExercises.length) * 100 : 0;

  function startWorkout(assignId: string) {
    setSelectedAssignId(assignId);
    setChecked(new Set());
    startTimeRef.current = new Date();
    setStep('active');
  }

  function toggleCheck(exId: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(exId) ? next.delete(exId) : next.add(exId);
      return next;
    });
  }

  function handleFinish() {
    if (!user || !selectedAssign) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current.getTime()) / 60000);
    addLogMutation.mutate({
      assignmentId: selectedAssign.id,
      workoutId:    selectedAssign.workoutId,
      workoutName:  selectedAssign.workoutName,
      studentId:    user.id,
      completedAt:  new Date().toISOString(),
      completedExercises: Array.from(checked),
      durationMinutes: Math.max(1, elapsed),
    });
    setStep('done');
  }

  // â”€â”€â”€ STEP: active â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'active' && selectedAssign) {
    return (
      <div className="min-h-screen bg-[#080B18] flex flex-col pb-20">
        <div className="flex items-center gap-3 px-4 pt-5 pb-4">
          <button
            onClick={() => setStep('list')}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#0D1025] transition-colors"
          >
            â†
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">{selectedAssign.workoutName}</h1>
            <p className="text-xs text-slate-400">Treino ativo</p>
          </div>
        </div>

        {workoutExercises.length > 0 && (
          <div className="px-4 mb-4">
            <div className="flex justify-between text-xs text-slate-400 mb-1.5">
              <span>{checked.size} / {workoutExercises.length} concluÃ­dos</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-[#0D1025] rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col gap-2 px-4 mb-6">
          {workoutExercises.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhum exercÃ­cio neste treino.</p>
          ) : (
            workoutExercises.map((ex) => {
              const done = checked.has(ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleCheck(ex.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-colors ${
                    done
                      ? 'bg-emerald-950/50 border-emerald-800/50'
                      : 'bg-slate-900 border-slate-800 hover:bg-[#0D1025]'
                  }`}
                >
                  {done
                    ? <CheckSquare size={18} className="text-emerald-400 shrink-0" />
                    : <Square size={18} className="text-slate-500 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${done ? 'text-emerald-400 line-through' : 'text-white'}`}>
                      {ex.exerciseName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {ex.sets} sÃ©ries Â· {ex.reps} reps{ex.weight ? ` Â· ${ex.weight}` : ''}
                    </p>
                  </div>
                  {ex.muscleGroup && (
                    <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getMgClass(ex.muscleGroup)}`}>
                      {ex.muscleGroup}
                    </span>
                  )}
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors"
                    >
                      <Video size={14} />
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="px-4">
          <button
            onClick={handleFinish}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
          >
            <Play size={16} fill="currentColor" />
            Finalizar treino
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ STEP: done â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (step === 'done') {
    return (
      <div className="min-h-screen bg-[#080B18] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full bg-indigo-900/40 flex items-center justify-center mb-5">
          <Trophy size={36} className="text-indigo-400" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Treino finalizado!</h1>
        <p className="text-slate-400 text-sm mb-1">{selectedAssign?.workoutName ?? 'Treino'}</p>
        <p className="text-slate-500 text-sm mb-8">
          {checked.size} de {workoutExercises.length} exercÃ­cios concluÃ­dos
        </p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => setStep('list')}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition-colors"
          >
            Ver meus treinos
          </button>
          <button
            onClick={() => { setStep('list'); setSelectedAssignId(null); }}
            className="w-full border border-white/[0.07] text-slate-300 font-medium py-3 rounded-2xl hover:bg-[#0D1025] transition-colors"
          >
            Fazer outro treino
          </button>
        </div>
      </div>
    );
  }

  // â”€â”€â”€ STEP: list â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const withWorkout = weekCards.filter((c) => c.assignment !== null);
  const todayCard   = withWorkout.find((c) => c.status === 'today');
  const pastCards   = withWorkout.filter((c) => c.status === 'done').reverse();
  const futureCards = withWorkout.filter((c) => c.status === 'upcoming');
  const orderedCards = [
    ...(todayCard ? [todayCard] : []),
    ...pastCards,
    ...futureCards,
  ];

  return (
    <div className="min-h-screen bg-[#080B18] pb-20">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus Treinos</h1>
          {personalName && (
            <p className="text-sm text-slate-400 mt-0.5">
              Plano montado por {personalName}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0 mt-1">
          <button
            onClick={() => setView('semana')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              view === 'semana'
                ? 'bg-white text-slate-900'
                : 'bg-[#0D1025] text-slate-400 hover:bg-slate-700'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView('todas')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
              view === 'todas'
                ? 'bg-white text-slate-900'
                : 'bg-[#0D1025] text-slate-400 hover:bg-slate-700'
            }`}
          >
            Todas as fichas
          </button>
        </div>
      </div>

      {/* Week day strip */}
      <div className="px-4 mb-5">
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {weekCards.map((card) => (
            <div
              key={card.idx}
              className={`flex flex-col items-center min-w-[46px] py-2.5 px-1 rounded-2xl flex-shrink-0 ${
                card.idx === todayIdx
                  ? 'bg-indigo-600'
                  : card.status === 'done'
                  ? 'bg-emerald-900/30'
                  : 'bg-[#0D1025]/60'
              }`}
            >
              <span className={`text-[11px] font-semibold ${
                card.idx === todayIdx ? 'text-indigo-200' : 'text-slate-500'
              }`}>
                {card.abbr}
              </span>
              <span className={`text-xl font-bold leading-tight ${
                card.idx === todayIdx
                  ? 'text-white'
                  : card.status === 'done'
                  ? 'text-emerald-300'
                  : 'text-slate-300'
              }`}>
                {card.date.getDate()}
              </span>
              {card.status === 'done'
                ? <Check size={11} className="text-emerald-400 mt-0.5" />
                : <span className="mt-0.5 h-3" />
              }
              <span className={`text-[10px] text-center leading-tight max-w-[44px] truncate ${
                card.idx === todayIdx ? 'text-indigo-200' : 'text-slate-600'
              }`}>
                {card.idx === todayIdx
                  ? card.planLabel || 'Hoje'
                  : card.status === 'done' && card.planLabel
                  ? card.planLabel
                  : card.status === 'upcoming' && card.planLabel
                  ? card.planLabel
                  : card.status === 'upcoming' && card.assignment
                  ? card.assignment.workoutName.replace('Treino ', '')
                  : 'Desc'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workout cards */}
      {view === 'semana' && (
        <div className="px-4 flex flex-col gap-4">
          {orderedCards.length === 0 && (
            <p className="text-center text-slate-500 text-sm py-12">
              Nenhum treino nesta semana.
            </p>
          )}
          {orderedCards.map((card) => (
            <WorkoutCard
              key={card.idx}
              card={card}
              onStart={() => card.assignment && startWorkout(card.assignment.id)}
            />
          ))}
        </div>
      )}

      {view === 'todas' && (
        <div className="px-4 flex flex-col gap-3">
          {assignments.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-12">
              Nenhuma ficha atribuÃ­da.
            </p>
          ) : (
            assignments.map((assign) => (
              <AllFichaCard
                key={assign.id}
                assignment={assign}
                workout={workoutsMap[assign.workoutId] ?? null}
                onStart={() => startWorkout(assign.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// â”€â”€ WorkoutCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function WorkoutCard({ card, onStart }: { card: DayCard; onStart: () => void }) {
  const { assignment, workout, log, status, date, planLabel } = card;
  if (!assignment) return null;

  const exercises = workout?.exercises ?? [];
  const preview   = exercises.slice(0, 3);
  const remaining = exercises.length - 3;
  const exCount   = exercises.length;
  const duration  = workout?.durationMinutes;

  const muscleGroups = [
    ...new Set(exercises.map((e) => e.muscleGroup).filter(Boolean)),
  ] as string[];

  const dateLabel = status === 'today' ? 'Hoje' : fmtShortDate(date);

  return (
    <div className={`rounded-2xl border overflow-hidden ${
      status === 'today' ? 'bg-slate-900 border-indigo-600/30' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
            status === 'today'
              ? 'bg-indigo-600 text-white'
              : status === 'done'
              ? 'bg-emerald-900/50 text-emerald-300'
              : 'bg-[#0D1025] text-slate-300'
          }`}>
            {assignment.workoutName.replace('Treino ', '').charAt(0) || 'T'}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">
              {assignment.workoutName} Â· {dateLabel}
            </p>
            <h3 className="text-base font-bold text-white leading-snug truncate">
              {planLabel || assignment.workoutName}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {exCount} exercÃ­cios
              {duration ? ` Â· ~${duration} min` : ''}
              {muscleGroups.length > 0 ? ` Â· ${muscleGroups.slice(0, 3).join(', ')}` : ''}
            </p>
          </div>

          {status === 'today' && (
            <span className="shrink-0 text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-medium">
              Hoje
            </span>
          )}
          {status === 'done' && (
            <span className="shrink-0 flex items-center gap-1 text-xs bg-emerald-900/40 text-emerald-400 px-2 py-0.5 rounded-full font-medium border border-emerald-800/50">
              <Check size={10} />
              ConcluÃ­do
            </span>
          )}
        </div>
      </div>

      {/* Exercise rows */}
      {(status === 'today' || status === 'done') && exercises.length > 0 && (
        <div className="border-t border-slate-800">
          {preview.map((ex, i) => (
            <div
              key={ex.id}
              className={`flex items-center px-4 py-2.5 gap-3 ${
                i < preview.length - 1 ? 'border-b border-white/[0.07]' : ''
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                status === 'done' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-[#0D1025] text-slate-400'
              }`}>
                {status === 'done' ? 'âœ“' : i + 1}
              </span>
              <span className={`flex-1 text-sm truncate ${
                status === 'done' ? 'text-slate-500 line-through' : 'text-slate-200'
              }`}>
                {ex.exerciseName}
              </span>
              <span className="text-xs text-slate-600 shrink-0">
                {ex.sets} sÃ©ries Â· {ex.reps} reps{ex.weight ? ` Â· ${ex.weight}` : ''}
              </span>
              {ex.muscleGroup && (
                <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full ${getMgClass(ex.muscleGroup)}`}>
                  {ex.muscleGroup}
                </span>
              )}
            </div>
          ))}
          {remaining > 0 && (
            <div className="px-4 py-2 text-xs text-slate-500">
              +{remaining} mais exercÃ­cios
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className={`flex items-center justify-between px-4 py-3 ${
        (status === 'today' || status === 'done') && exercises.length > 0
          ? 'border-t border-slate-800'
          : ''
      }`}>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          {status === 'done' && log ? (
            <>
              <span>
                {log.completedExercises.length > 0
                  ? `${log.completedExercises.length} exercÃ­cios`
                  : `${exCount} exercÃ­cios`}
              </span>
              {log.durationMinutes && <span>{log.durationMinutes} min</span>}
            </>
          ) : (
            <>
              {exCount > 0 && <span>{exCount} exercÃ­cios</span>}
              {duration && <span>~{duration} min</span>}
            </>
          )}
        </div>

        {status === 'today' && (
          <button
            onClick={onStart}
            className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
          >
            <Play size={13} fill="currentColor" />
            Iniciar treino
          </button>
        )}
        {status === 'done' && (
          <button className="text-sm text-slate-400 border border-white/[0.07] px-3 py-1.5 rounded-xl hover:bg-[#0D1025] transition-colors">
            Ver detalhes
          </button>
        )}
        {status === 'upcoming' && (
          <button
            onClick={onStart}
            className="text-sm text-slate-300 border border-white/[0.07] px-3 py-1.5 rounded-xl hover:bg-[#0D1025] transition-colors"
          >
            Ver ficha
          </button>
        )}
      </div>
    </div>
  );
}

// â”€â”€ AllFichaCard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const DAY_ABBR: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'SÃ¡b', domingo: 'Dom',
};

function AllFichaCard({
  assignment,
  workout,
  onStart,
}: {
  assignment: WorkoutAssignment;
  workout: Workout | null;
  onStart: () => void;
}) {
  const exCount  = workout?.exercises.length ?? 0;
  const duration = workout?.durationMinutes;
  const days     = assignment.scheduledDays ?? [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-900/50 flex items-center justify-center text-indigo-300 font-bold text-base shrink-0">
          {assignment.workoutName.replace('Treino ', '').charAt(0) || 'T'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white truncate">{assignment.workoutName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {exCount > 0 && <span className="text-xs text-slate-500">{exCount} exercÃ­cios</span>}
            {duration && <span className="text-xs text-slate-500">~{duration} min</span>}
            {days.length > 0 && (
              <span className="text-xs text-slate-600">
                {days.map((d) => DAY_ABBR[d] ?? d).join(' Â· ')}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onStart}
          className="shrink-0 flex items-center gap-1 text-xs text-indigo-400 border border-indigo-800/50 px-3 py-1.5 rounded-xl hover:bg-indigo-900/30 transition-colors"
        >
          <Play size={12} fill="currentColor" />
          Iniciar
        </button>
      </div>
    </div>
  );
}
