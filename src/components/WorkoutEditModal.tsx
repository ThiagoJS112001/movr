import { useState, useMemo, useRef } from 'react';
import {
  X, Search, SlidersHorizontal, Plus, Trash2, GripVertical,
  Dumbbell, Pencil, Check, Sparkles,
} from 'lucide-react';
import { useUpdateWorkout, useUpdateAssignment } from '../hooks/useWorkouts';
import { toast } from 'sonner';
import type { Workout, Exercise, WorkoutExercise, WorkoutAssignment } from '../types';

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
  Peito:   ['Peito'],
  Costas:  ['Costas'],
  Pernas:  ['Pernas', 'GlÃºteos', 'Panturrilha'],
  Ombros:  ['Ombros'],
  'BraÃ§os':  ['BÃ­ceps', 'TrÃ­ceps'],
  'AbdÃ´men': ['AbdÃ´men'],
};

function estimateDuration(count: number): number {
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
  return `Treino com foco em ${sorted[0][0].toLowerCase()}.`;
}

interface Props {
  workout: Workout;
  exercises: Exercise[];
  assignment?: WorkoutAssignment;
  onClose: () => void;
}

export default function WorkoutEditModal({ workout, exercises, assignment, onClose }: Props) {
  const updateWorkoutMutation = useUpdateWorkout(workout.id);
  const updateAssignmentMutation = useUpdateAssignment();

  const [name, setName] = useState(workout.name);
  const [selectedDay, setSelectedDay] = useState<string>(assignment?.scheduledDays?.[0] ?? '');
  const [search, setSearch] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('Todos');
  const [localExercises, setLocalExercises] = useState<WorkoutExercise[]>([...workout.exercises]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSets, setEditSets] = useState('');
  const [editReps, setEditReps] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editRest, setEditRest] = useState('');

  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  function toggleDay(key: string) {
    setSelectedDay((prev) => (prev === key ? '' : key));
  }

  function handleDragStart(index: number) { dragIndexRef.current = index; }
  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault();
    setDragOverIndex(index);
  }
  function handleDrop(index: number) {
    const from = dragIndexRef.current;
    if (from === null || from === index) { setDragOverIndex(null); return; }
    const next = [...localExercises];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setLocalExercises(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }
  function handleDragEnd() { dragIndexRef.current = null; setDragOverIndex(null); }

  const selectedIds = useMemo(
    () => new Set(localExercises.map((e) => e.exerciseId)),
    [localExercises],
  );

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

  function addExercise(ex: Exercise) {
    setLocalExercises((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
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
    setLocalExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function startInlineEdit(we: WorkoutExercise) {
    setEditingId(we.id);
    setEditSets(String(we.sets));
    setEditReps(we.reps);
    setEditWeight(we.weight ?? '');
    setEditRest(String(we.restSeconds));
  }

  function saveInlineEdit(id: string) {
    setLocalExercises((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              sets: Number(editSets) || e.sets,
              reps: editReps || e.reps,
              weight: editWeight || undefined,
              restSeconds: Number(editRest) || e.restSeconds,
            }
          : e,
      ),
    );
    setEditingId(null);
  }

  function clearAll() { setLocalExercises([]); }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Nome do treino Ã© obrigatÃ³rio.');
      return;
    }
    updateWorkoutMutation.mutate({
        name: name.trim(),
        exercises: localExercises,
        durationMinutes: estimateDuration(localExercises.length),
    });
    if (assignment) {
      updateAssignmentMutation.mutate({ id: assignment.id, data: { scheduledDays: selectedDay ? [selectedDay] : [] } });
    }
    toast.success('Treino atualizado com sucesso!');
    onClose();
  }

  const duration = estimateDuration(localExercises.length);
  const summaryFocus = getSummaryFocus(localExercises, exercises);

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Dumbbell size={18} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">EdiÃ§Ã£o de treino</h2>
              <p className="text-xs text-slate-400">Edite as informaÃ§Ãµes e exercÃ­cios do treino.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left panel */}
          <div className="flex-1 flex flex-col border-r border-white/[0.07] overflow-hidden">
            <div className="px-5 pt-5 pb-4 space-y-4 shrink-0">
              <div className="grid grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Dia da semana</label>
                  <div className="flex flex-wrap gap-1.5">
                    {DAYS.map(({ key, label }) => {
                      const active = selectedDay === key;
                      return (
                        <button key={key} type="button" onClick={() => toggleDay(key)}
                          className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${active ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}>
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-300 mb-2">ExercÃ­cios disponÃ­veis</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar exercÃ­cio..."
                      className="w-full bg-[#0D1025] border border-white/[0.07] rounded-xl pl-8 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent" />
                  </div>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#0D1025] border border-white/[0.07] text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors">
                    <SlidersHorizontal size={13} /> Filtros
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {MUSCLE_FILTERS.map((f) => (
                  <button key={f} type="button" onClick={() => setMuscleFilter(f)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${muscleFilter === f ? 'bg-indigo-600 text-white' : 'bg-slate-700/60 text-slate-400 hover:bg-slate-700 hover:text-slate-200'}`}>
                    {f}
                  </button>
                ))}
              </div>
            </div>

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
                          <img src={ex.imageUrl} alt={ex.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-700/60 flex items-center justify-center shrink-0">
                            <Dumbbell size={16} className="text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{ex.name}</p>
                          <p className="text-xs text-slate-400 truncate">{ex.muscleGroup}</p>
                        </div>
                        <button onClick={() => !already && addExercise(ex)} disabled={already}
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${already ? 'bg-indigo-500/20 text-indigo-400 cursor-default' : 'bg-slate-700 text-slate-400 hover:bg-indigo-600 hover:text-white border border-slate-600'}`}
                          title={already ? 'JÃ¡ adicionado' : 'Adicionar'}>
                          <Plus size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right panel */}
          <div className="w-[340px] shrink-0 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <p className="text-sm font-semibold text-white">
                ExercÃ­cios <span className="text-slate-400 font-normal">({localExercises.length})</span>
              </p>
              {localExercises.length > 0 && (
                <button onClick={clearAll} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  Limpar tudo
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3">
              {localExercises.length === 0 ? (
                <div className="py-12 text-center text-slate-500">
                  <Dumbbell size={24} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Nenhum exercÃ­cio.</p>
                  <p className="text-xs mt-1 text-slate-600">Clique no + para adicionar.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {localExercises.map((we, i) => {
                    const isDragOver = dragOverIndex === i;
                    if (editingId === we.id) {
                      return (
                        <div key={we.id} className="p-3 bg-slate-700/40 rounded-xl space-y-2 border border-slate-600/50">
                          <p className="text-xs font-semibold text-white">{we.exerciseName}</p>
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: 'SÃ©ries', value: editSets, setter: setEditSets, type: 'number' },
                              { label: 'Reps', value: editReps, setter: setEditReps, type: 'text' },
                              { label: 'Carga', value: editWeight, setter: setEditWeight, type: 'text' },
                              { label: 'Desc. (s)', value: editRest, setter: setEditRest, type: 'number' },
                            ].map(({ label, value, setter, type }) => (
                              <div key={label}>
                                <label className="text-[10px] text-slate-400 mb-0.5 block">{label}</label>
                                <input type={type} value={value} onChange={(e) => setter(e.target.value)}
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500" />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingId(null)}
                              className="flex-1 text-xs text-slate-400 border border-slate-600 rounded-lg py-1.5 hover:bg-slate-700 transition-colors">
                              Cancelar
                            </button>
                            <button onClick={() => saveInlineEdit(we.id)}
                              className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 flex items-center justify-center gap-1 transition-colors">
                              <Check size={11} /> Salvar
                            </button>
                          </div>
                        </div>
                      );
                    }
                    return (
                      <div key={we.id} draggable
                        onDragStart={() => handleDragStart(i)} onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={() => handleDrop(i)} onDragEnd={handleDragEnd}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-colors ${isDragOver ? 'bg-indigo-500/10 border border-indigo-500/40' : 'bg-[#0D1025] border border-white/[0.07]'}`}>
                        <GripVertical size={14} className="text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing" />
                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                          {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-white truncate">{we.exerciseName}</p>
                          <p className="text-[10px] text-slate-500">{we.sets} sÃ©ries Â· {we.reps} reps</p>
                        </div>
                        <button onClick={() => startInlineEdit(we)}
                          className="p-1 rounded-lg text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors shrink-0">
                          <Pencil size={11} />
                        </button>
                        <button onClick={() => removeExercise(we.id)}
                          className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {localExercises.length > 0 && (
              <div className="mx-4 mb-3 shrink-0">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Sparkles size={13} className="text-amber-400" />
                    <p className="text-xs font-semibold text-amber-300">Resumo</p>
                  </div>
                  <p className="text-xs text-slate-300">
                    {localExercises.length} exercÃ­cio{localExercises.length !== 1 ? 's' : ''} Â· ~{duration} min
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{summaryFocus}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.07] shrink-0">
          <button onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={!name.trim() || localExercises.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold disabled:opacity-40 transition-colors">
            <Check size={15} /> Salvar alteraÃ§Ãµes
          </button>
        </div>
      </div>
    </div>
  );
}
