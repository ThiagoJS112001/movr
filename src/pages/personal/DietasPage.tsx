import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Trash2, ChevronRight, Salad } from 'lucide-react';
import { toast } from 'sonner';

export default function DietasPage() {
  const { user } = useAuth();
  const { diets, createDiet, deleteDiet } = useApp();
  const navigate = useNavigate();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const myDiets = diets.filter((d) => d.personalId === user?.id);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const diet = createDiet({ name, description, personalId: user.id, meals: [] });
    setName('');
    setDescription('');
    setShowCreate(false);
    toast.success(`Dieta "${diet.name}" criada!`);
    navigate(`/personal/dietas/${diet.id}`);
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Dietas</h1>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Nova dieta
        </button>
      </div>

      {myDiets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400 dark:text-slate-500">
          <Salad size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Nenhuma dieta criada ainda.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {myDiets.map((diet) => {
            const totalFoods = diet.meals.reduce((acc, m) => acc + m.foods.length, 0);
            const totalCals = diet.meals.reduce(
              (acc, m) => acc + m.foods.reduce((a, f) => a + (f.calories ?? 0), 0),
              0
            );
            return (
              <div
                key={diet.id}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex items-center justify-between"
              >
                <button
                  onClick={() => navigate(`/personal/dietas/${diet.id}`)}
                  className="flex items-center gap-3 flex-1 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Salad size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{diet.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {diet.meals.length} refeição(ões) · {totalFoods} alimento(s)
                      {totalCals > 0 && ` · ~${totalCals} kcal`}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate(`/personal/dietas/${diet.id}`)}
                    className="text-emerald-500 hover:text-emerald-700 p-1"
                  >
                    <ChevronRight size={18} />
                  </button>
                  <button
                    onClick={() => {
                      toast(`Excluir "${diet.name}"?`, {
                        action: { label: 'Excluir', onClick: () => deleteDiet(diet.id) },
                        cancel: { label: 'Cancelar', onClick: () => {} },
                      });
                    }}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Nova dieta</h2>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ex: Dieta de Hipertrofia"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                  placeholder="Objetivo da dieta..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors"
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
