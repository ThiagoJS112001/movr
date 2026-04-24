import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ArrowLeft, Play, CheckSquare, Square, Video, Trophy, Moon, ChevronRight } from 'lucide-react';

const DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
type DayKey = typeof DAYS[number];

const DAYS_LABEL: Record<DayKey, string> = {
  segunda: 'Segunda-feira',
  terca:   'Terça-feira',
  quarta:  'Quarta-feira',
  quinta:  'Quinta-feira',
  sexta:   'Sexta-feira',
  sabado:  'Sábado',
  domingo: 'Domingo',
};

const TODAY_MAP: DayKey[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

type Step = 'select-day' | 'workout' | 'done';

export default function AlunoTreinoPage() {
  const { user } = useAuth();
  const { getWeeklyPlan, exercises, addWorkoutSession } = useApp();
  const navigate = useNavigate();

  const plan    = user ? getWeeklyPlan(user.id) : undefined;
  const todayKey = TODAY_MAP[new Date().getDay()];

  const [step,        setStep]        = useState<Step>('select-day');
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [checked,     setChecked]     = useState<Set<string>>(new Set());

  const startTimeRef = useRef<Date>(new Date());

  const selectedDayData = plan?.days.find((d) => d.dayOfWeek === selectedDay);
  const dayExercises = selectedDayData
    ? selectedDayData.exerciseIds
        .map((id) => exercises.find((e) => e.id === id))
        .filter(Boolean) as typeof exercises
    : [];

  function handleSelectDay(day: DayKey) {
    const dayData = plan?.days.find((d) => d.dayOfWeek === day);
    if (!dayData || (dayData.exerciseIds.length === 0 && !dayData.label.trim())) return;
    setSelectedDay(day);
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
    if (!user || !selectedDay || !selectedDayData) return;
    const elapsed = Math.round((Date.now() - startTimeRef.current.getTime()) / 60000);
    addWorkoutSession({
      studentId: user.id,
      dayOfWeek: selectedDay,
      label: selectedDayData.label || 'Treino',
      completedExerciseIds: Array.from(checked),
      durationMinutes: Math.max(1, elapsed),
      completedAt: new Date().toISOString(),
    });
    setStep('done');
  }

  const progress = dayExercises.length > 0 ? (checked.size / dayExercises.length) * 100 : 0;

  // ── STEP: select-day ──────────────────────────────────────────────────────────
  if (step === 'select-day') {
    return (
      <div className="p-5 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/aluno/dashboard')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">Iniciar treino</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Escolha o dia</p>
          </div>
        </div>

        {!plan ? (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <p className="text-sm">Nenhum plano semanal disponível.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {DAYS.map((day) => {
              const dayData    = plan.days.find((d) => d.dayOfWeek === day);
              const hasWorkout = !!(dayData && (dayData.exerciseIds.length > 0 || dayData.label.trim()));
              const isToday    = day === todayKey;

              return (
                <button
                  key={day}
                  onClick={() => hasWorkout && handleSelectDay(day)}
                  disabled={!hasWorkout}
                  className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl border text-left transition-colors ${
                    isToday && hasWorkout
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/30'
                      : hasWorkout
                      ? 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700/30 opacity-50 cursor-default'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold ${
                        isToday && hasWorkout
                          ? 'text-indigo-700 dark:text-indigo-300'
                          : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {DAYS_LABEL[day]}
                      </p>
                      {isToday && (
                        <span className="text-xs bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-medium">
                          Hoje
                        </span>
                      )}
                    </div>
                    {hasWorkout ? (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {dayData?.label || 'Treino'}{dayData && dayData.exerciseIds.length > 0 ? ` · ${dayData.exerciseIds.length} exercícios` : ''}
                      </p>
                    ) : (
                      <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        <Moon size={11} />
                        <span>Descanso</span>
                      </div>
                    )}
                  </div>
                  {hasWorkout && (
                    <ChevronRight size={16} className={isToday ? 'text-indigo-500' : 'text-slate-400'} />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── STEP: workout ──────────────────────────────────────────────────────────────
  if (step === 'workout' && selectedDay && selectedDayData) {
    return (
      <div className="p-5 max-w-lg mx-auto flex flex-col min-h-[70vh]">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => setStep('select-day')}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100 truncate">
              {selectedDayData.label || 'Treino'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{DAYS_LABEL[selectedDay]}</p>
          </div>
        </div>

        {/* Progress bar */}
        {dayExercises.length > 0 && (
          <div className="mb-4">
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
              <span>{checked.size} / {dayExercises.length} feitos</span>
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
          {dayExercises.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
              Nenhum exercício neste dia.
            </p>
          ) : (
            dayExercises.map((ex) => {
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
                      {ex.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">{ex.muscleGroup}</p>
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
    <div className="p-5 max-w-lg mx-auto flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="w-20 h-20 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center mb-5">
        <Trophy size={36} className="text-indigo-600 dark:text-indigo-400" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Treino finalizado!</h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-1">
        {selectedDayData?.label || 'Treino'} · {DAYS_LABEL[selectedDay ?? 'segunda']}
      </p>
      <p className="text-slate-400 dark:text-slate-500 text-sm mb-8">
        {checked.size} de {dayExercises.length} exercícios concluídos
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => navigate('/aluno/dashboard')}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-2xl transition-colors"
        >
          Ir para o dashboard
        </button>
        <button
          onClick={() => { setStep('select-day'); setSelectedDay(null); }}
          className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-medium py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        >
          Fazer outro treino
        </button>
      </div>
    </div>
  );
}
