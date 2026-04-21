import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Clock,
  ChevronDown,
  ChevronUp,
  Salad,
} from 'lucide-react';
import type { FoodItem, Meal } from '../../types';

// ── Blank forms ───────────────────────────────────────────────────────────────
const blankMeal = (): Omit<Meal, 'id'> => ({
  name: '',
  time: '08:00',
  foods: [],
  notes: '',
});

const blankFood = (): Omit<FoodItem, 'id'> => ({
  name: '',
  quantity: '',
  calories: undefined,
  protein: undefined,
  carbs: undefined,
  fat: undefined,
});

export default function DietaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    diets,
    updateDiet,
    addMealToDiet,
    removeMealFromDiet,
    updateMealInDiet,
    addFoodToMeal,
    removeFoodFromMeal,
    updateFoodInMeal,
  } = useApp();

  const diet = diets.find((d) => d.id === id);

  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(diet?.name ?? '');

  // Meal modals
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState(blankMeal());
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editMealForm, setEditMealForm] = useState<Omit<Meal, 'id'>>(blankMeal());

  // Food modals
  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null);
  const [newFood, setNewFood] = useState(blankFood());

  if (!diet) {
    return (
      <div className="p-5">
        <p className="text-slate-500">Dieta não encontrada.</p>
        <button onClick={() => navigate('/personal/dietas')} className="text-emerald-600 text-sm mt-2">
          Voltar
        </button>
      </div>
    );
  }

  // Sort meals by time
  const sortedMeals = [...diet.meals].sort((a, b) => a.time.localeCompare(b.time));

  function saveName() {
    if (nameVal.trim()) updateDiet(diet!.id, { name: nameVal.trim() });
    setEditingName(false);
  }

  // ── Meals ────────────────────────────────────────────────────────────────────
  function handleAddMeal(e: React.FormEvent) {
    e.preventDefault();
    addMealToDiet(diet!.id, { ...newMeal, foods: [] });
    setNewMeal(blankMeal());
    setShowAddMeal(false);
  }

  function startEditMeal(meal: Meal) {
    setEditingMealId(meal.id);
    setEditMealForm({ name: meal.name, time: meal.time, foods: meal.foods, notes: meal.notes ?? '' });
  }

  function saveEditMeal() {
    if (!editingMealId) return;
    updateMealInDiet(diet!.id, editingMealId, {
      name: editMealForm.name,
      time: editMealForm.time,
      notes: editMealForm.notes,
    });
    setEditingMealId(null);
  }

  // ── Foods ─────────────────────────────────────────────────────────────────────
  function handleAddFood(e: React.FormEvent) {
    e.preventDefault();
    if (!addFoodMealId) return;
    addFoodToMeal(diet!.id, addFoodMealId, newFood);
    setNewFood(blankFood());
    setAddFoodMealId(null);
  }

  // ── Macros totais ─────────────────────────────────────────────────────────────
  const totals = diet.meals.reduce(
    (acc, m) => {
      m.foods.forEach((f) => {
        acc.cal += f.calories ?? 0;
        acc.prot += f.protein ?? 0;
        acc.carb += f.carbs ?? 0;
        acc.fat += f.fat ?? 0;
      });
      return acc;
    },
    { cal: 0, prot: 0, carb: 0, fat: 0 }
  );

  return (
    <div className="p-5 max-w-3xl mx-auto pb-10">
      {/* Back */}
      <button
        onClick={() => navigate('/personal/dietas')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4 transition-colors"
      >
        <ArrowLeft size={15} />
        Dietas
      </button>

      {/* Title */}
      <div className="flex items-center gap-3 mb-1">
        {editingName ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              className="text-xl font-bold text-slate-800 dark:text-slate-100 border-b-2 border-emerald-500 focus:outline-none bg-transparent flex-1"
            />
            <button onClick={saveName} className="text-emerald-600">
              <Check size={18} />
            </button>
            <button onClick={() => setEditingName(false)} className="text-slate-400">
              <X size={18} />
            </button>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex-1">{diet.name}</h1>
            <button
              onClick={() => { setEditingName(true); setNameVal(diet.name); }}
              className="text-slate-400 hover:text-emerald-600"
            >
              <Edit2 size={16} />
            </button>
          </>
        )}
      </div>
      {diet.description && <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{diet.description}</p>}

      {/* Macro summary */}
      {totals.cal > 0 && (
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Calorias', value: `${totals.cal} kcal`, color: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600' },
            { label: 'Proteína', value: `${totals.prot}g`, color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600' },
            { label: 'Carboidrato', value: `${totals.carb}g`, color: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600' },
            { label: 'Gordura', value: `${totals.fat}g`, color: 'bg-red-50 dark:bg-red-900/30 text-red-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
              <p className="text-xs font-medium opacity-70">{label}</p>
              <p className="font-bold text-sm mt-0.5">{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Meals */}
      <div className="flex flex-col gap-3 mb-4">
        {sortedMeals.length === 0 && (
          <p className="text-slate-400 dark:text-slate-500 text-sm py-4 text-center">Nenhuma refeição adicionada.</p>
        )}

        {sortedMeals.map((meal) => {
          const isExpanded = expandedMeal === meal.id;
          const isEditingMeal = editingMealId === meal.id;
          const mealCal = meal.foods.reduce((a, f) => a + (f.calories ?? 0), 0);

          return (
            <div key={meal.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
              {/* Meal header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex flex-col items-center justify-center shrink-0">
                  <Clock size={14} className="text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-700 leading-none mt-0.5">{meal.time}</span>
                </div>

                {isEditingMeal ? (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        value={editMealForm.name}
                        onChange={(e) => setEditMealForm((p) => ({ ...p, name: e.target.value }))}
                        placeholder="Nome da refeição"
                        className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                      <input
                        type="time"
                        value={editMealForm.time}
                        onChange={(e) => setEditMealForm((p) => ({ ...p, time: e.target.value }))}
                        className="w-28 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                      />
                    </div>
                    <input
                      value={editMealForm.notes ?? ''}
                      onChange={(e) => setEditMealForm((p) => ({ ...p, notes: e.target.value }))}
                      placeholder="Observações (opcional)"
                      className="border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingMealId(null)}
                        className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 rounded-lg py-1 text-xs dark:hover:bg-slate-700"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={saveEditMeal}
                        className="flex-1 bg-emerald-600 text-white rounded-lg py-1 text-xs font-semibold"
                      >
                        Salvar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{meal.name}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      {meal.foods.length} alimento(s){mealCal > 0 ? ` · ${mealCal} kcal` : ''}
                    </p>
                    {meal.notes && <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-0.5">{meal.notes}</p>}
                  </div>
                )}

                {!isEditingMeal && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => startEditMeal(meal)} className="text-slate-400 hover:text-emerald-600 p-1">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => removeMealFromDiet(diet.id, meal.id)}
                      className="text-slate-400 hover:text-red-500 p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedMeal((p) => (p === meal.id ? null : meal.id))}
                      className="text-slate-400 p-1"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                )}
              </div>

              {/* Food list (expanded) */}
              {isExpanded && !isEditingMeal && (
                <div className="border-t border-slate-100 dark:border-slate-700 px-4 pb-4 pt-3">
                  {meal.foods.length === 0 ? (
                    <p className="text-xs text-slate-400 dark:text-slate-500 mb-3">Nenhum alimento nesta refeição.</p>
                  ) : (
                    <table className="w-full text-xs mb-3">
                      <thead>
                        <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700">
                          <th className="text-left pb-1 font-medium">Alimento</th>
                          <th className="text-left pb-1 font-medium">Quantidade</th>
                          <th className="text-right pb-1 font-medium">Kcal</th>
                          <th className="text-right pb-1 font-medium">Prot</th>
                          <th className="text-right pb-1 font-medium">Carb</th>
                          <th className="text-right pb-1 font-medium">Gord</th>
                          <th className="pb-1 w-6" />
                        </tr>
                      </thead>
                      <tbody>
                        {meal.foods.map((food) => (
                          <FoodRow
                            key={food.id}
                            food={food}
                            onDelete={() => removeFoodFromMeal(diet.id, meal.id, food.id)}
                            onSave={(data) => updateFoodInMeal(diet.id, meal.id, food.id, data)}
                          />
                        ))}
                      </tbody>
                    </table>
                  )}
                  <button
                    onClick={() => { setAddFoodMealId(meal.id); setNewFood(blankFood()); }}
                    className="flex items-center gap-1 text-xs text-emerald-600 font-medium hover:text-emerald-800"
                  >
                    <Plus size={13} />
                    Adicionar alimento
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setShowAddMeal(true)}
        className="flex items-center gap-2 text-sm text-emerald-600 font-medium hover:text-emerald-800"
      >
        <Plus size={16} />
        Adicionar refeição
      </button>

      {/* ── Add Meal Modal ───────────────────────────────────────────────────── */}
      {showAddMeal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Nova refeição</h2>
            <form onSubmit={handleAddMeal} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome da refeição</label>
                <input
                  required
                  value={newMeal.name}
                  onChange={(e) => setNewMeal((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ex: Café da manhã, Almoço..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Horário</label>
                <input
                  required
                  type="time"
                  value={newMeal.time}
                  onChange={(e) => setNewMeal((p) => ({ ...p, time: e.target.value }))}
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observações <span className="text-slate-400">(opcional)</span>
                </label>
                <input
                  value={newMeal.notes ?? ''}
                  onChange={(e) => setNewMeal((p) => ({ ...p, notes: e.target.value }))}
                  placeholder="ex: Consumir antes do treino"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowAddMeal(false)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700"
                >
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Add Food Modal ───────────────────────────────────────────────────── */}
      {addFoodMealId && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-4">Adicionar alimento</h2>
            <form onSubmit={handleAddFood} className="flex flex-col gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome do alimento</label>
                <input
                  required
                  value={newFood.name}
                  onChange={(e) => setNewFood((p) => ({ ...p, name: e.target.value }))}
                  placeholder="ex: Arroz integral, Frango grelhado..."
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Quantidade</label>
                <input
                  required
                  value={newFood.quantity}
                  onChange={(e) => setNewFood((p) => ({ ...p, quantity: e.target.value }))}
                  placeholder="ex: 100g, 1 unidade, 2 colheres de sopa"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mt-1">
                Macronutrientes <span className="normal-case font-normal text-slate-400 dark:text-slate-500">(opcional)</span>
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Calorias (kcal)</label>
                  <input
                    type="number"
                    min={0}
                    value={newFood.calories ?? ''}
                    onChange={(e) =>
                      setNewFood((p) => ({ ...p, calories: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Proteína (g)</label>
                  <input
                    type="number"
                    min={0}
                    value={newFood.protein ?? ''}
                    onChange={(e) =>
                      setNewFood((p) => ({ ...p, protein: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Carboidrato (g)</label>
                  <input
                    type="number"
                    min={0}
                    value={newFood.carbs ?? ''}
                    onChange={(e) =>
                      setNewFood((p) => ({ ...p, carbs: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Gordura (g)</label>
                  <input
                    type="number"
                    min={0}
                    value={newFood.fat ?? ''}
                    onChange={(e) =>
                      setNewFood((p) => ({ ...p, fat: e.target.value ? Number(e.target.value) : undefined }))
                    }
                    placeholder="0"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setAddFoodMealId(null)}
                  className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-emerald-700"
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

// ── FoodRow ───────────────────────────────────────────────────────────────────
interface FoodRowProps {
  food: FoodItem;
  onDelete: () => void;
  onSave: (data: Partial<FoodItem>) => void;
}

function FoodRow({ food, onDelete, onSave }: FoodRowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...food });

  if (editing) {
    return (
      <tr className="border-b border-slate-100 dark:border-slate-700 bg-emerald-50/30 dark:bg-emerald-900/10">
        <td className="py-1.5 pr-2">
          <input
            value={form.name}
            onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </td>
        <td className="py-1.5 pr-2">
          <input
            value={form.quantity}
            onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </td>
        {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
          <td key={key} className="py-1.5 pr-1 text-right">
            <input
              type="number"
              min={0}
              value={form[key] ?? ''}
              onChange={(e) =>
                setForm((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))
              }
              className="w-12 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded px-1 py-0.5 text-xs text-right focus:outline-none focus:ring-1 focus:ring-emerald-400"
            />
          </td>
        ))}
        <td className="py-1.5">
          <div className="flex gap-1">
            <button onClick={() => { onSave(form); setEditing(false); }} className="text-emerald-600">
              <Check size={13} />
            </button>
            <button onClick={() => setEditing(false)} className="text-slate-400">
              <X size={13} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
      <td className="py-1.5 pr-2 text-slate-700 dark:text-slate-200 font-medium">{food.name}</td>
      <td className="py-1.5 pr-2 text-slate-500 dark:text-slate-400">{food.quantity}</td>
      <td className="py-1.5 pr-1 text-right text-slate-500 dark:text-slate-400">{food.calories ?? '—'}</td>
      <td className="py-1.5 pr-1 text-right text-slate-500 dark:text-slate-400">{food.protein != null ? `${food.protein}g` : '—'}</td>
      <td className="py-1.5 pr-1 text-right text-slate-500 dark:text-slate-400">{food.carbs != null ? `${food.carbs}g` : '—'}</td>
      <td className="py-1.5 pr-1 text-right text-slate-500 dark:text-slate-400">{food.fat != null ? `${food.fat}g` : '—'}</td>
      <td className="py-1.5">
        <div className="flex gap-1">
          <button onClick={() => { setForm({ ...food }); setEditing(true); }} className="text-slate-400 hover:text-emerald-600">
            <Edit2 size={12} />
          </button>
          <button onClick={onDelete} className="text-slate-400 hover:text-red-500">
            <Trash2 size={12} />
          </button>
        </div>
      </td>
    </tr>
  );
}
