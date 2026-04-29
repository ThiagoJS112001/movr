import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
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
  Salad, Copy, TrendingUp, ChevronDown,
  Info, Pencil, GripVertical,
} from 'lucide-react';
import { toast } from 'sonner';
import type { FoodItem, Meal } from '../../types';

const GOALS = ['Hipertrofia', 'Definicao', 'Manutencao', 'Emagrecimento', 'Bulking'] as const;
type GoalStr = typeof GOALS[number];

const MEAL_ICONS: Record<string, string> = {
  cafe: 'sun', manha: 'sun',
  almoco: 'dish', jantar: 'moon', ceia: 'moon',
  lanche: 'sandwich', tarde: 'juice',
  pre: 'bolt', treino: 'bolt',
  pos: 'moon',
};
function getMealIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('cafe') || n.includes('manha')) return 'sun';
  if (n.includes('almoco')) return 'dish';
  if (n.includes('jantar') || n.includes('ceia') || n.includes('pos')) return 'moon';
  if (n.includes('lanche') || n.includes('tarde')) return 'sandwich';
  if (n.includes('pre') || n.includes('treino')) return 'bolt';
  return 'fork';
}
function MealEmoji({ name }: { name: string }) {
  const t = getMealIcon(name);
  const map: Record<string, string> = { sun: 'sun', dish: 'dish', moon: 'moon', sandwich: 'sandwich', juice: 'juice', bolt: 'bolt', fork: 'fork' };
  const emoji: Record<string, string> = { sun: 'a', dish: 'b', moon: 'c', sandwich: 'd', juice: 'e', bolt: 'f', fork: 'g' };
  const icons: Record<string, string> = {
    sun: 'cafe', dish: 'almoco', moon: 'jantar', sandwich: 'lanche', juice: 'tarde', bolt: 'pre-treino', fork: 'refeicao'
  };
  const emojis: Record<string, string> = { sun: 'sunrise', dish: 'dinner', moon: 'moon', sandwich: 'sandwich', juice: 'beverage', bolt: 'lightning', fork: 'utensils' };
  // fallback
  return <span className="text-xl">{
    t === 'sun' ? 'sun' :
    t === 'dish' ? 'dish' :
    t === 'moon' ? 'moon' :
    t === 'sandwich' ? 'sandwich' :
    t === 'bolt' ? 'bolt' :
    'fork'
  }</span>;
}

const INPUT_CLS = 'w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors';
const blankFood = (): Omit<FoodItem, 'id'> => ({ name: '', quantity: '', calories: undefined, protein: undefined, carbs: undefined, fat: undefined });

export default function DietaDetalhe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: diet, isLoading } = useDiet(id ?? '');
  const { data: dietAssignments = [] } = useDietAssignments();
  const updateDietMutation = useUpdateDiet(id ?? '');
  const deleteDietMutation = useDeleteDiet();
  const addMealMutation = useAddMeal(id ?? '');
  const removeMealMutation = useRemoveMeal(id ?? '');
  const updateMealMutation = useUpdateMeal(id ?? '');
  const addFoodMutation = useAddFood(id ?? '');
  const removeFoodMutation = useRemoveFood(id ?? '');
  const updateFoodMutation = useUpdateFood(id ?? '');

  const [nameVal, setNameVal] = useState('');
  const [goalVal, setGoalVal] = useState('');
  const [descVal, setDescVal] = useState('');
  const [calsVal, setCalsVal] = useState('');
  const [protVal, setProtVal] = useState('');
  const [carbVal, setCarbVal] = useState('');
  const [fatVal,  setFatVal]  = useState('');

  // Sync form fields when diet loads
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

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [addMealName, setAddMealName] = useState('');
  const [addMealTime, setAddMealTime] = useState('07:00');

  const [editMealId, setEditMealId]     = useState<string | null>(null);
  const [editMealName, setEditMealName] = useState('');
  const [editMealTime, setEditMealTime] = useState('');

  const [addFoodMealId, setAddFoodMealId] = useState<string | null>(null);
  const [newFood, setNewFood] = useState(blankFood());

  const [goalOpen, setGoalOpen]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (isLoading) return <div className="p-6 text-slate-400">Carregando...</div>;
  if (!diet) {
    return (
      <div className="p-6">
        <p className="text-slate-400">Dieta nao encontrada.</p>
        <button onClick={() => navigate(-1)} className="text-emerald-400 text-sm mt-2">Voltar</button>
      </div>
    );
  }

  const assignment = dietAssignments.find((a) => a.dietId === diet.id);

  const sortedMeals = useMemo(
    () => [...diet.meals].sort((a, b) => a.time.localeCompare(b.time)),
    [diet.meals],
  );

  const actualTotals = diet.meals.reduce(
    (acc, m) => { m.foods.forEach((f) => { acc.cal += f.calories ?? 0; acc.prot += f.protein ?? 0; acc.carb += f.carbs ?? 0; acc.fat += f.fat ?? 0; }); return acc; },
    { cal: 0, prot: 0, carb: 0, fat: 0 }
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
  const avgInterval = mealTimes.length >= 2 ? Math.round((mealTimes[mealTimes.length - 1] - mealTimes[0]) / (mealTimes.length - 1)) : null;
  const intervalLabel = avgInterval != null ? `Aprox. ${Math.floor(avgInterval / 60)}h${avgInterval % 60 > 0 ? `${avgInterval % 60}min` : ''}` : '-';

  function handleSave() {
    updateDietMutation.mutate({
      name:           nameVal.trim() || diet.name,
      description:    descVal.trim() || undefined,
      goal:           goalVal || undefined,
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
    toast.success(`Dieta excluida.`);
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

  const statusBadge = (
    diet.status === 'pausada'
      ? <span className="flex items-center gap-1 text-xs font-semibold text-amber-400 bg-amber-500/15 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Pausada</span>
      : <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />Ativa</span>
  );

  const MEALICON: Record<string, string> = { cafe: 'sunrise', almoco: 'dinner-plate', jantar: 'crescent-moon', lanche: 'sandwich', pre: 'lightning', pos: 'moon' };
  function mealEmoji(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('cafe') || n.includes('manha')) return String.fromCodePoint(0x2600);
    if (n.includes('almoco')) return String.fromCodePoint(0x1F37D, 0xFE0F);
    if (n.includes('jantar') || n.includes('ceia')) return String.fromCodePoint(0x1F319);
    if (n.includes('lanche') || n.includes('tarde')) return String.fromCodePoint(0x1F96A);
    if (n.includes('pre') || n.includes('treino')) return String.fromCodePoint(0x26A1);
    if (n.includes('pos')) return String.fromCodePoint(0x1F319);
    return String.fromCodePoint(0x1F374);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">

      {/* Top bar */}
      <div className="bg-slate-800/80 border-b border-slate-700/60 px-6 py-4 shrink-0">
        <div className="flex items-center gap-2 text-sm text-slate-400 mb-3">
          <button onClick={() => navigate(-1)} className="hover:text-white transition-colors flex items-center gap-1"><ArrowLeft size={15} /> Editar dieta</button>
          <span className="text-slate-600">/</span>
          <span className="text-xs text-slate-500">Edite as informacoes da dieta do aluno.</span>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-start gap-5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Salad size={22} className="text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-base font-bold text-white">{diet.name}</h1>
                {statusBadge}
              </div>
              <p className="text-xs text-slate-400">{diet.meals.length} refeicoes {actualTotals.cal > 0 ? `• ${Math.round(actualTotals.cal)} kcal` : ''}</p>
            </div>

            {diet.goal && (
              <div className="border-l border-slate-700 pl-5 ml-2">
                <p className="text-xs text-slate-500 mb-0.5">Objetivo</p>
                <p className="text-sm font-semibold text-indigo-400">{diet.goal}</p>
                {diet.description && <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{diet.description}</p>}
              </div>
            )}

            {assignment && (
              <div className="border-l border-slate-700 pl-5 ml-2">
                <p className="text-xs text-slate-500 mb-0.5">Aplicada ao aluno</p>
                <div className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <Check size={13} className="text-emerald-400" /> Sim
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Enviada em {new Date(assignment.assignedAt).toLocaleDateString('pt-BR')}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => toast.info('Funcao em desenvolvimento.')} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
              <TrendingUp size={14} /> Enviar alteracoes para o aluno
            </button>
            <button className="p-2.5 rounded-xl border border-slate-600 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 min-h-0">

        {/* Left form */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">

          {/* Informacoes gerais */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-4">Informacoes gerais</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nome da dieta</label>
                <input value={nameVal} onChange={(e) => setNameVal(e.target.value)} className={INPUT_CLS} placeholder="Nome da dieta" />
              </div>
              <div className="relative">
                <label className="block text-xs text-slate-400 mb-1.5">Objetivo</label>
                <button type="button" onClick={() => setGoalOpen((p) => !p)} className="w-full flex items-center justify-between bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm hover:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-colors">
                  <span className={goalVal ? 'text-white' : 'text-slate-500'}>{goalVal || 'Selecione...'}</span>
                  <ChevronDown size={14} className="text-slate-400 shrink-0" />
                </button>
                {goalOpen && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-20 py-1.5">
                    {GOALS.map((g) => (
                      <button key={g} type="button" onClick={() => { setGoalVal(g); setGoalOpen(false); }} className={`w-full text-left px-4 py-2 text-sm transition-colors ${g === goalVal ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-200 hover:bg-slate-700'}`}>{g}</button>
                    ))}
                    <button onClick={() => { setGoalVal(''); setGoalOpen(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-500 hover:bg-slate-700 border-t border-slate-700 mt-1 transition-colors">Limpar</button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Descricao (opcional)</label>
              <div className="relative">
                <textarea value={descVal} onChange={(e) => setDescVal(e.target.value.slice(0, 200))} rows={3} maxLength={200} placeholder="Descricao da dieta..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none transition-colors" />
                <span className="absolute right-3 bottom-2.5 text-xs text-slate-500 pointer-events-none">{descVal.length}/200</span>
              </div>
            </div>
          </div>

          {/* Metas diarias */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <p className="text-sm font-bold text-white">Metas diarias</p>
              <p className="text-xs text-slate-500">(ajuste os macros e calorias)</p>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: 'Calorias (kcal)', val: calsVal, set: setCalsVal, unit: 'kcal', color: 'text-emerald-400', pct: null as number | null, bar: null as string | null },
                { label: 'Proteinas (g)',   val: protVal, set: setProtVal, unit: 'g',    color: 'text-violet-400',  pct: pctProt, bar: 'bg-violet-500' },
                { label: 'Carboidratos (g)',val: carbVal, set: setCarbVal, unit: 'g',    color: 'text-amber-400',   pct: pctCarb, bar: 'bg-amber-500'  },
                { label: 'Gorduras (g)',    val: fatVal,  set: setFatVal,  unit: 'g',    color: 'text-rose-400',    pct: pctFat,  bar: 'bg-rose-500'   },
              ].map(({ label, val, set, unit, color, pct, bar }) => (
                <div key={label} className="bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-1 mb-2 flex-wrap">
                    <span className={`text-xs font-semibold ${color}`}>{label.split(' ')[0]}</span>
                    <span className="text-xs text-slate-500">{label.split(' ').slice(1).join(' ')}</span>
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <input type="number" min={0} value={val} onChange={(e) => set(e.target.value)} className="w-20 bg-transparent text-xl font-bold text-white focus:outline-none border-b border-slate-700 focus:border-emerald-500 transition-colors" placeholder="0" />
                    <span className="text-sm text-slate-400">{unit}</span>
                    {pct != null && pct > 0 && <span className="text-xs text-slate-500 ml-auto">{pct}%</span>}
                  </div>
                  {bar && (
                    <div className="h-1 rounded-full bg-slate-700 overflow-hidden">
                      <div className={`h-full rounded-full ${bar} transition-all`} style={{ width: `${pct ?? 0}%` }} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Refeicoes do dia */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-bold text-white">Refeicoes do dia</p>
              <button type="button" onClick={() => setAddMealOpen((p) => !p)} className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
                <Plus size={13} /> Adicionar refeicao
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Arraste para reordenar as refeicoes</p>

            {addMealOpen && (
              <div className="flex gap-2 mb-4 bg-slate-900/60 border border-emerald-500/30 rounded-xl px-3 py-3">
                <input value={addMealName} onChange={(e) => setAddMealName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMeal(); } }} placeholder="Nome da refeicao..." className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none" autoFocus />
                <input type="time" value={addMealTime} onChange={(e) => setAddMealTime(e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={addMeal} disabled={!addMealName.trim()} className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs disabled:opacity-40 transition-colors">Adicionar</button>
                <button onClick={() => setAddMealOpen(false)} className="p-1 text-slate-400 hover:text-white"><X size={14} /></button>
              </div>
            )}

            {sortedMeals.length === 0 && !addMealOpen ? (
              <div className="border border-dashed border-slate-700 rounded-xl py-8 text-center">
                <p className="text-sm text-slate-500">Nenhuma refeicao adicionada.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-700/40">
                {sortedMeals.map((meal) => {
                  const mealCal = meal.foods.reduce((s, f) => s + (f.calories ?? 0), 0);
                  const foodNames = meal.foods.map((f) => f.name).join(', ');
                  const isEditingMeal = editMealId === meal.id;
                  return (
                    <div key={meal.id} className="py-3.5">
                      {isEditingMeal ? (
                        <div className="flex gap-2 items-center">
                          <GripVertical size={14} className="text-slate-600 shrink-0" />
                          <span className="text-xl w-8 text-center shrink-0">{mealEmoji(meal.name)}</span>
                          <input value={editMealName} onChange={(e) => setEditMealName(e.target.value)} className="flex-1 bg-slate-800 border border-emerald-500/60 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <input type="time" value={editMealTime} onChange={(e) => setEditMealTime(e.target.value)} className="w-24 bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                          <button onClick={saveEditMeal} className="p-1.5 rounded-lg bg-emerald-600 text-white"><Check size={13} /></button>
                          <button onClick={() => setEditMealId(null)} className="p-1.5 rounded-lg bg-slate-700 text-slate-300"><X size={13} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <GripVertical size={14} className="text-slate-600 shrink-0 cursor-grab" />
                          <span className="text-xl w-8 text-center shrink-0">{mealEmoji(meal.name)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-100">{meal.name}</p>
                            <p className="text-xs text-slate-500 truncate">{meal.time}{foodNames && ` - ${foodNames}`}</p>
                          </div>
                          <p className="text-sm font-semibold text-slate-300 shrink-0">{mealCal > 0 ? `${mealCal} kcal` : ''}</p>
                          <button onClick={() => { setEditMealId(meal.id); setEditMealName(meal.name); setEditMealTime(meal.time); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Pencil size={13} /></button>
                          <button onClick={() => { addMealMutation.mutate({ name: `${meal.name} (copia)`, time: meal.time, foods: [] }); toast.success('Refeicao duplicada.'); }} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"><Copy size={13} /></button>
                          <button onClick={() => removeMealMutation.mutate(meal.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-900/20 transition-colors"><Trash2 size={13} /></button>
                        </div>
                      )}
                      {!isEditingMeal && (
                        <div className="ml-[60px] mt-2 space-y-1">
                          {meal.foods.map((food) => (
                            <FoodRow key={food.id} food={food} onDelete={() => removeFoodMutation.mutate({ mealId: meal.id, foodId: food.id })} onSave={(data) => updateFoodMutation.mutate({ mealId: meal.id, foodId: food.id, data })} />
                          ))}
                          <button onClick={() => { setAddFoodMealId(meal.id); setNewFood(blankFood()); }} className="text-xs text-slate-500 hover:text-emerald-400 transition-colors mt-1">+ Adicionar alimento</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-[310px] shrink-0 border-l border-slate-700/60 px-4 py-6 space-y-4 overflow-y-auto">

          {/* Resumo nutricional */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-4">Resumo nutricional</p>
            <div className="flex items-center gap-3 mb-4">
              {/* donut */}
              <svg width="120" height="120" viewBox="0 0 120 120">
                {(() => {
                  const r = 44; const cx = 60; const cy = 60; const circ = 2 * Math.PI * r;
                  const segs = [
                    { pct: pctProt,  color: '#818cf8' },
                    { pct: pctCarb,  color: '#f59e0b' },
                    { pct: pctFat,   color: '#34d399' },
                  ];
                  let offset = 0;
                  return (
                    <>
                      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1e293b" strokeWidth={16} />
                      {segs.map(({ pct, color }, i) => {
                        const dash = (pct / 100) * circ;
                        const el = <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={16} strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={circ * 0.25 - (offset / 100) * circ} />;
                        offset += pct;
                        return el;
                      })}
                      <text x={cx} y={cy - 5} textAnchor="middle" fill="white" fontSize="17" fontWeight="bold">{dispCal > 0 ? Math.round(dispCal) : '—'}</text>
                      <text x={cx} y={cy + 11} textAnchor="middle" fill="#94a3b8" fontSize="10">kcal</text>
                    </>
                  );
                })()}
              </svg>
              <div className="flex flex-col gap-2.5 flex-1">
                {[
                  { label: 'Proteinas',    val: dispProt, pct: pctProt, color: 'bg-[#818cf8]' },
                  { label: 'Carboidratos', val: dispCarb, pct: pctCarb, color: 'bg-amber-400'  },
                  { label: 'Gorduras',     val: dispFat,  pct: pctFat,  color: 'bg-emerald-400' },
                ].map(({ label, val, pct, color }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${color} shrink-0`} />
                    <span className="text-xs text-slate-300 flex-1">{label}</span>
                    <span className="text-xs font-bold text-white">{val > 0 ? Math.round(val) : '—'}g</span>
                    <span className="text-xs text-slate-500 w-8 text-right">{pct > 0 ? `${pct}%` : ''}</span>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full text-xs text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 rounded-xl py-2 px-3 transition-colors flex items-center justify-between">
              Ver distribuicao detalhada <ChevronDown size={12} className="-rotate-90" />
            </button>
          </div>

          {/* Outras informacoes */}
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5">
            <p className="text-sm font-bold text-white mb-3">Outras informacoes</p>
            <div className="space-y-2.5">
              <div className="flex justify-between text-xs"><span className="text-slate-400">Frequencia de refeicoes</span><span className="text-white font-semibold">{diet.meals.length} refeicoes</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-400">Intervalo medio</span><span className="text-white font-semibold">{intervalLabel}</span></div>
              <div className="flex justify-between text-xs"><span className="text-slate-400">Hidratacao sugerida</span><span className="text-white font-semibold">{diet.meals.length >= 4 ? '3,0 L/dia' : '2,5 L/dia'}</span></div>
            </div>
          </div>

          {/* Info salvar */}
          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-indigo-300 mb-1">Ao salvar as alteracoes</p>
                <p className="text-xs text-slate-400">As modificacoes serao aplicadas apenas apos voce enviar para o aluno.</p>
              </div>
            </div>
          </div>

          {/* Excluir */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
            <div className="flex items-start gap-2">
              <Trash2 size={14} className="text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-400 mb-1">Excluir dieta</p>
                <p className="text-xs text-slate-400 mb-3">Esta acao nao pode ser desfeita.</p>
                {confirmDelete ? (
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmDelete(false)} className="flex-1 text-xs border border-slate-600 text-slate-300 rounded-lg py-1.5 hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button onClick={handleDelete} className="flex-1 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg py-1.5 transition-colors">Confirmar</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDelete(true)} className="w-full text-xs border border-red-500/50 text-red-400 hover:bg-red-900/30 rounded-lg py-1.5 transition-colors">Excluir dieta</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur border-t border-slate-700/60 px-6 py-4 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Ativa — Dieta em uso pelo aluno</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Pausada — Dieta temporariamente pausada</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-500" />Rascunho — Nao enviada ao aluno</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="px-4 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
            <button onClick={toggleStatus} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors ${diet.status === 'pausada' ? 'border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30' : 'border-amber-500/50 text-amber-400 hover:bg-amber-900/30'}`}>
              {diet.status === 'pausada' ? <><Check size={14} /> Ativar dieta</> : <><span>||</span> Pausar dieta</>}
            </button>
            <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-900/30 text-sm font-semibold transition-colors">
              <Trash2 size={14} /> Excluir dieta
            </button>
            <button onClick={handleSave} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors">
              <Check size={14} /> Salvar alteracoes
            </button>
          </div>
        </div>
      </div>

      {/* Add Food Modal */}
      {addFoodMealId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={(e) => { if (e.target === e.currentTarget) setAddFoodMealId(null); }}>
          <div className="bg-slate-900 border border-slate-700/60 rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="text-base font-bold text-white mb-4">Adicionar alimento</h2>
            <form onSubmit={handleAddFood} className="flex flex-col gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nome do alimento</label>
                <input required value={newFood.name} onChange={(e) => setNewFood((p) => ({ ...p, name: e.target.value }))} placeholder="ex: Arroz integral, Frango grelhado..." className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Quantidade</label>
                <input required value={newFood.quantity} onChange={(e) => setNewFood((p) => ({ ...p, quantity: e.target.value }))} placeholder="ex: 100g, 1 unidade" className={INPUT_CLS} />
              </div>
              <p className="text-xs text-slate-500 font-semibold uppercase mt-1">Macronutrientes <span className="normal-case font-normal">(opcional)</span></p>
              <div className="grid grid-cols-2 gap-3">
                {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
                  <div key={key}>
                    <label className="block text-xs text-slate-400 mb-1.5">{key === 'calories' ? 'Calorias (kcal)' : key === 'protein' ? 'Proteina (g)' : key === 'carbs' ? 'Carboidrato (g)' : 'Gordura (g)'}</label>
                    <input type="number" min={0} value={newFood[key] ?? ''} onChange={(e) => setNewFood((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))} placeholder="0" className={INPUT_CLS} />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setAddFoodMealId(null)} className="flex-1 border border-slate-600 text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-700 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors">Adicionar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

interface FoodRowProps { food: FoodItem; onDelete: () => void; onSave: (data: Partial<FoodItem>) => void; }

function FoodRow({ food, onDelete, onSave }: FoodRowProps) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...food });

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2">
        <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="flex-1 bg-transparent text-xs text-white focus:outline-none border-b border-slate-600 focus:border-emerald-500" placeholder="Nome" />
        <input value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} className="w-16 bg-transparent text-xs text-white focus:outline-none border-b border-slate-600 focus:border-emerald-500" placeholder="Qtd" />
        {(['calories', 'protein', 'carbs', 'fat'] as const).map((key) => (
          <input key={key} type="number" min={0} value={form[key] ?? ''} onChange={(e) => setForm((p) => ({ ...p, [key]: e.target.value ? Number(e.target.value) : undefined }))} className="w-10 bg-transparent text-xs text-white text-right focus:outline-none border-b border-slate-600 focus:border-emerald-500" placeholder="0" />
        ))}
        <button onClick={() => { onSave(form); setEditing(false); }} className="text-emerald-400 hover:text-emerald-300"><Check size={12} /></button>
        <button onClick={() => setEditing(false)} className="text-slate-400 hover:text-white"><X size={12} /></button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200 group px-1">
      <span className="flex-1 text-slate-300 truncate">{food.name}</span>
      <span className="text-slate-500">{food.quantity}</span>
      <span className="w-14 text-right">{food.calories != null ? `${food.calories} kcal` : ''}</span>
      <span className="w-10 text-right">{food.protein != null ? `${food.protein}g` : ''}</span>
      <span className="w-10 text-right">{food.carbs != null ? `${food.carbs}g` : ''}</span>
      <span className="w-10 text-right">{food.fat != null ? `${food.fat}g` : ''}</span>
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => { setForm({ ...food }); setEditing(true); }} className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"><Edit2 size={11} /></button>
        <button onClick={onDelete} className="p-1 rounded hover:bg-red-900/30 text-slate-400 hover:text-red-400"><Trash2 size={11} /></button>
      </div>
    </div>
  );
}
