import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudentAssignments, useAddWorkoutLog } from '../../hooks/useWorkouts';
import { ArrowLeft, Play, CheckSquare, Square, Video, Trophy, ChevronRight, Clock, Dumbbell } from 'lucide-react';

const DAY_LABEL: Record<string, string> = {
  segunda: 'Seg',
  terca:   'Ter',
  quarta:  'Qua',
  quinta:  'Qui',
  sexta:   'Sex',
  sabado:  'Sáb',
  domingo: 'Dom',
};

const TODAY_MAP = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

type Step = 'select-workout' | 'workout' | 'done';

export default function AlunoTreinoPage() {
  const { user } = useAuth();
  const { data: assignments = [] } = useStudentAssignments();
  const addLogMutation = useAddWorkoutLog();
  const navigate = useNavigate();

  const todayKey = TODAY_MAP[new Date().getDay()];

  const studentAssignments = assignments;

  const [step,               setStep]               = useState<Step>('select-workout');
  const [selectedAssignId,   setSelectedAssignId]   = useState<string | null>(null);
  const [checked,            setChecked]            = useState<Set<string>>(new Set());

  const startTimeRef = useRef<Date>(new Date());

  const selectedAssign = studentAssignments.find((a) => a.id === selectedAssignId);
  // workoutExercises come from the assignment's embedded workout (not available here);
  // we only have assignment metadata. For exercise list, we'd need a separate fetch.
  // For now keep an empty array — the workout exercises are shown via WorkoutViewModal or similar.
  const workoutExercises: import('../../types').WorkoutExercise[] = [];

  function handleSelectAssignment(assignId: string) {
    setSelectedAssignId(assignId);
    setChecked(new Set());
    startTimeRef.current = new Date();
    setStep('workout');
  }

  function toggleCheck(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function handleFinish() {
    if (!user || !selectedAssign) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current.getTime()) / 60000);
    addLogMutation.mutate({
      assignmentId: selectedAssign.id,
      workoutId: selectedAssign.workoutId,
      workoutName: selectedAssign.workoutName,
      studentId: user.id,
      completedAt: new Date().toISOString(),
      completedExercises: Array.from(checked),
      durationMinutes: Math.max(1, elapsed),
    });
    setStep('done');
  }

  const progress = workoutExercises.length > 0 ? (checked.size / workoutExercises.length) * 100 : 0;

  // ── STEP: select-workout ───────────────────────────────────────────────────────
  if (step === 'select-workout') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/aluno/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Iniciar treino</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Escolha o treino</p>
          </div>
        </div>

        {studentAssignments.length === 0 ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Dumbbell size={40} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum treino atribuído.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {studentAssignments.map((assign) => {
              const workout  = workouts.find((w) => w.id === assign.workoutId);
              const isToday  = !!(assign.scheduledDays?.includes(todayKey));
              const exCount  = workout?.exercises.length ?? 0;
              const duration = workout?.durationMinutes;

              return (
                <button
                  key={assign.id}
                  onClick={() => handleSelectAssignment(assign.id)}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors ${
                    isToday
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-semibold truncate ${
                        isToday ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {assign.workoutName}
                      </p>
                      {isToday && (
                        <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">
                          Hoje
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {exCount} exercício{exCount !== 1 ? 's' : ''}
                      </span>
                      {duration && (
                        <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock size={10} />
                          {duration} min
                        </span>
                      )}
                      {assign.scheduledDays && assign.scheduledDays.length > 0 && (
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {assign.scheduledDays.map((d) => DAY_LABEL[d] ?? d).join(' · ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={16} className={isToday ? 'text-indigo-500' : 'text-slate-400'} />
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: workout ──────────────────────────────────────────────────────────────
  if (step === 'workout' && selectedAssign) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex flex-col min-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep('select-workout')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {selectedAssign.workoutName}
            </h1>
          </div>
        </div>

        {/* Progress bar */}
        {workoutExercises.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{checked.size} / {workoutExercises.length} feitos</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Exercise list */}
        <div className="flex-1 flex flex-col gap-2 mb-6">
          {workoutExercises.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              Nenhum exercício neste treino.
            </p>
          ) : (
            workoutExercises.map((ex) => {
              const done = checked.has(ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleCheck(ex.id)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-colors ${
                    done
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50'
                      : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {done
                    ? <CheckSquare size={18} className="text-emerald-500 shrink-0" />
                    : <Square size={18} className="text-slate-400 shrink-0" />
                  }
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      done ? 'text-emerald-700 dark:text-emerald-300 line-through' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {ex.exerciseName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {ex.sets}x{ex.reps}
                      {ex.weight ? ` · ${ex.weight}` : ''}
                      {ex.restSeconds ? ` · descanso ${ex.restSeconds}s` : ''}
                    </p>
                    {ex.notes && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">{ex.notes}</p>
                    )}
                  </div>
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                      title="Ver vídeo"
                    >
                      <Video size={14} />
                    </a>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Finish button */}
        <button
          onClick={handleFinish}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Play size={16} fill="currentColor" />
          Finalizar treino
        </button>
      </div>
    );
  }

  // ── STEP: done ─────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 max-w-2xl mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-5">
        <Trophy size={36} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Treino finalizado!</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
        {selectedAssign?.workoutName ?? 'Treino'}
      </p>
      <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
        {checked.size} de {workoutExercises.length} exercícios concluídos
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/aluno/dashboard')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          Ir para o dashboard
        </button>
        <button
          onClick={() => { setStep('select-workout'); setSelectedAssignId(null); }}
          className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Fazer outro treino
        </button>
      </div>
    </div>
  );
}
