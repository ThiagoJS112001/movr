import { useState, useMemo } from 'react';
import { X, Plus, Trash2, Salad, TrendingUp, TrendingDown, Activity, Scale, GripVertical, MoreVertical, CheckCircle2, Droplets } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useCreateDiet, useAssignDiet as useAssignDietMutation } from '../hooks/useDiets';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { Meal } from '../types';

const GOALS = [
  { key: 'hipertrofia',   label: 'Hipertrofia',  Icon: TrendingUp   },
  { key: 'definicao',     label: 'Definição',    Icon: Activity     },
  { key: 'manutencao',    label: 'Manutenção',   Icon: Scale        },
  { key: 'emagrecimento', label: 'Emagrecimento', Icon: TrendingDown },
] as const;

type GoalKey = typeof GOALS[number]['key'];

const MEAL_ICONS: Record<string, string> = {
  'café': '☀️', 'cafe': '☀️', 'manhã': '☀️', 'manha': '☀️',
  'almoço': '🍽️', 'almoco': '🍽️',
  'tarde': '🧃', 'lanche': '🥙',
  'pré': '⚡', 'pre': '⚡', 'treino': '⚡',
  'pós': '🌙', 'pos': '🌙', 'jantar': '🌙', 'ceia': '🌙',
};
function getMealIcon(name: string): string {
  const n = name.toLowerCase();
  for (const [key, icon] of Object.entries(MEAL_ICONS)) {
    if (n.includes(key)) return icon;
  }
  return '🍴';
}

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-colors';

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

type MealEntry = { id: string; name: string; time: string };

export default function NewDietModal({ studentId, studentName, onClose }: Props) {
  const { user } = useAuth();
  const createDietMutation = useCreateDiet();
  const assignDietMutation = useAssignDietMutation();

  const [name, setName] = useState('');
  const [goal, setGoal] = useState<GoalKey | ''>('');

  // Daily macro targets
  const [targetCals, setTargetCals]     = useState('');
  const [targetProt, setTargetProt]     = useState('');
  const [targetCarbs, setTargetCarbs]   = useState('');
  const [targetFat, setTargetFat]       = useState('');

  // Meals
  const [meals, setMeals]               = useState<MealEntry[]>([]);
  const [addMealOpen, setAddMealOpen]   = useState(false);
  const [addMealName, setAddMealName]   = useState('');
  const [addMealTime, setAddMealTime]   = useState('07:00');
  const [mealMenuId, setMealMenuId]     = useState<string | null>(null);

  // Notes
  const [notes, setNotes] = useState('');

  // Derived macro math
  const protG  = parseFloat(targetProt)  || 0;
  const carbG  = parseFloat(targetCarbs) || 0;
  const fatG   = parseFloat(targetFat)   || 0;
  const macroCals = protG * 4 + carbG * 4 + fatG * 9;
  const pctProt  = macroCals > 0 ? Math.round((protG * 4 / macroCals) * 100) : 0;
  const pctCarbs = macroCals > 0 ? Math.round((carbG * 4 / macroCals) * 100) : 0;
  const pctFat   = macroCals > 0 ? Math.round((fatG  * 9 / macroCals) * 100) : 0;

  const sortedMeals = useMemo(
    () => [...meals].sort((a, b) => a.time.localeCompare(b.time)),
    [meals],
  );

  function addMeal() {
    if (!addMealName.trim()) return;
    setMeals((prev) => [...prev, { id: uuidv4(), name: addMealName.trim(), time: addMealTime }]);
    setAddMealName('');
    setAddMealTime('07:00');
    setAddMealOpen(false);
  }

  function removeMeal(id: string) {
    setMeals((prev) => prev.filter((m) => m.id !== id));
    setMealMenuId(null);
  }

  async function handleCreate() {
    if (!name.trim()) {
      toast.error('Informe o nome da dieta.');
      return;
    }
    if (!user) return;

    const dietMeals: Meal[] = meals.map((m) => ({
      id: m.id,
      name: m.name,
      time: m.time,
      foods: [],
    }));

    const diet = await createDietMutation.mutateAsync({
      name:            name.trim(),
      description:     notes.trim() || undefined,
      goal:            goal || undefined,
      personalId:      user.id,
      status:          'ativa',
      meals:           dietMeals,
      targetCalories:  parseFloat(targetCals)  || undefined,
      targetProtein:   protG   || undefined,
      targetCarbs:     carbG   || undefined,
      targetFat:       fatG    || undefined,
    });

    assignDietMutation.mutate({
      dietId:     diet.id,
      dietName:   diet.name,
      studentId,
      personalId: user.id,
    });

    toast.success(`Dieta "${diet.name}" criada e atribuída a ${studentName}!`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">

        {/* â”€â”€ Header â”€â”€ */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
              <Salad size={20} className="text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nova dieta</h2>
              <p className="text-xs text-slate-400">Crie uma nova dieta para o aluno.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* â”€â”€ Body â”€â”€ */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left panel */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 border-r border-white/[0.07]">

            {/* Nome da dieta */}
            <div>
              <label className="block text-sm font-semibold text-slate-200 mb-1.5">Nome da dieta</label>
              <div className="relative">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 60))}
                  maxLength={60}
                  placeholder="Ex: Dieta de Hipertrofia"
                  className={INPUT_CLS}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                  {name.length}/60
                </span>
              </div>
            </div>

            {/* Objetivo da dieta */}
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Objetivo da dieta</p>
              <p className="text-xs text-slate-500 mb-3">Selecione o principal objetivo desta dieta.</p>
              <div className="grid grid-cols-4 gap-2">
                {GOALS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setGoal((prev) => (prev === key ? '' : key))}
                    className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                      goal === key
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-[#0D1025] border-white/[0.07] text-slate-300 hover:border-slate-500 hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Metas diárias */}
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">Metas diárias</p>
              <p className="text-xs text-slate-500 mb-3">Defina as metas nutricionais diárias.</p>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Calorias (kcal)</label>
                  <input type="number" min="0" value={targetCals}  onChange={(e) => setTargetCals(e.target.value)}  placeholder="2500" className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Proteínas (g)</label>
                  <input type="number" min="0" value={targetProt}  onChange={(e) => setTargetProt(e.target.value)}  placeholder="180"  className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Carboidratos (g)</label>
                  <input type="number" min="0" value={targetCarbs} onChange={(e) => setTargetCarbs(e.target.value)} placeholder="300"  className={INPUT_CLS} />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Gorduras (g)</label>
                  <input type="number" min="0" value={targetFat}   onChange={(e) => setTargetFat(e.target.value)}   placeholder="80"   className={INPUT_CLS} />
                </div>
              </div>
            </div>

            {/* Distribuição de macronutrientes */}
            {macroCals > 0 && (
              <div>
                <p className="text-sm font-semibold text-slate-200 mb-3">Distribuição de macronutrientes</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Proteínas',    g: protG, pct: pctProt,  color: 'bg-violet-500' },
                    { label: 'Carboidratos', g: carbG, pct: pctCarbs, color: 'bg-amber-500'  },
                    { label: 'Gorduras',     g: fatG,  pct: pctFat,   color: 'bg-rose-500'   },
                  ].map(({ label, g, pct, color }) => (
                    <div key={label} className="bg-[#0D1025]/60 rounded-xl p-3 border border-white/[0.07]">
                      <p className="text-lg font-bold text-white">{g}g</p>
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
                          <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Refeições */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-semibold text-slate-200">Refeições</p>
                <button
                  type="button"
                  onClick={() => setAddMealOpen((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <Plus size={13} /> Adicionar refeição
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-3">Configure as refeições que farão parte da dieta.</p>

              {/* Inline add form */}
              {addMealOpen && (
                <div className="flex gap-2 mb-3">
                  <input
                    value={addMealName}
                    onChange={(e) => setAddMealName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addMeal(); } }}
                    placeholder="Nome da refeição..."
                    className="flex-1 bg-[#0D1025] border border-emerald-500/60 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                  />
                  <input
                    type="time"
                    value={addMealTime}
                    onChange={(e) => setAddMealTime(e.target.value)}
                    className="w-24 bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={addMeal}
                    disabled={!addMealName.trim()}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40 transition-colors"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              )}

              {meals.length === 0 && !addMealOpen ? (
                <div className="border border-dashed border-white/[0.07] rounded-xl py-8 text-center">
                  <p className="text-sm text-slate-500">Nenhuma refeição adicionada.</p>
                  <button
                    type="button"
                    onClick={() => setAddMealOpen(true)}
                    className="mt-2 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Adicionar primeira refeição
                  </button>
                </div>
              ) : (
                <div className="flex flex-col divide-y divide-slate-700/40">
                  {sortedMeals.map((m) => (
                    <div key={m.id} className="flex items-center gap-3 py-3">
                      <GripVertical size={14} className="text-slate-600 shrink-0 cursor-grab" />
                      <span className="text-xl w-8 text-center shrink-0">{getMealIcon(m.name)}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-100">{m.name}</p>
                        <p className="text-xs text-slate-500">{m.time} · 0 alimentos</p>
                      </div>
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setMealMenuId(mealMenuId === m.id ? null : m.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                          <MoreVertical size={13} />
                        </button>
                        {mealMenuId === m.id && (
                          <div className="absolute right-0 top-full mt-1 w-36 bg-[#0D1025] rounded-xl shadow-lg border border-white/[0.07] z-20 py-1">
                            <button
                              onClick={() => removeMeal(m.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                            >
                              <Trash2 size={12} /> Remover
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Observações */}
            <div>
              <p className="text-sm font-semibold text-slate-200 mb-1">
                Observações <span className="text-xs font-normal text-slate-500">(opcional)</span>
              </p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Adicione informações adicionais sobre esta dieta..."
                className="w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none transition-colors"
              />
            </div>
          </div>

          {/* â”€â”€ Right panel: Resumo diário â”€â”€ */}
          <div className="w-[290px] shrink-0 flex flex-col overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.07] shrink-0">
              <p className="text-sm font-bold text-white">Resumo diário</p>
              <p className="text-xs text-slate-400 mt-0.5">Visão geral da dieta criada.</p>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

              {/* Calorias */}
              <div className="bg-[#0D1025]/60 border border-white/[0.07] rounded-xl px-4 py-3.5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-400">Calorias</p>
                  <Droplets size={14} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-bold text-white">
                  {targetCals ? parseInt(targetCals).toLocaleString('pt-BR') : 'â€”'}
                  {targetCals && <span className="text-sm font-normal text-slate-400 ml-1">kcal</span>}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">/ dia</p>
              </div>

              {/* Proteínas */}
              <div className="bg-[#0D1025]/60 border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-slate-400">Proteínas</p>
                  {pctProt > 0 && <span className="text-xs text-slate-400">{pctProt}%</span>}
                </div>
                <p className="text-xl font-bold text-white">
                  {protG > 0 ? protG : 'â€”'}
                  {protG > 0 && <span className="text-sm font-normal text-slate-400 ml-1">g</span>}
                </p>
                <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${pctProt}%` }} />
                </div>
              </div>

              {/* Carboidratos */}
              <div className="bg-[#0D1025]/60 border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-slate-400">Carboidratos</p>
                  {pctCarbs > 0 && <span className="text-xs text-slate-400">{pctCarbs}%</span>}
                </div>
                <p className="text-xl font-bold text-white">
                  {carbG > 0 ? carbG : 'â€”'}
                  {carbG > 0 && <span className="text-sm font-normal text-slate-400 ml-1">g</span>}
                </p>
                <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${pctCarbs}%` }} />
                </div>
              </div>

              {/* Gorduras */}
              <div className="bg-[#0D1025]/60 border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-slate-400">Gorduras</p>
                  {pctFat > 0 && <span className="text-xs text-slate-400">{pctFat}%</span>}
                </div>
                <p className="text-xl font-bold text-white">
                  {fatG > 0 ? fatG : 'â€”'}
                  {fatG > 0 && <span className="text-sm font-normal text-slate-400 ml-1">g</span>}
                </p>
                <div className="mt-2 h-1 rounded-full bg-slate-700 overflow-hidden">
                  <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${pctFat}%` }} />
                </div>
              </div>

              {/* Refeições */}
              <div className="bg-[#0D1025]/60 border border-white/[0.07] rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs text-slate-400">Refeições</p>
                  <Salad size={14} className="text-emerald-400" />
                </div>
                <p className="text-xl font-bold text-white">{meals.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {meals.length === 1 ? '1 refeição' : `${meals.length} refeições`} / 0 alimentos
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* â”€â”€ Footer â”€â”€ */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.07] shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold disabled:opacity-40 transition-colors"
          >
            <CheckCircle2 size={15} />
            Criar dieta
          </button>
        </div>
      </div>
    </div>
  );
}
