import { useState } from 'react';
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from '../../hooks/useExercises';
import { Plus, Trash2, Video, Edit2, Dumbbell, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import type { Exercise } from '../../types';

const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps',
  'Abdômen', 'Panturrilha', 'Glúteos', 'Cardio',
];

const GROUP_COLORS: Record<string, string> = {
  Peito:      'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  Costas:     'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
  Pernas:     'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  Ombros:     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  Bíceps:     'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  Tríceps:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  Abdômen:    'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
  Panturrilha:'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  Glúteos:    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
  Cardio:     'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
};

function groupColor(group: string) {
  return GROUP_COLORS[group] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300';
}

const EMPTY_FORM = { name: '', muscleGroup: '', videoUrl: '' };

export default function ExerciciosPage() {
  const { data: exercises = [], isLoading } = useExercises();
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [modal, setModal]         = useState<'create' | { exercise: Exercise } | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [filterGroup, setFilterGroup] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<Exercise | null>(null);

  const isEditing = modal !== null && modal !== 'create';
  const filtered = filterGroup
    ? exercises.filter((e) => e.muscleGroup === filterGroup)
    : exercises;

  function openCreate() {
    setForm(EMPTY_FORM);
    setModal('create');
  }

  function openEdit(ex: Exercise) {
    setForm({ name: ex.name, muscleGroup: ex.muscleGroup, videoUrl: ex.videoUrl ?? '' });
    setModal({ exercise: ex });
  }

  function handleSave() {
    if (!form.name.trim() || !form.muscleGroup.trim()) return;
    if (isEditing) {
      updateMutation.mutate({
        id: (modal as { exercise: Exercise }).exercise.id,
        data: {
          name: form.name.trim(),
          muscleGroup: form.muscleGroup.trim(),
          videoUrl: form.videoUrl.trim() || undefined,
        },
      });
      toast.success('Exercício atualizado!');
    } else {
      createMutation.mutate({
        name: form.name.trim(),
        muscleGroup: form.muscleGroup.trim(),
        videoUrl: form.videoUrl.trim() || undefined,
      });
      toast.success('Exercício criado!');
    }
    setModal(null);
  }

  function handleDelete(ex: Exercise) {
    deleteMutation.mutate(ex.id);
    setDeleteConfirm(null);
    toast.success(`"${ex.name}" removido.`);
  }

  // Group exercises by muscle group for display
  const groupedExercises = filtered.reduce<Record<string, Exercise[]>>((acc, ex) => {
    const g = ex.muscleGroup || 'Outros';
    if (!acc[g]) acc[g] = [];
    acc[g].push(ex);
    return acc;
  }, {});

  return (
    <div className="p-5 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Exercícios</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {exercises.length} exercício{exercises.length !== 1 ? 's' : ''} no catálogo
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Novo exercício
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setFilterGroup('')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            filterGroup === ''
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400'
          }`}
        >
          Todos
        </button>
        {MUSCLE_GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setFilterGroup(g === filterGroup ? '' : g)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filterGroup === g
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-indigo-400'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filtered.length === 0 && !isLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
          <Dumbbell size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum exercício encontrado.</p>
        </div>
      )}

      {/* Grouped list */}
      <div className="flex flex-col gap-6">
        {Object.entries(groupedExercises).map(([group, exList]) => (
          <div key={group}>
            {/* Section header */}
            <div className="flex items-center gap-3 mb-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${groupColor(group)}`}>
                {group}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500">
                {exList.length} exercício{exList.length !== 1 ? 's' : ''}
              </span>
              <div className="flex-1 h-px bg-slate-100 dark:bg-slate-700/60" />
            </div>

            {/* Exercise cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {exList.map((ex) => (
                <div
                  key={ex.id}
                  className="group bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/60 px-4 py-3 flex items-center gap-3 hover:border-indigo-200 dark:hover:border-indigo-700/50 hover:shadow-sm transition-all"
                >
                  <div className="w-7 h-7 rounded-lg bg-slate-50 dark:bg-slate-700/60 flex items-center justify-center shrink-0">
                    <Dumbbell size={13} className="text-slate-400 dark:text-slate-500" />
                  </div>
                  <p className="flex-1 text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                    {ex.name}
                  </p>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    {ex.videoUrl && (
                      <a
                        href={ex.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        title="Ver vídeo"
                      >
                        <Video size={13} />
                      </a>
                    )}
                    <button
                      onClick={() => openEdit(ex)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(ex)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Create / Edit Modal */}
      {modal !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-slate-800 dark:text-slate-100">
                {isEditing ? 'Editar exercício' : 'Novo exercício'}
              </h2>
              <button onClick={() => setModal(null)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Supino Reto"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Grupo muscular</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {MUSCLE_GROUPS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, muscleGroup: g }))}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                        form.muscleGroup === g
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-indigo-400'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={form.muscleGroup}
                  onChange={(e) => setForm((f) => ({ ...f, muscleGroup: e.target.value }))}
                  placeholder="Ou digite um grupo personalizado"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  URL do vídeo <span className="text-slate-400 font-normal">(opcional)</span>
                </label>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://youtube.com/..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal(null)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!form.name.trim() || !form.muscleGroup.trim()}
                className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={14} />
                {isEditing ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-2">Excluir exercício</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Tem certeza que deseja excluir <strong className="text-slate-700 dark:text-slate-200">{deleteConfirm.name}</strong>? Ele será removido de todos os planos.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
