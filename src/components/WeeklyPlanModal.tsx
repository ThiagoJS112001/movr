import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useExercises } from '../hooks/useExercises';
import { useWeeklyPlan, useSetWeeklyPlan, useArchiveWeeklyPlan } from '../hooks/useWeeklyPlans';
import { toast } from 'sonner';
import {
  CalendarDays, X, Check, Plus, Archive, History,
  Search, SlidersHorizontal, Dumbbell, GripVertical,
  ClipboardList, Sparkles, Info,
} from 'lucide-react';
import type { WeeklyDay } from '../types';

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

const DAYS_SHORT: Record<DayKey, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
};

function getMuscleGroupColor(group: string): string {
  const map: Record<string, string> = {
    'Peito':       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Costas':      'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    'Pernas':      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Ombros':      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Bíceps':      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Tríceps':     'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    'Abdômen':     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Panturrilha': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  };
  return map[group] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

function makeEmptyDays(): WeeklyDay[] {
  return DAYS.map((d) => ({ dayOfWeek: d, label: '', exerciseIds: [] }));
}

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export default function WeeklyPlanModal({ studentId, studentName, onClose }: Props) {
  const { user } = useAuth();
  const { data: exercises = [] } = useExercises();
  const { data: existingPlan } = useWeeklyPlan(studentId);
  const setWeeklyPlanMutation = useSetWeeklyPlan();
  const archiveMutation = useArchiveWeeklyPlan();
  const navigate = useNavigate();

  const existing = existingPlan;
  const [planDays,             setPlanDays]             = useState<WeeklyDay[]>(
    existing ? existing.days.map((d) => ({ ...d })) : makeEmptyDays(),
  );
  const [planActiveDay,        setPlanActiveDay]        = useState<DayKey>('segunda');
  const [exerciseSearch,       setExerciseSearch]       = useState('');
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('');
  const [showArchiveConfirm,   setShowArchiveConfirm]   = useState(false);

  const uniqueMuscleGroups = useMemo(
    () => [...new Set(exercises.map((ex) => ex.muscleGroup))].sort(),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase();
    return exercises.filter((ex) => {
      const matchesName   = ex.name.toLowerCase().includes(q);
      const matchesMuscle = !exerciseMuscleFilter || ex.muscleGroup === exerciseMuscleFilter;
      return matchesName && matchesMuscle;
    });
  }, [exercises, exerciseSearch, exerciseMuscleFilter]);

  const activeDayData = planDays.find((d) => d.dayOfWeek === planActiveDay);

  function resetPlanDays() {
    setPlanDays(makeEmptyDays());
    setPlanActiveDay('segunda');
    setExerciseSearch('');
    setExerciseMuscleFilter('');
    setShowArchiveConfirm(false);
  }

  function handleNewPlan() {
    const hasContent = planDays.some((d) => d.label.trim() || d.exerciseIds.length > 0);
    if (hasContent) {
      setShowArchiveConfirm(true);
    } else {
      resetPlanDays();
    }
  }

  function updateActiveDayLabel(value: string) {
    setPlanDays((prev) =>
      prev.map((d) => d.dayOfWeek === planActiveDay ? { ...d, label: value } : d),
    );
  }

  function togglePlanExercise(exerciseId: string) {
    setPlanDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== planActiveDay) return d;
        const has = d.exerciseIds.includes(exerciseId);
        return {
          ...d,
          exerciseIds: has
            ? d.exerciseIds.filter((id) => id !== exerciseId)
            : [...d.exerciseIds, exerciseId],
        };
      }),
    );
  }

  function handleSavePlan() {
    if (!user) return;
    setWeeklyPlanMutation.mutate({ studentId, days: planDays });
    onClose();
    toast.success('Plano semanal salvo!');
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

        {/* Archive confirmation overlay */}
        {showArchiveConfirm && (
          <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 rounded-2xl z-10 flex flex-col items-center justify-center gap-5 px-8 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
              <Archive size={26} className="text-amber-500" />
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">Arquivar plano atual?</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                O plano de <strong>{studentName}</strong> já possui conteúdo. Deseja enviá-lo para o histórico antes de criar um novo?
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <button
                onClick={() => {
                  archiveMutation.mutate({ studentId, studentName, days: planDays });
                  resetPlanDays();
                  toast.success('Plano arquivado no histórico!');
                }}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
              >
                <Archive size={14} />
                Arquivar e criar novo
              </button>
              <button
                onClick={resetPlanDays}
                className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Criar sem arquivar
              </button>
              <button
                onClick={() => setShowArchiveConfirm(false)}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
              <CalendarDays size={18} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 dark:text-white">Plano semanal</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">{studentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => { onClose(); navigate(`/personal/historico-planos?studentId=${studentId}`); }}
              className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0D1025] transition-colors"
            >
              <History size={14} />
              <span>Histórico</span>
            </button>
            <button
              onClick={handleNewPlan}
              className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 transition-colors"
            >
              <Plus size={12} />
              <span>Novo plano</span>
            </button>
            <button
              onClick={onClose}
              className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#0D1025] transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Day tabs */}
        <div className="flex gap-1.5 px-6 pt-4 pb-3 shrink-0 overflow-x-auto">
          {DAYS.map((day) => {
            const dayData    = planDays.find((d) => d.dayOfWeek === day);
            const exCount    = dayData?.exerciseIds.length ?? 0;
            const hasContent = dayData && (dayData.label.trim() || exCount > 0);
            const isActive   = planActiveDay === day;
            return (
              <button
                key={day}
                onClick={() => setPlanActiveDay(day)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                    : hasContent
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700'
                    : 'bg-slate-100 dark:bg-[#0D1025] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {DAYS_SHORT[day]}
                {isActive && <Check size={13} />}
              </button>
            );
          })}
        </div>

        {/* Body: two columns */}
        <div className="flex flex-1 overflow-hidden min-h-0">

          {/* Left column: exercise selection */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 min-w-0">

            {/* Training name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                Nome do treino{' '}
                <span className="text-slate-400 font-normal text-xs">(ex: Peito, Costas â€” vazio = descanso)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={activeDayData?.label ?? ''}
                  onChange={(e) => updateActiveDayLabel(e.target.value)}
                  placeholder="Deixe em branco para dia de descanso"
                  className="w-full border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                />
                <Dumbbell size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" />
              </div>
            </div>

            {/* Exercises section */}
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                Exercícios{' '}
                <span className="text-slate-400 font-normal text-xs">
                  ({activeDayData?.exerciseIds.length ?? 0} selecionados)
                </span>
              </p>

              {/* Search bar */}
              <div className="flex gap-2 mb-2.5">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nome do exercício..."
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                  />
                </div>
                <button className="p-2 rounded-xl border border-slate-200 dark:border-white/[0.07] text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors">
                  <SlidersHorizontal size={15} />
                </button>
              </div>

              {/* Muscle group filter pills */}
              {uniqueMuscleGroups.length > 0 && (
                <div className="flex gap-1.5 flex-wrap mb-3">
                  <button
                    onClick={() => setExerciseMuscleFilter('')}
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                      !exerciseMuscleFilter
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-[#0D1025] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    Todos
                  </button>
                  {uniqueMuscleGroups.map((group) => (
                    <button
                      key={group}
                      onClick={() => setExerciseMuscleFilter(exerciseMuscleFilter === group ? '' : group)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        exerciseMuscleFilter === group
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 dark:bg-[#0D1025] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              )}

              {/* Exercise list */}
              {exercises.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                  Nenhum exercício no catálogo ainda. Adicione em Exercícios.
                </p>
              ) : filteredExercises.length === 0 ? (
                <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                  Nenhum exercício encontrado.
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {filteredExercises.map((ex) => {
                    const checked = activeDayData?.exerciseIds.includes(ex.id) ?? false;
                    return (
                      <label
                        key={ex.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                          checked
                            ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
                            : 'border-slate-100 dark:border-white/[0.07] hover:bg-slate-50 dark:hover:bg-[#0D1025]/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => togglePlanExercise(ex.id)}
                          className="rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                        />
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#0D1025] flex items-center justify-center shrink-0 overflow-hidden">
                          {ex.imageUrl ? (
                            <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                          ) : (
                            <Dumbbell size={16} className="text-slate-400 dark:text-slate-500" />
                          )}
                        </div>
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{ex.name}</span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${getMuscleGroupColor(ex.muscleGroup)}`}>
                          {ex.muscleGroup}
                        </span>
                        <GripVertical size={15} className="text-slate-300 dark:text-slate-600 shrink-0" />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right column: Day summary */}
          <div className="w-56 shrink-0 border-l border-slate-100 dark:border-white/[0.07] overflow-y-auto flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-[#0D1025]/20">
            <div>
              <p className="text-sm font-semibold text-slate-800 dark:text-white">Resumo do dia</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">{DAYS_LABEL[planActiveDay]}</p>
            </div>

            {(activeDayData?.exerciseIds.length ?? 0) === 0 ? (
              <div className="flex flex-col items-center text-center gap-3 py-4">
                <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/[0.07] flex items-center justify-center">
                  <ClipboardList size={26} className="text-slate-300 dark:text-slate-600" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-snug">
                  Nenhum exercício selecionado ainda.
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Selecione exercícios ao lado para montar seu treino.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {activeDayData!.exerciseIds.map((id) => {
                  const ex = exercises.find((e) => e.id === id);
                  if (!ex) return null;
                  return (
                    <div key={id} className="flex items-center gap-2 bg-white dark:bg-[#0D1025] rounded-xl px-3 py-2 border border-slate-100 dark:border-white/[0.07]">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                      <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{ex.name}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Tips */}
            <div className="bg-white dark:bg-[#0D1025] rounded-2xl p-3 border border-slate-100 dark:border-white/[0.07]">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                <Sparkles size={12} className="text-indigo-500" />
                Dicas
              </p>
              <ul className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5">
                <li>â€¢ Comece pelos exercícios compostos.</li>
                <li>â€¢ Respeite seu descanso entre as séries.</li>
                <li>â€¢ Mantenha a execução correta.</li>
                <li>â€¢ Progresso é consistência!</li>
              </ul>
            </div>

            {/* Info note */}
            <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-3 py-2.5">
              <Info size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
              <span className="text-xs text-indigo-600 dark:text-indigo-300">
                Arraste os exercícios para reordenar. O plano será salvo automaticamente.
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-white/[0.07] shrink-0">
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={14} />
            Cancelar
          </button>
          <button
            onClick={handleSavePlan}
            className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
          >
            <Check size={14} />
            Salvar plano
          </button>
        </div>
      </div>
    </div>
  );
}
