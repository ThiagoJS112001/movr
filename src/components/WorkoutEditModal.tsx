import { useState, useMemo, useRef } from 'react';
import {
  X, Plus, Trash2, GripVertical, Pencil, Dumbbell, Check,
} from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../contexts/AppContext';
import { toast } from 'sonner';
import type { Workout, Exercise, WorkoutExercise } from '../types';

const MUSCLE_TAG: Record<string, string> = {
  'Peito':       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  'Costas':      'bg-teal-500/20 text-teal-300 border-teal-500/30',
  'Pernas':      'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Glúteos':     'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Ombros':      'bg-orange-500/20 text-orange-300 border-orange-500/30',
  'Bíceps':      'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  'Tríceps':     'bg-pink-500/20 text-pink-300 border-pink-500/30',
  'Abdômen':     'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Panturrilha': 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
};

const INPUT = 'w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent';
const LABEL = 'block text-sm font-medium text-slate-300 mb-1.5';

interface Props {
  workout: Workout;
  exercises: Exercise[];
  onClose: () => void;
}

export default function WorkoutEditModal({ workout, exercises, onClose }: Props) {
  const { updateWorkout } = useApp();

  // ── Form state ──────────────────────────────────────────────────────────────
  const [name, setName] = useState(workout.name);
  const [description, setDescription] = useState(workout.description ?? '');
  const [duration, setDuration] = useState(String(workout.durationMinutes ?? ''));
  const [level, setLevel] = useState<string>(workout.level ?? 'intermediario');
  const [status, setStatus] = useState<'ativo' | 'rascunho'>(workout.status ?? 'ativo');
  const [localExercises, setLocalExercises] = useState<WorkoutExercise[]>([...workout.exercises]);

  // ── Drag-and-drop
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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
    const next = [...localExercises];
    const [moved] = next.splice(from, 1);
    next.splice(index, 0, moved);
    setLocalExercises(next);
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    dragIndexRef.current = null;
    setDragOverIndex(null);
  }

  // ── Add exercise sub-form ───────────────────────────────────────────────────
  const [showAdd, setShowAdd] = useState(false);
  const [addExId, setAddExId] = useState('');
  const [addSets, setAddSets] = useState('3');
  const [addReps, setAddReps] = useState('12');
  const [addWeight, setAddWeight] = useState('');
  const [addRest, setAddRest] = useState('60');

  // ── Inline edit ─────────────────────────────────────────────────────────────
  const [editingId, setEditingId] = useState<string | null>(null);
  const [eSets, setESets] = useState('');
  const [eReps, setEReps] = useState('');
  const [eWeight, setEWeight] = useState('');
  const [eRest, setERest] = useState('');

  // ── Derived ─────────────────────────────────────────────────────────────────
  const usedExerciseIds = useMemo(
    () => new Set(localExercises.map((we) => we.exerciseId)),
    [localExercises],
  );

  const availableExercises = useMemo(
    () => exercises.filter((ex) => !usedExerciseIds.has(ex.id)),
    [exercises, usedExerciseIds],
  );

  const muscleGroups = useMemo(
    () =>
      [...new Set(
        localExercises
          .map((we) => exercises.find((e) => e.id === we.exerciseId)?.muscleGroup)
          .filter(Boolean) as string[],
      )],
    [localExercises, exercises],
  );

  // ── Handlers ────────────────────────────────────────────────────────────────
  function handleAddExercise() {
    if (!addExId) return;
    const exData = exercises.find((e) => e.id === addExId);
    const newWE: WorkoutExercise = {
      id: uuidv4(),
      exerciseId: addExId,
      exerciseName: exData?.name ?? '',
      sets: Number(addSets) || 3,
      reps: addReps || '12',
      weight: addWeight || undefined,
      restSeconds: Number(addRest) || 60,
      imageUrl: exData?.imageUrl,
    };
    setLocalExercises((prev) => [...prev, newWE]);
    setAddExId(''); setAddSets('3'); setAddReps('12'); setAddWeight(''); setAddRest('60');
    setShowAdd(false);
  }

  function handleDeleteExercise(id: string) {
    setLocalExercises((prev) => prev.filter((e) => e.id !== id));
  }

  function startEdit(we: WorkoutExercise) {
    setEditingId(we.id);
    setESets(String(we.sets));
    setEReps(we.reps);
    setEWeight(we.weight ?? '');
    setERest(String(we.restSeconds));
  }

  function saveEdit(id: string) {
    setLocalExercises((prev) =>
      prev.map((e) =>
        e.id === id
          ? {
              ...e,
              sets: Number(eSets) || e.sets,
              reps: eReps || e.reps,
              weight: eWeight || undefined,
              restSeconds: Number(eRest) || e.restSeconds,
            }
          : e,
      ),
    );
    setEditingId(null);
  }

  function handleSave() {
    if (!name.trim()) {
      toast.error('Nome do treino é obrigatório.');
      return;
    }
    updateWorkout(workout.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      durationMinutes: duration ? Number(duration) : undefined,
      level: level as Workout['level'],
      status,
      exercises: localExercises,
    });
    toast.success('Treino atualizado com sucesso!');
    onClose();
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-800 border border-slate-700/60 rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh]">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-slate-700/60 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-white">Editar treino</h2>
            <p className="text-sm text-slate-400 mt-0.5">Altere as informações do treino.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 px-7 py-6 space-y-5">

          {/* Nome */}
          <div>
            <label className={LABEL}>Nome do treino</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              className={INPUT}
              placeholder="Ex: Treino A – Peito e Tríceps"
            />
            <p className="text-xs text-slate-500 text-right mt-1">{name.length}/100</p>
          </div>

          {/* Grupo muscular (derived) */}
          <div>
            <label className={LABEL}>Grupos musculares trabalhados</label>
            <div className="flex flex-wrap gap-2 min-h-[42px] bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 items-center">
              {muscleGroups.length === 0 ? (
                <span className="text-xs text-slate-500">Derivado automaticamente dos exercícios</span>
              ) : (
                muscleGroups.map((g) => (
                  <span
                    key={g}
                    className={`text-xs px-2.5 py-1 rounded-full border font-medium ${MUSCLE_TAG[g] ?? 'bg-slate-600/50 text-slate-300 border-slate-500/30'}`}
                  >
                    {g}
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Duração + Nível + Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Duração média</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="1"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className={`${INPUT} pr-12`}
                  placeholder="60"
                />
                <span className="absolute right-3 text-xs text-slate-400 pointer-events-none">min</span>
              </div>
            </div>
            <div>
              <label className={LABEL}>Nível</label>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={INPUT}>
                <option value="iniciante">Iniciante</option>
                <option value="intermediario">Intermediário</option>
                <option value="avancado">Avançado</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ativo' | 'rascunho')}
                className={INPUT}
              >
                <option value="ativo">Ativo</option>
                <option value="rascunho">Rascunho</option>
              </select>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className={LABEL}>
              Observações{' '}
              <span className="text-slate-500 font-normal">(opcional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              className={`${INPUT} resize-none`}
              placeholder="Instruções ou observações sobre este treino..."
            />
            <p className="text-xs text-slate-500 text-right mt-1">{description.length}/300</p>
          </div>

          {/* ── Exercícios ─────────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">Exercícios</span>
                <span className="text-xs text-slate-500 bg-slate-700/60 px-2 py-0.5 rounded-full">
                  {localExercises.length}
                </span>
                {localExercises.length > 1 && (
                  <span className="text-xs text-slate-500">· arraste para reordenar</span>
                )}
              </div>
              <button
                onClick={() => { setShowAdd((v) => !v); setAddExId(''); }}
                className="flex items-center gap-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Plus size={13} />
                Adicionar exercício
              </button>
            </div>

            {/* Add exercise form */}
            {showAdd && (
              <div className="bg-slate-700/40 border border-slate-600/50 rounded-xl p-4 mb-3 space-y-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Exercício</label>
                  <select
                    value={addExId}
                    onChange={(e) => setAddExId(e.target.value)}
                    className={INPUT}
                  >
                    <option value="">Selecione o exercício</option>
                    {availableExercises.length === 0 ? (
                      <option disabled>Todos os exercícios já foram adicionados</option>
                    ) : (
                      availableExercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.name} – {ex.muscleGroup}
                        </option>
                      ))
                    )}
                  </select>
                  {availableExercises.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1.5">
                      Todos os exercícios do catálogo já estão neste treino.
                    </p>
                  )}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { label: 'Séries',       value: addSets,   setter: setAddSets,   type: 'number', placeholder: '3' },
                    { label: 'Reps',          value: addReps,   setter: setAddReps,   type: 'text',   placeholder: '12' },
                    { label: 'Carga',         value: addWeight, setter: setAddWeight, type: 'text',   placeholder: '—' },
                    { label: 'Descanso (s)',  value: addRest,   setter: setAddRest,   type: 'number', placeholder: '60' },
                  ].map(({ label, value, setter, type, placeholder }) => (
                    <div key={label}>
                      <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                      <input
                        type={type}
                        value={value}
                        onChange={(e) => setter(e.target.value)}
                        placeholder={placeholder}
                        className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAdd(false)}
                    className="flex-1 text-sm text-slate-400 border border-slate-600 rounded-xl py-2 hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddExercise}
                    disabled={!addExId}
                    className="flex-1 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 disabled:opacity-40 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
              </div>
            )}

            {/* Exercise list */}
            {localExercises.length === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-600 rounded-xl">
                <Dumbbell size={24} className="mx-auto mb-2 text-slate-600" />
                <p className="text-sm text-slate-500">Nenhum exercício adicionado.</p>
              </div>
            ) : (
              <div className="border border-slate-700/60 rounded-xl overflow-hidden divide-y divide-slate-700/50">
                {localExercises.map((we, i) => {
                  const exData = exercises.find((e) => e.id === we.exerciseId);
                  const isDragOver = dragOverIndex === i;
                  return (
                    <div
                      key={we.id}
                      draggable={editingId !== we.id}
                      onDragStart={() => handleDragStart(i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDrop={() => handleDrop(i)}
                      onDragEnd={handleDragEnd}
                      className={`transition-colors ${isDragOver ? 'bg-indigo-500/10 border-l-2 border-indigo-500' : ''}`}
                    >
                      {editingId === we.id ? (
                        /* Inline edit row */
                        <div className="p-4 bg-slate-700/30">
                          <p className="text-xs font-semibold text-slate-200 mb-3">{we.exerciseName}</p>
                          <div className="grid grid-cols-4 gap-2 mb-3">
                            {[
                              { label: 'Séries', value: eSets, setter: setESets, type: 'number' },
                              { label: 'Reps', value: eReps, setter: setEReps, type: 'text' },
                              { label: 'Carga', value: eWeight, setter: setEWeight, type: 'text' },
                              { label: 'Descanso (s)', value: eRest, setter: setERest, type: 'number' },
                            ].map(({ label, value, setter, type }) => (
                              <div key={label}>
                                <label className="text-xs text-slate-400 mb-1 block">{label}</label>
                                <input
                                  type={type}
                                  value={value}
                                  onChange={(e) => setter(e.target.value)}
                                  className="w-full bg-slate-700 border border-slate-600 rounded-lg px-2.5 py-1.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex-1 text-xs text-slate-400 border border-slate-600 rounded-lg py-1.5 hover:bg-slate-700 transition-colors"
                            >
                              Cancelar
                            </button>
                            <button
                              onClick={() => saveEdit(we.id)}
                              className="flex-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1"
                            >
                              <Check size={12} />
                              Salvar
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Normal row */
                        <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-700/20 transition-colors">
                          <GripVertical
                            size={14}
                            className="text-slate-600 hover:text-slate-400 shrink-0 cursor-grab active:cursor-grabbing"
                          />
                          <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {i + 1}
                          </div>
                          {we.imageUrl ? (
                            <img
                              src={we.imageUrl}
                              alt={we.exerciseName}
                              className="w-9 h-9 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-slate-700/80 flex items-center justify-center shrink-0">
                              <Dumbbell size={14} className="text-slate-500" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white font-medium truncate">{we.exerciseName}</p>
                            <p className="text-xs text-slate-400">{exData?.muscleGroup ?? '—'}</p>
                          </div>
                          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                            {[`${we.sets}×${we.reps}`, we.weight ?? '—', `${we.restSeconds}s`].map((label) => (
                              <span key={label} className="text-xs text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-md">
                                {label}
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => startEdit(we)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors shrink-0"
                            title="Editar"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteExercise(we.id)}
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors shrink-0"
                            title="Remover"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-7 py-5 border-t border-slate-700/60 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-600 text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
          >
            Salvar alterações
          </button>
        </div>
      </div>
    </div>
  );
}
