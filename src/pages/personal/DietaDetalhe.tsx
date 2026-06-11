import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useDiet,
  useUpdateDiet,
  useDeleteDiet,
  useDietAssignments,
  useAddMeal,
  useRemoveMeal,
  useUpdateMeal,
  useAddFood,
  useRemoveFood,
  useUpdateFood,
} from '../../hooks/useDiets';
import {
  ArrowLeft, Plus, Trash2, Edit2, Check, X,
  Salad, ChevronDown, Info, Pencil,
  GripVertical, Flame, Clock, Users, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FoodItem } from '../../types';

// ── Constants ─────────────────────────────────────────────────────────────────

const GOALS = [
  { key: 'Hipertrofia',   label: 'Hipertrofia'   },
  { key: 'Definicao',     label: 'Definição'     },
  { key: 'Manutencao',    label: 'Manutenção'    },
  { key: 'Emagrecimento', label: 'Emagrecimento' },
  { key: 'Bulking',       label: 'Bulking'       },
] as const;

const GOAL_LABEL: Record<string, string> = Object.fromEntries(GOALS.map((g) => [g.key, g.label]));

const INPUT_CLS =
  'w-full bg-[#080B18] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/40 transition-colors';

const blankFood = (): Omit<FoodItem, 'id'> => ({
  name: '', quantity: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined,
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMealEmoji(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
  if (/cafe|manha/.test(n)) return '☀️';
  if (/almoco/.test(n))     return '🍽️';
  if (/jantar|ceia/.test(n)) return '🌙';
  if (/lanche|tarde/.test(n)) return '🥪';
  if (/pre|treino/.test(n)) return '⚡';
  if (/pos/.test(n))        return '🥤';
  return '🍴';
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
      <div className="flex items-center gap-2 bg-white/[0.04] border border-emerald-500/30 rounded-xl px-3 py-2">
        <input
          value={form.name}
          onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
          className="flex-1 bg-transparent text-xs text-white focus:outline-none border-b border-slate-600 focus:border-emerald-500 pb-0.5"
          placeholder="Nome"
        />
        <input
          value={form.quantity}
          onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))}
          className="w-16 bg-transparent text-xs text-white focus:outline-none border-b border-slate-600 focus:border-emerald-500 pb-0.5"
          placeholder="Qtd"
        />
        {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
          <input
            key={key}
            type="number"
            min={0}
            value={form[key] ?? ''}
            onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))}
            className="w-10 bg-transparent text-xs text-white text-right focus:outline-none border-b border-slate-600 focus:border-emerald-500 pb-0.5"
            placeholder="0"
          />
        ))}
        <button onClick={() => { onSave(form); setEditing(false); }} className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors">
          <Check size={12} />
        </button>
        <button onClick={() => setEditing(false)} className="p-1 text-slate-400 hover:text-white transition-colors">
          <X size={12} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 group px-2 py-1.5 rounded-lg hover:bg-white/[0.03] transition-colors">
      <span className="flex-1 text-slate-300 truncate">{food.name}</span>
      <span className="text-slate-500 shrink-0">{food.quantity}</span>
      <span className="w-16 text-right text-slate-400 shrink-0">{food.calories != null ? `${food.calories} kcal` : '—'}</span>
      <span className="w-10 text-right text-violet-400 shrink-0">{food.protein != null ? `${food.protein}g P` : ''}</span>
      <span className="w-10 text-right text-amber-400 shrink-0">{food.carbs != null ? `${food.carbs}g C` : ''}</span>
      <span className="w-8 text-right text-rose-400 shrink-0">{food.fat != null ? `${food.fat}g G` : ''}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setForm({ ...food }); setEditing(true); }} className="p-1 rounded hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors">
          <Edit2 size={11} />
        </button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400 transition-colors">
          <Trash2 size={11} />
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function DietaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: diet, isLoading } = useDiet(id ?? '');
  const { data: dietAssignments = [] } = useDietAssignments();
  const updateDietMutation = useUpdateDiet(id ?? '');
  const deleteDietMutation = useDeleteDiet();
  const addMealMutation    = useAddMeal(id ?? '');
  const removeMealMutation = useRemoveMeal(id ?? '');
  const updateMealMutation = useUpdateMeal(id ?? '');
  const addFoodMutation    = useAddFood(id ?? '');
  const removeFoodMutation = useRemoveFood(id ?? '');
  const updateFoodMutation = useUpdateFood(id ?? '');

  const [nameVal, setNameVal] = useState('');
  const [goalVal, setGoalVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [calsVal, setCalsVal] = useState('');
  const [protVal, setProtVal] = useState('');
  const [carbVal, setCarbVal] = useState('');
  const [fatVal,  setFatVal]  = useState('');
  const [goalOpen, setGoalOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addMealName, setAddMealName] = useState('');
  const [addMealTime, setAddMealTime] = useState('07:00');
  const [editMealId, setEditMealId] = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealTime, setEditMealTime] = useState('');
  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null);
  const [newFood, setNewFood] = useState(blankFood());

  useEffect(() => {
    if (diet) {
      setNameVal(diet.name);
      setGoalVal(diet.goal ?? '');
      setDescVal(diet.description ?? '');
      setCalsVal(String(diet.targetCalories ?? ''));
      setProtVal(String(diet.targetProtein ?? ''));
      setCarbVal(String(diet.targetCarbs ?? ''));
      setFatVal(String(diet.targetFat ?? ''));
    }
  }, [diet?.id]);

  const sortedMeals = useMemo(
    () => [...(diet?.meals ?? [])].sort((a, b) => a.time.localeCompare(b.time)),
    [diet?.meals],
  );

  if (isLoading) {
    return (
      <div className="p-6 max-w-screen-xl mx-auto space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-white/[0.06] rounded-xl" />
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-40 bg-white/[0.04] rounded-2xl" />)}</div>
          <div className="h-64 bg-white/[0.04] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!diet) {
    return (
      <div className="p-6 text-center text-slate-400 py-20">
        <Salad size={36} className="mx-auto mb-3 opacity-30" />
        <p>Dieta não encontrada.</p>
        <button onClick={() => navigate(-1)} className="mt-3 text-sm text-emerald-400 hover:underline">Voltar</button>
      </div>
    );
  }

  const assignment = dietAssignments.find((a) => a.dietId === diet.id);

  const actualTotals = diet.meals.reduce(
    (acc, m) => { m.foods.forEach((f) => { acc.cal += f.calories ?? 0; acc.prot += f.protein ?? 0; acc.carb += f.carbs ?? 0; acc.fat += f.fat ?? 0; }); return acc; },
    { cal: 0, prot: 0, carb: 0, fat: 0 },
  );

  const dispCal  = parseFloat(calsVal) || actualTotals.cal;
  const dispProt = parseFloat(protVal) || actualTotals.prot;
  const dispCarb = parseFloat(carbVal) || actualTotals.carb;
  const dispFat  = parseFloat(fatVal)  || actualTotals.fat;
  const macroSum = dispProt * 4 + dispCarb * 4 + dispFat * 9;
  const pctProt  = macroSum > 0 ? Math.round((dispProt * 4 / macroSum) * 100) : 0;
  const pctCarb  = macroSum > 0 ? Math.round((dispCarb * 4 / macroSum) * 100) : 0;
  const pctFat   = macroSum > 0 ? Math.round((dispFat  * 9 / macroSum) * 100) : 0;

  const mealTimes = sortedMeals.map((m) => { const [h, mm] = m.time.split(':').map(Number); return h * 60 + mm; });
  const avgInterval = mealTimes.length >= 2
    ? Math.round((mealTimes[mealTimes.length - 1] - mealTimes[0]) / (mealTimes.length - 1))
    : null;
  const intervalLabel = avgInterval != null
    ? `~${Math.floor(avgInterval / 60)}h${avgInterval % 60 > 0 ? `${avgInterval % 60}min` : ''}`
    : '—';

  function handleSave() {
    updateDietMutation.mutate({
      name:           nameVal.trim() || diet.name,
      description:    descVal.trim() || undefined,
      goal:           goalVal        || undefined,
      targetCalories: parseFloat(calsVal) || undefined,
      targetProtein:  parseFloat(protVal) || undefined,
      targetCarbs:    parseFloat(carbVal) || undefined,
      targetFat:      parseFloat(fatVal)  || undefined,
    });
    toast.success('Dieta atualizada!');
    navigate(-1);
  }

  function handleDelete() {
    deleteDietMutation.mutate(diet.id);
    toast.success('Dieta excluída.');
    navigate('/personal/dietas');
  }

  function toggleStatus() {
    const next = diet.status === 'pausada' ? 'ativa' : 'pausada';
    updateDietMutation.mutate({ status: next });
    toast.success(next === 'pausada' ? 'Dieta pausada.' : 'Dieta ativada.');
  }

  function addMeal() {
    if (!addMealName.trim()) return;
    addMealMutation.mutate({ name: addMealName.trim(), time: addMealTime, foods: [] });
    setAddMealName(''); setAddMealTime('07:00'); setAddMealOpen(false);
  }

  function saveEditMeal() {
    if (!editMealId || !editMealName.trim()) return;
    updateMealMutation.mutate({ mealId: editMealId, data: { name: editMealName.trim(), time: editMealTime } });
    setEditMealId(null);
  }

  function handleAddFood(e: React.FormEvent) {
    e.preventDefault();
    if (!addFoodMealId) return;
    addFoodMutation.mutate({ mealId: addFoodMealId, food: newFood });
    setNewFood(blankFood()); setAddFoodMealId(null);
  }

  const statusBadge = diet.status === 'pausada'
    ? <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full border border-amber-500/20"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pausada</span>
    : <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Ativa</span>;

  return (
    <div className="min-h-screen bg-[#080B18]">

      {/* ── Header ── */}
      <div className="bg-[#0D1025] border-b border-white/[0.06] px-6 py-4 sticky top-0 z-10">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={15} />
              <span className="hidden sm:inline">Voltar</span>
            </button>
            <div className="h-5 w-px bg-white/[0.08]" />
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <Salad size={16} className="text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-bold text-white leading-tight">{diet.name}</h1>
                  {statusBadge}
                </div>
                <p className="text-xs text-slate-500">
                  {diet.meals.length} refeição{diet.meals.length !== 1 ? 'ões' : ''}
                  {actualTotals.cal > 0 && ` • ${Math.round(actualTotals.cal)} kcal`}
                  {assignment && ' • Aplicada ao aluno'}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors"
          >
            <Check size={14} /> Salvar alterações
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6 items-start">

          {/* Left column */}
          <div className="flex flex-col gap-5">

            {/* Informações gerais */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Salad size={14} className="text-emerald-400" /> Informações gerais
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome da dieta</label>
                  <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} className={INPUT_CLS} placeholder="Nome da dieta" />
                </div>
                <div className="relative">
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Objetivo</label>
                  <button
                    type="button"
                    onClick={() => setGoalOpen((p) => !p)}
                    className="w-full flex items-center justify-between bg-[#080B18] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm hover:border-emerald-500/40 focus:outline-none transition-colors"
                  >
                    <span className={goalVal ? 'text-white' : 'text-slate-500'}>
                      {goalVal ? (GOAL_LABEL[goalVal] ?? goalVal) : 'Selecione...'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0" />
                  </button>
                  {goalOpen && (
                    <div className="absolute top-full mt-1 left-0 right-0 bg-[#0D1025] border border-white/[0.07] rounded-xl shadow-xl z-20 py-1.5">
                      {GOALS.map(({ key, label }) => (
                        <button key={key} type="button" onClick={() => { setGoalVal(key); setGoalOpen(false); }}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${key === goalVal ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-200 hover:bg-white/[0.05]'}`}>
                          {label}
                        </button>
                      ))}
                      <button onClick={() => { setGoalVal(''); setGoalOpen(false); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-white/[0.05] border-t border-white/[0.06] mt-1 transition-colors">
                        Limpar seleção
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição <span className="text-slate-500 font-normal">(opcional)</span></label>
                <div className="relative">
                  <textarea value={descVal} onChange={(e) => setDescVal(e.target.value.slice(0, 200))} rows={3} maxLength={200}
                    placeholder="Breve descrição..." className={`${INPUT_CLS} resize-none`} />
                  <span className="absolute right-3 bottom-2.5 text-xs text-slate-600 pointer-events-none">{descVal.length}/200</span>
                </div>
              </div>
            </div>

            {/* Metas nutricionais */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
                <Flame size={14} className="text-orange-400" /> Metas nutricionais diárias
              </h2>
              <p className="text-xs text-slate-500 mb-4">Defina as metas de calorias e macronutrientes.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                  { label: 'Calorias', unit: 'kcal', val: calsVal, set: setCalsVal, color: 'text-orange-400', bar: null as string | null, pct: null as number | null },
                  { label: 'Proteínas', unit: 'g', val: protVal, set: setProtVal, color: 'text-violet-400', bar: 'bg-violet-500', pct: pctProt },
                  { label: 'Carboidratos', unit: 'g', val: carbVal, set: setCarbVal, color: 'text-amber-400', bar: 'bg-amber-500', pct: pctCarb },
                  { label: 'Gorduras', unit: 'g', val: fatVal, set: setFatVal, color: 'text-rose-400', bar: 'bg-rose-500', pct: pctFat },
                ] as const).map(({ label, unit, val, set, color, bar, pct }) => (
                  <div key={label} className="bg-[#080B18] border border-white/[0.06] rounded-xl px-4 py-3">
                    <p className={`text-xs font-semibold ${color} mb-2`}>{label}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <input type="number" min={0} value={val} onChange={(e) => set(e.target.value)}
                        className="w-20 bg-transparent text-xl font-bold text-white focus:outline-none" placeholder="0" />
                      <span className="text-xs text-slate-500">{unit}</span>
                      {pct != null && pct > 0 && <span className="text-xs text-slate-600 ml-auto">{pct}%</span>}
                    </div>
                    {bar && (
                      <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                        <div className={`h-full rounded-full ${bar} transition-all duration-300`} style={{ width: `${pct ?? 0}%` }} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Refeições */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock size={14} className="text-emerald-400" /> Refeições do dia
                </h2>
                <button type="button" onClick={() => setAddMealOpen((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                  <Plus size={13} /> Adicionar refeição
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">Configure as refeições e os alimentos da dieta.</p>

              {addMealOpen && (
                <div className="flex gap-2 mb-4 bg-[#080B18] border border-emerald-500/30 rounded-xl px-3 py-2.5">
                  <input value={addMealName} onChange={(e) => setAddMealName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMeal(); } }}
                    placeholder="Ex: Café da manhã, Almoço..." autoFocus
                    className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" />
                  <input type="time" value={addMealTime} onChange={(e) => setAddMealTime(e.target.value)}
                    className="w-24 bg-[#0D1025] border border-white/[0.07] rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                  <button onClick={addMeal} disabled={!addMealName.trim()}
                    className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-40 transition-colors">
                    Adicionar
                  </button>
                  <button onClick={() => setAddMealOpen(false)} className="p-1 text-slate-400 hover:text-white transition-colors"><X size={14} /></button>
                </div>
              )}

              {sortedMeals.length === 0 && !addMealOpen ? (
                <div className="border border-dashed border-white/[0.06] rounded-xl py-10 flex flex-col items-center text-slate-500">
                  <Salad size={28} className="mb-2 opacity-30" />
                  <p className="text-sm">Nenhuma refeição adicionada.</p>
                  <button type="button" onClick={() => setAddMealOpen(true)}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors">
                    + Adicionar primeira refeição
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {sortedMeals.map((meal) => {
                    const mealCal = meal.foods.reduce((s, f) => s + (f.calories ?? 0), 0);
                    const mealProt = meal.foods.reduce((s, f) => s + (f.protein ?? 0), 0);
                    const isEditingMeal = editMealId === meal.id;

                    return (
                      <div key={meal.id} className="bg-[#080B18] border border-white/[0.06] rounded-xl overflow-hidden">
                        {/* Meal header */}
                        <div className={`flex items-center gap-3 px-4 py-3 ${isEditingMeal ? 'bg-emerald-500/5 border-b border-emerald-500/20' : ''}`}>
                          <GripVertical size={14} className="text-slate-600 cursor-grab shrink-0" />
                          <span className="text-lg w-7 text-center shrink-0 select-none">{getMealEmoji(meal.name)}</span>

                          {isEditingMeal ? (
                            <>
                              <input value={editMealName} onChange={(e) => setEditMealName(e.target.value)}
                                className="flex-1 bg-[#0D1025] border border-emerald-500/60 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                              <input type="time" value={editMealTime} onChange={(e) => setEditMealTime(e.target.value)}
                                className="w-24 bg-[#0D1025] border border-white/[0.07] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40" />
                              <button onClick={saveEditMeal} className="p-1.5 rounded-lg bg-emerald-600 text-white transition-colors"><Check size={13} /></button>
                              <button onClick={() => setEditMealId(null)} className="p-1.5 rounded-lg bg-white/[0.05] text-slate-300 transition-colors"><X size={13} /></button>
                            </>
                          ) : (
                            <>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                                <p className="text-xs text-slate-500">
                                  {meal.time}
                                  {mealCal > 0 && ` • ${mealCal} kcal`}
                                  {mealProt > 0 && ` • ${Math.round(mealProt)}g prot.`}
                                </p>
                              </div>
                              <span className="text-xs text-slate-600 shrink-0">
                                {meal.foods.length} {meal.foods.length === 1 ? 'alimento' : 'alimentos'}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => { setEditMealId(meal.id); setEditMealName(meal.name); setEditMealTime(meal.time); }}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors" title="Editar">
                                  <Pencil size={13} />
                                </button>
                                <button onClick={() => removeMealMutation.mutate(meal.id)}
                                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-900/20 transition-colors" title="Remover">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Foods list */}
                        {!isEditingMeal && (
                          <div className="px-4 pb-3">
                            {meal.foods.length > 0 && (
                              <div className="mb-1.5">
                                <div className="flex items-center gap-2 text-[10px] font-semibold text-slate-600 uppercase tracking-wide px-2 py-1 mb-1">
                                  <span className="flex-1">Alimento</span>
                                  <span className="w-16 text-right">Qtd.</span>
                                  <span className="w-16 text-right">Kcal</span>
                                  <span className="w-10 text-right">P</span>
                                  <span className="w-10 text-right">C</span>
                                  <span className="w-8 text-right">G</span>
                                  <span className="w-14" />
                                </div>
                                <div className="flex flex-col gap-0.5">
                                  {meal.foods.map((food) => (
                                    <FoodRow key={food.id} food={food}
                                      onDelete={() => removeFoodMutation.mutate({ mealId: meal.id, foodId: food.id })}
                                      onSave={(data) => updateFoodMutation.mutate({ mealId: meal.id, foodId: food.id, data })}
                                    />
                                  ))}
                                </div>
                              </div>
                            )}
                            <button
                              onClick={() => { setAddFoodMealId(meal.id); setNewFood(blankFood()); }}
                              className="text-xs text-slate-500 hover:text-emerald-400 transition-colors flex items-center gap-1.5 mt-1.5"
                            >
                              <Plus size={11} /> Adicionar alimento
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button onClick={() => setConfirmDelete(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 border border-red-500/30 hover:bg-red-900/20 rounded-xl transition-colors">
                  <Trash2 size={14} /> Excluir
                </button>
                <button onClick={toggleStatus}
                  className={`flex items-center gap-2 px-4 py-2 text-sm border rounded-xl transition-colors ${
                    diet.status === 'pausada'
                      ? 'text-emerald-400 border-emerald-500/30 hover:bg-emerald-900/20'
                      : 'text-amber-400 border-amber-500/30 hover:bg-amber-900/20'
                  }`}>
                  {diet.status === 'pausada' ? <><Check size={14} /> Ativar</> : <>⏸ Pausar</>}
                </button>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => navigate(-1)}
                  className="px-4 py-2 text-sm text-slate-400 hover:text-white border border-white/[0.07] hover:border-white/20 rounded-xl transition-colors">
                  Cancelar
                </button>
                <button onClick={handleSave}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors">
                  <Check size={14} /> Salvar alterações
                </button>
              </div>
            </div>
          </div>

          {/* ── Right sidebar ── */}
          <div className="flex flex-col gap-4">

            {/* Nutritional summary */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">Resumo nutricional</h3>
              <div className="flex items-center gap-4 mb-4">
                <svg width="96" height="96" viewBox="0 0 96 96" className="shrink-0">
                  {(() => {
                    const r = 34; const cx = 48; const cy = 48;
                    const circ = 2 * Math.PI * r;
                    const segs = [
                      { pct: pctProt, color: '#818cf8' },
                      { pct: pctCarb, color: '#f59e0b' },
                      { pct: pctFat,  color: '#f43f5e' },
                    ];
                    let offset = 0;
                    return (
                      <>
                        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={12} />
                        {segs.map(({ pct, color }, i) => {
                          const dash = (pct / 100) * circ;
                          const el = (
                            <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color}
                              strokeWidth={12} strokeDasharray={`${dash} ${circ - dash}`}
                              strokeDashoffset={circ * 0.25 - (offset / 100) * circ} />
                          );
                          offset += pct;
                          return el;
                        })}
                        <text x={cx} y={cy - 4} textAnchor="middle" fill="white" fontSize="13" fontWeight="bold">
                          {dispCal > 0 ? Math.round(dispCal) : '—'}
                        </text>
                        <text x={cx} y={cy + 8} textAnchor="middle" fill="#94a3b8" fontSize="8">kcal</text>
                      </>
                    );
                  })()}
                </svg>
                <div className="flex flex-col gap-2 flex-1">
                  {[
                    { label: 'Proteínas',  val: dispProt, pct: pctProt, dot: 'bg-[#818cf8]', text: 'text-[#818cf8]' },
                    { label: 'Carboid.',   val: dispCarb, pct: pctCarb, dot: 'bg-amber-400', text: 'text-amber-400' },
                    { label: 'Gorduras',   val: dispFat,  pct: pctFat,  dot: 'bg-rose-500',  text: 'text-rose-400' },
                  ].map(({ label, val, pct, dot, text }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dot} shrink-0`} />
                      <span className="text-xs text-slate-400 flex-1">{label}</span>
                      <span className={`text-xs font-bold ${text}`}>{val > 0 ? `${Math.round(val)}g` : '—'}</span>
                      {pct > 0 && <span className="text-[10px] text-slate-600 w-7 text-right">{pct}%</span>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Estatísticas</h3>
              <div className="space-y-2.5">
                {[
                  { label: 'Refeições', value: diet.meals.length.toString() },
                  { label: 'Intervalo médio', value: intervalLabel },
                  { label: 'Total de alimentos', value: diet.meals.reduce((s, m) => s + m.foods.length, 0).toString() },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="font-semibold text-white">{value}</span>
                  </div>
                ))}
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Aplicada ao aluno</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${assignment ? 'text-emerald-400 bg-emerald-500/15' : 'text-slate-500 bg-white/[0.05]'}`}>
                    {assignment ? 'Sim' : 'Não'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tip */}
            <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-2.5">
              <Info size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Clique em <strong className="text-white">Salvar alterações</strong> para atualizar a dieta. As mudanças serão refletidas para o aluno.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Food Modal ── */}
      {addFoodMealId && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setAddFoodMealId(null); }}>
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-white">Adicionar alimento</h2>
              <button onClick={() => setAddFoodMealId(null)} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleAddFood} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome do alimento <span className="text-red-400">*</span></label>
                <input required value={newFood.name} onChange={(e) => setNewFood((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ex: Arroz integral, Frango grelhado..." className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Quantidade <span className="text-red-400">*</span></label>
                <input required value={newFood.quantity} onChange={(e) => setNewFood((p) => ({ ...p, quantity: e.target.value }))}
                  placeholder="Ex: 100g, 1 unidade, 2 col. sopa" className={INPUT_CLS} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-400 mb-2">Macronutrientes <span className="text-slate-500 font-normal">(opcional)</span></p>
                <div className="grid grid-cols-2 gap-3">
                  {([['calories', 'Calorias (kcal)'], ['protein', 'Proteína (g)'], ['carbs', 'Carboidrato (g)'], ['fat', 'Gordura (g)']] as const).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
                      <input type="number" min={0} value={newFood[key] ?? ''}
                        onChange={(e) => setNewFood((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))}
                        placeholder="0" className={INPUT_CLS} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setAddFoodMealId(null)}
                  className="flex-1 border border-white/[0.07] text-slate-300 rounded-xl py-2.5 text-sm hover:bg-white/[0.05] transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl w-full max-w-sm p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">Excluir dieta?</h3>
                <p className="text-xs text-slate-400">Esta ação não pode ser desfeita.</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 mb-5">
              A dieta <strong className="text-white">"{diet.name}"</strong> será excluída permanentemente.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(false)}
                className="flex-1 border border-white/[0.07] text-slate-300 rounded-xl py-2.5 text-sm hover:bg-white/[0.05] transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
