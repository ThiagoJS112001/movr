import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { MOCK_EXERCISES } from '../../data/mockData';
import { ArrowLeft, Plus, Trash2, Edit2, Check, X, Image, Video } from 'lucide-react';
import type { WorkoutExercise } from '../../types';
import VideoModal from '../../components/VideoModal';

export default function TreinoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    workouts,
    updateWorkout,
    addExerciseToWorkout,
    removeExerciseFromWorkout,
    updateExerciseInWorkout,
  } = useApp();

  const workout = workouts.find((w) => w.id === id);
  const [showAddEx, setShowAddEx] = useState(false);
  const [editingExId, setEditingExId] = useState<string | null>(null);

  // New exercise form
  const [newEx, setNewEx] = useState({
    exerciseId: '',
    exerciseName: '',
    sets: 3,
    reps: '12',
    weight: '',
    restSeconds: 60,
    notes: '',
    imageUrl: '',
    videoUrl: '',
  });

  // Edit workout name inline
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(workout?.name ?? '');

  if (!workout) {
    return (
      <div className="p-5">
        <p className="text-slate-500">Treino não encontrado.</p>
        <button onClick={() => navigate('/personal/treinos')} className="text-indigo-600 text-sm mt-2">
          Voltar
        </button>
      </div>
    );
  }

  function handleExerciseSelect(exerciseId: string) {
    const ex = MOCK_EXERCISES.find((e) => e.id === exerciseId);
    setNewEx((prev) => ({ ...prev, exerciseId, exerciseName: ex?.name ?? '' }));
  }

  function handleAddExercise(e: React.FormEvent) {
    e.preventDefault();
    if (!newEx.exerciseId) return;
    addExerciseToWorkout(workout!.id, {
      exerciseId: newEx.exerciseId,
      exerciseName: newEx.exerciseName,
      sets: Number(newEx.sets),
      reps: newEx.reps,
      weight: newEx.weight || undefined,
      restSeconds: Number(newEx.restSeconds),
      notes: newEx.notes || undefined,
      imageUrl: newEx.imageUrl || undefined,
      videoUrl: newEx.videoUrl || undefined,
    });
    setNewEx({ exerciseId: '', exerciseName: '', sets: 3, reps: '12', weight: '', restSeconds: 60, notes: '', imageUrl: '', videoUrl: '' });
    setShowAddEx(false);
  }

  function handleImageUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    exerciseId?: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (exerciseId) {
      updateExerciseInWorkout(workout!.id, exerciseId, { imageUrl: url });
    } else {
      setNewEx((prev) => ({ ...prev, imageUrl: url }));
    }
  }

  function saveName() {
    if (nameVal.trim()) updateWorkout(workout!.id, { name: nameVal.trim() });
    setEditingName(false);
  }

  return (
    <div className="p-5 max-w-3xl mx-auto">
      {/* Header */}
      <button
        onClick={() => navigate('/personal/treinos')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-indigo-600 mb-4 transition-colors"
      >
        <ArrowLeft size={15} />
        Treinos
      </button>

      <div className="flex items-center gap-3 mb-1">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b-2 border-indigo-500 focus:outline-none bg-transparent flex-1"
            />
            <button onClick={saveName} className="text-indigo-600 hover:text-indigo-800">
              <Check size={18} />
            </button>
            <button onClick={() => setEditingName(false)} className="text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex-1">{workout.name}</h1>
            <button onClick={() => { setEditingName(true); setNameVal(workout.name); }} className="text-slate-400 hover:text-indigo-600">
              <Edit2 size={16} />
            </button>
          </>
        )}
      </div>
      {workout.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">{workout.description}</p>
      )}

      {/* Exercises */}
      <div className="flex flex-col gap-3 mb-4">
        {workout.exercises.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500 text-sm py-4 text-center">
            Nenhum exercício adicionado ainda.
          </p>
        )}
        {workout.exercises.map((ex) => (
          <ExerciseCard
            key={ex.id}
            ex={ex}
            editing={editingExId === ex.id}
            onEdit={() => setEditingExId(ex.id)}
            onCancelEdit={() => setEditingExId(null)}
            onSaveEdit={(data) => {
              updateExerciseInWorkout(workout.id, ex.id, data);
              setEditingExId(null);
            }}
            onDelete={() => removeExerciseFromWorkout(workout.id, ex.id)}
            onImageUpload={(e) => handleImageUpload(e, ex.id)}
          />
        ))}
      </div>

      <button
        onClick={() => setShowAddEx(true)}
        className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
      >
        <Plus size={16} />
        Adicionar exercício
      </button>

      {/* Add exercise modal */}
      {showAddEx && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Adicionar exercício</h2>
            <form onSubmit={handleAddExercise} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Exercício</label>
                <select
                  required
                  value={newEx.exerciseId}
                  onChange={(e) => handleExerciseSelect(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Selecione</option>
                  {MOCK_EXERCISES.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.muscleGroup})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Séries</label>
                  <input
                    type="number"
                    min={1}
                    value={newEx.sets}
                    onChange={(e) => setNewEx((p) => ({ ...p, sets: Number(e.target.value) }))}
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Reps</label>
                  <input
                    value={newEx.reps}
                    onChange={(e) => setNewEx((p) => ({ ...p, reps: e.target.value }))}
                    placeholder="12"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Carga</label>
                  <input
                    value={newEx.weight}
                    onChange={(e) => setNewEx((p) => ({ ...p, weight: e.target.value }))}
                    placeholder="20kg"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Descanso (seg)</label>
                <input
                  type="number"
                  min={0}
                  value={newEx.restSeconds}
                  onChange={(e) => setNewEx((p) => ({ ...p, restSeconds: Number(e.target.value) }))}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Observações</label>
                <input
                  value={newEx.notes}
                  onChange={(e) => setNewEx((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="Ex: manter escápulas retraídas"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">URL do vídeo (YouTube embed ou link)</label>
                <input
                  value={newEx.videoUrl}
                  onChange={(e) => setNewEx((p) => ({ ...p, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Imagem do exercício</label>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400 transition-colors">
                  <Image size={14} />
                  {newEx.imageUrl ? 'Imagem selecionada ✓' : 'Selecionar imagem'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e)}
                  />
                </label>
                {newEx.imageUrl && (
                  <img src={newEx.imageUrl} alt="preview" className="mt-2 rounded-lg h-24 object-cover" />
                )}
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEx(false)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-component: ExerciseCard ───────────────────────────────────────────────
interface ExerciseCardProps {
  ex: WorkoutExercise;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: (data: Partial<WorkoutExercise>) => void;
  onDelete: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ExerciseCard({
  ex,
  editing,
  onEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
  onImageUpload,
}: ExerciseCardProps) {
  const [form, setForm] = useState({ ...ex });
  const [videoOpen, setVideoOpen] = useState(false);

  if (editing) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 border-2 border-indigo-300 dark:border-indigo-700">
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Séries</label>
            <input
              type="number"
              min={1}
              value={form.sets}
              onChange={(e) => setForm((p) => ({ ...p, sets: Number(e.target.value) }))}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Reps</label>
            <input
              value={form.reps}
              onChange={(e) => setForm((p) => ({ ...p, reps: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Carga</label>
            <input
              value={form.weight ?? ''}
              onChange={(e) => setForm((p) => ({ ...p, weight: e.target.value }))}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Descanso (seg)</label>
          <input
            type="number"
            value={form.restSeconds}
            onChange={(e) => setForm((p) => ({ ...p, restSeconds: Number(e.target.value) }))}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Observações</label>
          <input
            value={form.notes ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-3">
          <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">URL do vídeo</label>
          <input
            value={form.videoUrl ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, videoUrl: e.target.value }))}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2 cursor-pointer border border-dashed border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:border-indigo-400">
            <Image size={14} />
            {form.imageUrl ? 'Trocar imagem' : 'Adicionar imagem'}
            <input type="file" accept="image/*" className="hidden" onChange={onImageUpload} />
          </label>
          {form.imageUrl && (
            <img src={form.imageUrl} alt="preview" className="mt-2 rounded-lg h-20 object-cover" />
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onCancelEdit}
            className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg py-1.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => onSaveEdit(form)}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-1.5 text-sm font-semibold hover:bg-indigo-700"
          >
            Salvar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{ex.exerciseName}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {ex.sets} séries × {ex.reps} reps
            {ex.weight && ` · ${ex.weight}`}
            {` · descanso: ${ex.restSeconds}s`}
          </p>
          {ex.notes && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 italic">{ex.notes}</p>}
        </div>
        <div className="flex gap-2 ml-3 shrink-0">
          <button onClick={onEdit} className="text-slate-400 hover:text-indigo-600 p-1">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-500 p-1">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {ex.imageUrl && (
        <img src={ex.imageUrl} alt={ex.exerciseName} className="mt-3 rounded-xl h-32 w-full object-cover" />
      )}
      {ex.videoUrl && (
        <button
          onClick={() => setVideoOpen(true)}
          className="mt-2 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
        >
          <Video size={12} />
          Ver vídeo
        </button>
      )}
      {videoOpen && ex.videoUrl && (
        <VideoModal url={ex.videoUrl} onClose={() => setVideoOpen(false)} />
      )}
    </div>
  );
}
