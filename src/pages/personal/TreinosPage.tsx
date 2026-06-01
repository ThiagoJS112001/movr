import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkouts, useCreateWorkout, useDeleteWorkout, useDuplicateWorkout } from '../../hooks/useWorkouts';
import { Plus, Trash2, ChevronRight, Dumbbell, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function TreinosPage() {
  const { user } = useAuth();
  const { data: workouts = [], isLoading } = useWorkouts();
  const createWorkoutMutation = useCreateWorkout();
  const deleteWorkoutMutation = useDeleteWorkout();
  const duplicateWorkoutMutation = useDuplicateWorkout();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const myWorkouts = workouts;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    try {
      const workout = await createWorkoutMutation.mutateAsync({
        name,
        description,
        personalId: user.id,
        exercises: [],
      });
      setName('');
      setDescription('');
      setShowCreate(false);
      toast.success(`Treino "${workout.name}" criado!`);
      navigate(`/personal/treinos/${workout.id}`);
    } catch {
      toast.error('Erro ao criar treino.');
    }
  }

  return (
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Treinos</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Novo treino
        </button>
      </div>

      {myWorkouts.length === 0 && !isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500 text-center">
          <Dumbbell size={36} className="mb-3 opacity-30" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum treino criado ainda.</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Clique em "Novo treino" para criar o primeiro.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myWorkouts.map((workout) => (
            <div
              key={workout.id}
              className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-4 flex items-center justify-between"
            >
              <button
                onClick={() => navigate(`/personal/treinos/${workout.id}`)}
                className="flex items-center gap-3 flex-1 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Dumbbell size={18} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{workout.name}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    {workout.exercises.length} exercício{workout.exercises.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(workout.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/personal/treinos/${workout.id}`)}
                  className="text-indigo-500 hover:text-indigo-700 p-1"
                >
                  <ChevronRight size={18} />
                </button>
                <button
                  title="Duplicar treino"
                  onClick={async () => {
                    try {
                      const copy = await duplicateWorkoutMutation.mutateAsync(workout.id);
                      toast.success(`Cópia "${copy.name}" criada!`);
                      navigate(`/personal/treinos/${copy.id}`);
                    } catch {
                      toast.error('Erro ao duplicar treino');
                    }
                  }}
                  disabled={duplicateWorkoutMutation.isPending}
                  className="text-slate-400 hover:text-indigo-400 p-1 disabled:opacity-50"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => {
                    toast(`Excluir "${workout.name}"?`, {
                      action: { label: 'Excluir', onClick: () => deleteWorkoutMutation.mutate(workout.id) },
                      cancel: { label: 'Cancelar', onClick: () => {} },
                    });
                  }}
                  className="text-red-400 hover:text-red-600 p-1"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Novo treino</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Treino A â€“ Peito"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Descrição <span className="text-slate-400">(opcional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Descreva o objetivo do treino..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none transition"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
