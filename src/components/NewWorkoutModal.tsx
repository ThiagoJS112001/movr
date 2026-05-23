import { useState, useMemo, useRef } from 'react';
import {
  X, Search, SlidersHorizontal, Plus, Trash2, GripVertical,
  Dumbbell, Sparkles,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useExercises } from '../hooks/useExercises';
import { useCreateWorkout, useAssignWorkout as useAssignWorkoutMutation, useAssignments, useWorkouts } from '../hooks/useWorkouts';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { Exercise, WorkoutExercise } from '../types';

const DAYS = [
  { key: 'segunda', label: 'Seg' },
  { key: 'terca',   label: 'Ter' },
  { key: 'quarta',  label: 'Qua' },
  { key: 'quinta',  label: 'Qui' },
  { key: 'sexta',   label: 'Sex' },
  { key: 'sabado',  label: 'SÃ¡b' },
  { key: 'domingo', label: 'Dom' },
] as const;

const MUSCLE_FILTERS = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'BraÃ§os', 'AbdÃ´men'] as const;

const MUSCLE_MAP: Record<string, string[]> = {
  Peito:    ['Peito'],
  Costas:   ['Costas'],
  Pernas:   ['Pernas', 'GlÃºteos', 'Panturrilha'],
  Ombros:   ['Ombros'],
  BraÃ§os:   ['BÃ­ceps', 'TrÃ­ceps'],
  AbdÃ´men:  ['AbdÃ´men'],
};

function estimateDuration(count: number): number {
  // ~10 min per exercise (rough estimate)
  return Math.max(15, count * 10);
}

function getSummaryFocus(exList: WorkoutExercise[], exercises: Exercise[]): string {
  const groups: Record<string, number> = {};
  for (const we of exList) {
    const ex = exercises.find((e) => e.id === we.exerciseId);
    if (ex?.muscleGroup) groups[ex.muscleGroup] = (groups[ex.muscleGroup] ?? 0) + 1;
  }
  const sorted = Object.entries(groups).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return 'Sem foco definido.';
  const main = sorted[0][0].toLowerCase();
  return `Treino criado com foco em ${main}.`;
}

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

export default function NewWorkoutModal({ studentId, studentName, onClose }: Props) {
  const { user } = useAuth();
  const { data: exercises = [] } = useExercises();
  const { data: workouts = [] } = useWorkouts();
  const { data: assignments = [] } = useAssignments();
  const createWorkoutMutation = useCreateWorkout();
  const assignWorkoutMutation = useAssignWorkoutMutation();

  const [name, setName] = useState('');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [status, setStatus] = useState<'ativo' | 'rascunho'>('ativo');
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [selectedExercises, setSelectedExercises] = useState<WorkoutExercise[]>([]);

  // Drag state for right panel
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function toggleDay(key: string) {
    setSelectedDay((prev) => (prev === key ? '' : key));
  }

  function addExercise(ex: Exercise) {
    setSelectedExercises((prev) => [
      ...prev,
      {
        id: uuidv4(),
        exerciseId: ex.id,
        exerciseName: ex.name,
        sets: 3,
        reps: '12',
        restSeconds: 60,
        imageUrl: ex.imageUrl,
      },
    ]);
  }

  function removeExercise(id: string) {
    setSelectedExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    setSelectedExercises([]);
  }

  // Drag and drop for right panel
  function handleDragStart(index: number) {
    dragIndexRef.current = index;
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }

  function handleDrop(index: number) {
    const from = dragIndexRef.current;
    if (from === null || from === index) { setDragOverIndex(null); return; }
    const next = [...selectedExercises];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setSelectedExercises(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  const selectedIds = useMemo(
    () => new Set(selectedExercises.map((e) => e.exerciseId)),
    [selectedExercises],
  );

  const dayConflict = useMemo(() => {
    if (!selectedDay) return false;
    return assignments
      .filter((a) => a.studentId === studentId && a.scheduledDays?.includes(selectedDay))
      .some((a) => workouts.find((w) => w.id === a.workoutId)?.status === 'ativo');
  }, [selectedDay, assignments, studentId, workouts]);

  const filteredExercises = useMemo(() => {
    const q = search.toLowerCase();
    return exercises.filter((ex) => {
      const matchesSearch = ex.name.toLowerCase().includes(q) || ex.muscleGroup.toLowerCase().includes(q);
      const matchesMuscle =
        muscleFilter === 'Todos' ||
        (MUSCLE_MAP[muscleFilter]?.includes(ex.muscleGroup) ?? ex.muscleGroup === muscleFilter);
      return matchesSearch && matchesMuscle;
    });
  }, [exercises, search, muscleFilter]);

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Informe o nome do treino.');
      return;
    }
    if (selectedExercises.length === 0) {
      toast.error('Adicione pelo menos um exercÃ­cio.');
      return;
    }
    if (status === 'ativo' && dayConflict) {
      const dayLabel = DAYS.find((d) => d.key === selectedDay)?.label ?? selectedDay;
      toast.error(`JÃ¡ existe um treino ativo na ${dayLabel}. Mude o status para Rascunho.`);
      return;
    }
    if (!user) return;

    const workout = await createWorkoutMutation.mutateAsync({
      name: name.trim(),
      personalId: user.id,
      exercises: selectedExercises,
      status,
      level: 'intermediario',
      durationMinutes: estimateDuration(selectedExercises.length),
    });

    await assignWorkoutMutation.mutateAsync({
      workoutId: workout.id,
      workoutName: workout.name,
      studentId,
      personalId: user.id,
      scheduledDays: selectedDay ? [selectedDay] : [],
    });

    toast.success(`Treino "${workout.name}" criado e atribuÃ­do a ${studentName}!`);
    onClose();
  }

  const duration = estimateDuration(selectedExercises.length);
  const summaryFocus = getSummaryFocus(selectedExercises, exercises);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <Dumbbell size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Novo treino</h2>
              <p className="text-xs text-slate-400">Crie um novo treino para o aluno.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body: two columns */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* â”€â”€ Left panel â”€â”€ */}
          <div className="flex-1 flex flex-col border-r border-white/[0.07] overflow-hidden">

            {/* Name + Days */}
            <div className="px-5 pt-5 pb-4 space-y-4 shrink-0">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Nome do treino</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    placeholder="Ex: Peito e TrÃ­ceps"
                    className="w-full bg-[#0D1025] border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>

                {/* Days */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Dias da semana</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map(({ key, label }) => {
                      const active = selectedDay === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleDay(key)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            active
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Status</label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus('ativo')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      status === 'ativo'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus('rascunho')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                      status === 'rascunho'
                        ? 'bg-slate-500 text-white'
                        : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                  >
                    Rascunho
                  </button>
                </div>
                {dayConflict && (
                  <p className="text-xs text-amber-400 mt-1.5">
                    âš  JÃ¡ existe um treino ativo neste dia. Para criar outro, use Rascunho.
                  </p>
                )}
              </div>

              {/* Search + filter header */}
              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">Adicionar exercÃ­cios</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Buscar exercÃ­cio..."
                      className="w-full bg-[#0D1025] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D1025] border border-white/[0.07] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
                    <SlidersHorizontal size={13} />
                    Filtros
                  </button>
                </div>
              </div>

              {/* Muscle filter chips */}
              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_FILTERS.map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setMuscleFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      muscleFilter === f
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Exercise list */}
            <div className="flex-1 overflow-y-auto px-5 pb-5">
              {filteredExercises.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Dumbbell size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Nenhum exercÃ­cio encontrado.</p>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-700/40">
                  {filteredExercises.map((ex) => {
                    const already = selectedIds.has(ex.id);
                    return (
                      <div key={ex.id} className="flex items-center gap-3 py-3 hover:bg-[#0D1025]/40 rounded-xl px-2 -mx-2 transition-colors">
                        {ex.imageUrl ? (
                          <img
                            src={ex.imageUrl}
                            alt={ex.name}
                            className="w-10 h-10 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                            <Dumbbell size={16} className="text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                          <p className="text-xs text-slate-400 truncate">{ex.muscleGroup}</p>
                        </div>
                        <button
                          onClick={() => !already && addExercise(ex)}
                          disabled={already}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                            already
                              ? 'bg-indigo-500/20 text-indigo-400 cursor-default'
                              : 'bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white border border-slate-600'
                          }`}
                          title={already ? 'JÃ¡ adicionado' : 'Adicionar'}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* â”€â”€ Right panel â”€â”€ */}
          <div className="w-[340px] shrink-0 flex flex-col overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <p className="text-sm font-semibold text-white">
                ExercÃ­cios selecionados{' '}
                <span className="text-slate-400 font-normal">({selectedExercises.length})</span>
              </p>
              {selectedExercises.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  Limpar tudo
                </button>
              )}
            </div>

            {/* Selected list */}
            <div className="flex-1 overflow-y-auto px-4 py-3">
              {selectedExercises.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Dumbbell size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum exercÃ­cio selecionado.</p>
                  <p className="text-xs mt-1 text-slate-600">Clique no + para adicionar.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {selectedExercises.map((we, i) => {
                    const isDragOver = dragOverIndex === i;
                    return (
                      <div
                        key={we.id}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)}
                        onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${
                          isDragOver
                            ? 'bg-indigo-500/10 border border-indigo-500/40'
                            : 'bg-[#0D1025] border border-white/[0.07]'
                        }`}
                      >
                        <GripVertical
                          size={14}
                          className="text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing"
                        />
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{we.exerciseName}</p>
                          <p className="text-[10px] text-slate-500">
                            {we.sets} sÃ©ries Â· {we.reps} reps
                          </p>
                        </div>
                        <button
                          onClick={() => removeExercise(we.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Summary */}
            {selectedExercises.length > 0 && (
              <div className="mx-4 mb-3 shrink-0">
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={13} className="text-indigo-400" />
                    <p className="text-xs font-semibold text-indigo-300">Resumo</p>
                  </div>
                  <p className="text-xs text-slate-300">
                    {selectedExercises.length} exercÃ­cio{selectedExercises.length !== 1 ? 's' : ''} Â· ~{duration} min
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{summaryFocus}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.07] shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim() || selectedExercises.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            <Plus size={15} />
            Criar treino
          </button>
        </div>
      </div>
    </div>
  );
}
