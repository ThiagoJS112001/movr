import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useDiets, useCreateDiet, useUpdateDiet, useDeleteDiet } from '../../hooks/useDiets';
import { addMealToDiet } from '../../services/diets';
import type { Diet } from '../../types';
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Salad, ArrowLeft, Flame,
  Clock, Info, X, Search, Beef, Wheat, Droplets,
  Download, Edit2, Copy, ChevronDown, Check,
} from 'lucide-react';
import { toast } from 'sonner';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const OBJECTIVES = [
  'Ganho de massa',
  'Perda de peso',
  'Manutenção',
  'Performance',
  'Saúde geral',
  'Cutting',
  'Bulking',
];

const RESTRICTION_LEVELS = ['Leve', 'Moderada', 'Restritiva'];

const PREFERENCE_CHIPS = [
  'Sem glúten',
  'Sem lactose',
  'Vegetariana',
  'Vegana',
  'Low carb',
  'Low fat',
  'Sem açúcar',
];

const MEAL_COLORS = [
  '#f97316', '#facc15', '#22c55e', '#ef4444',
  '#8b5cf6', '#3b82f6', '#ec4899', '#06b6d4',
];

interface DraftMeal {
  id: string;
  name: string;
  time: string;
  estimatedKcal: number;
}

// â”€â”€ Donut Chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DonutChart({
  proteinG, carbsG, fatG, targetKcal,
}: {
  proteinG: number;
  carbsG: number;
  fatG: number;
  targetKcal: number;
}) {
  const r = 45;
  const circ = 2 * Math.PI * r;
  const pKcal = proteinG * 4;
  const cKcal = carbsG * 4;
  const fKcal = fatG * 9;
  const total = pKcal + cKcal + fKcal;

  if (total === 0) {
    return (
      <div className="flex justify-center">
        <svg viewBox="0 0 120 120" width="150" height="150">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#1e2130" strokeWidth="18" />
          <text x="60" y="55" textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="sans-serif">Preencha</text>
          <text x="60" y="67" textAnchor="middle" fill="#4b5563" fontSize="9" fontFamily="sans-serif">os macros</text>
        </svg>
      </div>
    );
  }

  const pDash = (pKcal / total) * circ;
  const cDash = (cKcal / total) * circ;
  const fDash = (fKcal / total) * circ;
  const displayKcal = targetKcal > 0 ? targetKcal : Math.round(total);

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 120 120" width="150" height="150">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#1e2130" strokeWidth="18" />
        {pDash > 0 && (
          <circle cx="60" cy="60" r={r} fill="none" stroke="#3b82f6" strokeWidth="18"
            strokeDasharray={`${pDash} ${circ}`} strokeDashoffset={0}
            transform="rotate(-90 60 60)"
          />
        )}
        {cDash > 0 && (
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f97316" strokeWidth="18"
            strokeDasharray={`${cDash} ${circ}`} strokeDashoffset={-pDash}
            transform="rotate(-90 60 60)"
          />
        )}
        {fDash > 0 && (
          <circle cx="60" cy="60" r={r} fill="none" stroke="#ef4444" strokeWidth="18"
            strokeDasharray={`${fDash} ${circ}`} strokeDashoffset={-(pDash + cDash)}
            transform="rotate(-90 60 60)"
          />
        )}
        <text x="60" y="54" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold" fontFamily="sans-serif">
          {displayKcal.toLocaleString('pt-BR')}
        </text>
        <text x="60" y="68" textAnchor="middle" fill="#6b7280" fontSize="9" fontFamily="sans-serif">
          kcal / dia
        </text>
      </svg>
    </div>
  );
}

// â”€â”€ Macro bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MacroBar({ label, pct, color, grams }: {
  label: string; pct: number; color: string; grams: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-400 w-24 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#080B18] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-slate-400 w-16 text-right shrink-0">{grams}g · {pct}%</span>
    </div>
  );
}

// â”€â”€ Preview macro row â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function MacroPreviewRow({ label, grams, kcal, pct, color }: {
  label: string; grams: number; kcal: number; pct: number; color: string;
}) {
  return (
    <div className="flex items-center justify-between text-xs py-0.5">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
        <span className="text-slate-300">{label}</span>
      </div>
      <div className="flex items-center gap-3 text-right">
        <span className="text-slate-500">{grams}g</span>
        <span className="text-slate-400">{Math.round(kcal)} kcal</span>
        <span className="font-medium text-slate-300 w-8">{pct}%</span>
      </div>
    </div>
  );
}

// â”€â”€ Diet Creation Form â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function DietFormPage({ onBack, diet: editDiet }: { onBack: () => void; diet?: Diet }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEditing = !!editDiet;
  const createDietMutation = useCreateDiet();
  const updateDietMutation = useUpdateDiet(editDiet?.id ?? '');

  // Basic info
  const [name, setName] = useState(editDiet?.name ?? '');
  const [objective, setObjective] = useState(editDiet?.goal ?? '');
  const [durationDays, setDurationDays] = useState(editDiet?.durationDays?.toString() ?? '');
  const [restrictionLevel, setRestrictionLevel] = useState(editDiet?.restrictionLevel ?? '');
  const [observations, setObservations] = useState(editDiet?.description ?? '');

  // Macros
  const [calories, setCalories] = useState(editDiet?.targetCalories?.toString() ?? '');
  const [proteinG, setProteinG] = useState(editDiet?.targetProtein?.toString() ?? '');
  const [carbsG, setCarbsG] = useState(editDiet?.targetCarbs?.toString() ?? '');
  const [fatG, setFatG] = useState(editDiet?.targetFat?.toString() ?? '');

  // Preferences
  const [preferences, setPreferences] = useState<string[]>(editDiet?.preferences ?? []);
  const [customPref, setCustomPref] = useState('');

  // Favorite foods
  const [favoriteFoods, setFavoriteFoods] = useState<string[]>(editDiet?.favoriteFoods ?? []);
  const [foodInput, setFoodInput] = useState('');

  // Draft meals — seed with existing meals when editing
  const [meals, setMeals] = useState<DraftMeal[]>(() =>
    editDiet?.meals.map(m => ({
      id: m.id,
      name: m.name,
      time: m.time,
      estimatedKcal: m.targetCalories ?? 0,
    })) ?? [],
  );
  const [addingMeal, setAddingMeal] = useState(false);
  const [mealName, setMealName] = useState('');
  const [mealTime, setMealTime] = useState('');
  const [mealKcal, setMealKcal] = useState('');

  // Computed macros
  const p = parseFloat(proteinG) || 0;
  const c = parseFloat(carbsG) || 0;
  const f = parseFloat(fatG) || 0;
  const totalMacroKcal = p * 4 + c * 4 + f * 9;
  const pPct = totalMacroKcal > 0 ? Math.round((p * 4 / totalMacroKcal) * 100) : 0;
  const cPct = totalMacroKcal > 0 ? Math.round((c * 4 / totalMacroKcal) * 100) : 0;
  const fPct = totalMacroKcal > 0 ? Math.round((f * 9 / totalMacroKcal) * 100) : 0;

  const mealsTotalKcal = meals.reduce((acc, m) => acc + m.estimatedKcal, 0);

  function togglePref(pref: string) {
    setPreferences(prev =>
      prev.includes(pref) ? prev.filter(x => x !== pref) : [...prev, pref],
    );
  }

  function addCustomPref() {
    const val = customPref.trim();
    if (!val || preferences.includes(val)) return;
    setPreferences(prev => [...prev, val]);
    setCustomPref('');
  }

  function addFood() {
    const val = foodInput.trim();
    if (!val || favoriteFoods.includes(val)) return;
    setFavoriteFoods(prev => [...prev, val]);
    setFoodInput('');
  }

  function addDraftMeal() {
    const nm = mealName.trim();
    const tm = mealTime.trim();
    if (!nm || !tm) return;
    setMeals(prev => [
      ...prev,
      { id: crypto.randomUUID(), name: nm, time: tm, estimatedKcal: parseInt(mealKcal) || 0 },
    ]);
    setMealName('');
    setMealTime('');
    setMealKcal('');
    setAddingMeal(false);
  }

  function removeDraftMeal(id: string) {
    setMeals(prev => prev.filter(m => m.id !== id));
  }

  async function handleSave() {
    if (!user || !name.trim()) {
      toast.error('Nome da dieta é obrigatório.');
      return;
    }
    try {
      if (isEditing && editDiet) {
        await updateDietMutation.mutateAsync({
          name: name.trim(),
          description: observations.trim() || undefined,
          goal: objective || undefined,
          targetCalories: parseInt(calories) || undefined,
          targetProtein: p || undefined,
          targetCarbs: c || undefined,
          targetFat: f || undefined,
          durationDays: parseInt(durationDays) || undefined,
          restrictionLevel: restrictionLevel || undefined,
          preferences,
          favoriteFoods,
        });

        // Add only brand-new meals (those whose id isn't already in the DB)
        const existingIds = new Set(editDiet.meals.map(m => m.id));
        for (const m of meals) {
          if (!existingIds.has(m.id)) {
            await addMealToDiet(editDiet.id, {
              name: m.name,
              time: m.time,
              notes: undefined,
              foods: [],
              targetCalories: m.estimatedKcal || undefined,
            });
          }
        }

        toast.success(`Dieta "${name.trim()}" atualizada!`);
        onBack();
      } else {
        const diet = await createDietMutation.mutateAsync({
          name: name.trim(),
          description: observations.trim() || undefined,
          goal: objective || undefined,
          personalId: user.id,
          status: 'ativa',
          targetCalories: parseInt(calories) || undefined,
          targetProtein: p || undefined,
          targetCarbs: c || undefined,
          targetFat: f || undefined,
          durationDays: parseInt(durationDays) || undefined,
          restrictionLevel: restrictionLevel || undefined,
          preferences,
          favoriteFoods,
        });

        for (const m of meals) {
          await addMealToDiet(diet.id, {
            name: m.name,
            time: m.time,
            notes: undefined,
            foods: [],
            targetCalories: m.estimatedKcal || undefined,
          });
        }

        toast.success(`Dieta "${diet.name}" criada!`);
        navigate(`/personal/dietas/${diet.id}`);
      }
    } catch {
      toast.error(isEditing ? 'Erro ao atualizar dieta.' : 'Erro ao criar dieta.');
    }
  }

  const inputCls =
    'w-full bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#7c5cfc] transition';
  const labelCls = 'block text-xs font-medium text-slate-400 mb-1.5';
  const cardCls = 'bg-[#0D1025] rounded-2xl p-5 border border-white/[0.07]';

  return (
    <div className="min-h-screen">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-10 bg-[#080B18]/95 backdrop-blur-sm border-b border-white/[0.07] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-100 transition-colors"
          >
            <ArrowLeft size={15} />
            Voltar para dietas
          </button>
          <span className="text-slate-700">|</span>
          <div>
            <h1 className="text-base font-bold text-slate-100">{isEditing ? 'Editar dieta' : 'Nova dieta'}</h1>
            <p className="text-xs text-slate-500">{isEditing ? `Editando: ${editDiet!.name}` : 'Preencha os dados para criar a dieta'}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={createDietMutation.isPending || updateDietMutation.isPending}
          className="flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6d4ef0] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          {(createDietMutation.isPending || updateDietMutation.isPending) ? 'Salvando...' : isEditing ? 'Atualizar dieta' : 'Salvar dieta'}
        </button>
      </div>

      {/* Two-column grid */}
      <div className="p-6 grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 max-w-screen-xl mx-auto">

        {/* â”€â”€ LEFT column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col gap-5">

          {/* Informações básicas */}
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Informações básicas</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Nome da dieta *</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="ex: Dieta de Hipertrofia"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Objetivo principal</label>
                <select value={objective} onChange={e => setObjective(e.target.value)} className={inputCls}>
                  <option value="">Selecione...</option>
                  {OBJECTIVES.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>Duração</label>
                <div className="relative">
                  <input
                    type="number"
                    value={durationDays}
                    onChange={e => setDurationDays(e.target.value)}
                    placeholder="30"
                    min={1}
                    className={`${inputCls} pr-12`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">
                    dias
                  </span>
                </div>
              </div>
              <div>
                <label className={labelCls}>Nível de restrição</label>
                <select
                  value={restrictionLevel}
                  onChange={e => setRestrictionLevel(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Selecione...</option>
                  {RESTRICTION_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelCls}>
                Observações gerais{' '}
                <span className="text-slate-600 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={observations}
                  onChange={e => setObservations(e.target.value.slice(0, 300))}
                  rows={3}
                  placeholder="Objetivo e considerações da dieta..."
                  className={`${inputCls} resize-none`}
                />
                <span className="absolute bottom-2.5 right-3 text-xs text-slate-600 pointer-events-none">
                  {observations.length}/300
                </span>
              </div>
            </div>
          </div>

          {/* Macros alvo */}
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-slate-200 mb-4">Macros alvo (por dia)</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Flame size={11} className="text-orange-400" />
                    Calorias
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number" value={calories}
                    onChange={e => setCalories(e.target.value)}
                    placeholder="2400" min={0}
                    className={`${inputCls} pr-12`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">kcal</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Beef size={11} className="text-blue-400" />
                    Proteínas
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number" value={proteinG}
                    onChange={e => setProteinG(e.target.value)}
                    placeholder="160" min={0}
                    className={`${inputCls} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">g</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Wheat size={11} className="text-orange-400" />
                    Carboidratos
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number" value={carbsG}
                    onChange={e => setCarbsG(e.target.value)}
                    placeholder="300" min={0}
                    className={`${inputCls} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">g</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  <span className="inline-flex items-center gap-1.5">
                    <Droplets size={11} className="text-red-400" />
                    Gorduras
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="number" value={fatG}
                    onChange={e => setFatG(e.target.value)}
                    placeholder="70" min={0}
                    className={`${inputCls} pr-8`}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">g</span>
                </div>
              </div>
            </div>
            {totalMacroKcal > 0 && (
              <div className="flex flex-col gap-2.5 pt-3 border-t border-white/[0.07]">
                <MacroBar label="Proteínas" pct={pPct} color="#3b82f6" grams={p} />
                <MacroBar label="Carboidratos" pct={cPct} color="#f97316" grams={c} />
                <MacroBar label="Gorduras" pct={fPct} color="#ef4444" grams={f} />
              </div>
            )}
          </div>

          {/* Preferências alimentares */}
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-slate-200 mb-3">Preferências alimentares</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {PREFERENCE_CHIPS.map(chip => {
                const active = preferences.includes(chip);
                return (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => togglePref(chip)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      active
                        ? 'bg-[#7c5cfc]/20 border-[#7c5cfc] text-[#a78bfa]'
                        : 'bg-transparent border-white/[0.07] text-slate-400 hover:border-[#7c5cfc]/40 hover:text-slate-200'
                    }`}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
            {preferences.filter(x => !PREFERENCE_CHIPS.includes(x)).length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {preferences.filter(x => !PREFERENCE_CHIPS.includes(x)).map(x => (
                  <span key={x} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-[#7c5cfc]/20 border border-[#7c5cfc] text-[#a78bfa]">
                    {x}
                    <button type="button" onClick={() => togglePref(x)} className="hover:text-white ml-0.5">
                      <X size={9} />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={customPref}
                onChange={e => setCustomPref(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomPref(); } }}
                placeholder="Adicionar preferência personalizada..."
                className={`${inputCls} flex-1`}
              />
              <button
                type="button"
                onClick={addCustomPref}
                className="px-3 rounded-xl border border-white/[0.07] text-slate-400 hover:border-[#7c5cfc] hover:text-[#a78bfa] transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          {/* Alimentos favoritos */}
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-slate-200 mb-0.5">
              Alimentos favoritos{' '}
              <span className="text-slate-500 font-normal text-xs">(opcional)</span>
            </h2>
            <p className="text-xs text-slate-500 mb-3">Alimentos frequentemente usados nesta dieta</p>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={foodInput}
                  onChange={e => setFoodInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFood(); } }}
                  placeholder="Nome do alimento..."
                  className={`${inputCls} pl-8`}
                />
              </div>
              <button
                type="button"
                onClick={addFood}
                className="px-4 py-2 rounded-xl bg-[#7c5cfc]/10 border border-[#7c5cfc]/30 text-[#a78bfa] hover:bg-[#7c5cfc]/20 text-xs font-medium transition-colors whitespace-nowrap"
              >
                + Adicionar
              </button>
            </div>
            {favoriteFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {favoriteFoods.map(food => (
                  <span
                    key={food}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs bg-[#080B18] border border-white/[0.07] text-slate-300"
                  >
                    {food}
                    <button
                      type="button"
                      onClick={() => setFavoriteFoods(prev => prev.filter(x => x !== food))}
                      className="text-slate-500 hover:text-slate-100 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* â”€â”€ RIGHT column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex flex-col gap-5">

          {/* Refeições do dia */}
          <div className={cardCls}>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-200">Refeições do dia</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {meals.length} refeição(ões)
                {mealsTotalKcal > 0 && ` · ${mealsTotalKcal.toLocaleString('pt-BR')} kcal estimados`}
              </p>
            </div>

            {meals.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {meals.map((meal, idx) => {
                  const color = MEAL_COLORS[idx % MEAL_COLORS.length];
                  return (
                    <div
                      key={meal.id}
                      className="flex items-center gap-3 p-3 bg-[#080B18] rounded-xl border border-white/[0.07]"
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ backgroundColor: color }}
                      >
                        {meal.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">{meal.name}</p>
                        <p className="text-xs text-slate-500">
                          <Clock size={10} className="inline mr-1 mb-px" />
                          {meal.time}
                          {meal.estimatedKcal > 0 && ` · ${meal.estimatedKcal} kcal`}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDraftMeal(meal.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors flex-shrink-0"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {addingMeal ? (
              <div className="bg-[#080B18] rounded-xl p-3 border border-[#7c5cfc]/30 flex flex-col gap-2">
                <input
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                  placeholder="Nome da refeição (ex: Café da manhã)"
                  className={inputCls}
                  autoFocus
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={mealTime}
                    onChange={e => setMealTime(e.target.value)}
                    className={inputCls}
                  />
                  <div className="relative">
                    <input
                      type="number"
                      value={mealKcal}
                      onChange={e => setMealKcal(e.target.value)}
                      placeholder="kcal estimado"
                      min={0}
                      className={`${inputCls} pr-10`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 pointer-events-none">kcal</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={addDraftMeal}
                    disabled={!mealName.trim() || !mealTime.trim()}
                    className="flex-1 bg-[#7c5cfc] hover:bg-[#6d4ef0] disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-xl transition-colors"
                  >
                    Adicionar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingMeal(false);
                      setMealName('');
                      setMealTime('');
                      setMealKcal('');
                    }}
                    className="flex-1 border border-white/[0.07] text-slate-400 text-xs py-2 rounded-xl hover:bg-[#2a2d3a]/50 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMeal(true)}
                className="w-full border border-dashed border-white/[0.07] hover:border-[#7c5cfc]/50 text-slate-500 hover:text-[#a78bfa] text-sm py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Adicionar refeição
              </button>
            )}
          </div>

          {/* Preview de um dia */}
          <div className={cardCls}>
            <h2 className="text-sm font-semibold text-slate-200 mb-0.5">Preview de um dia</h2>
            <p className="text-xs text-slate-500 mb-4">Distribuição de macros estimada</p>

            <DonutChart
              proteinG={p}
              carbsG={c}
              fatG={f}
              targetKcal={parseInt(calories) || 0}
            />

            {totalMacroKcal > 0 && (
              <div className="mt-4 flex flex-col gap-1.5 pt-3 border-t border-white/[0.07]">
                <MacroPreviewRow label="Proteínas" grams={p} kcal={p * 4} pct={pPct} color="#3b82f6" />
                <MacroPreviewRow label="Carboidratos" grams={c} kcal={c * 4} pct={cPct} color="#f97316" />
                <MacroPreviewRow label="Gorduras" grams={f} kcal={f * 9} pct={fPct} color="#ef4444" />
              </div>
            )}

            <div className="flex items-start gap-2 mt-4 p-3 bg-[#080B18] rounded-xl border border-white/[0.07]">
              <Info size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500">
                Os valores são aproximados e baseados nos macrosâ€‘alvo informados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Diet List â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// ── Diet List helpers ──────────────────────────────────────────────────────────

const LIST_ITEMS_PER_PAGE = 7;

const NIVEL_MAP: Record<string, { label: string; color: string }> = {
  Leve:       { label: 'Fácil',    color: 'text-emerald-400 bg-emerald-500/10' },
  Moderada:   { label: 'Moderada', color: 'text-amber-400   bg-amber-500/10'   },
  Restritiva: { label: 'Difícil',  color: 'text-red-400     bg-red-500/10'     },
};

const DIET_STATUS_META: Record<string, { label: string; dot: string; badge: string }> = {
  ativa:   { label: 'Ativa',   dot: 'bg-emerald-400', badge: 'text-emerald-400 bg-emerald-500/10' },
  pausada: { label: 'Pausada', dot: 'bg-amber-400',   badge: 'text-amber-400   bg-amber-500/10'   },
};

const GOAL_STYLES: Record<string, { bg: string; icon: React.ReactNode }> = {
  'Ganho de massa': { bg: 'bg-emerald-500/15', icon: <Salad    size={15} className="text-emerald-400" /> },
  'Bulking':        { bg: 'bg-emerald-500/15', icon: <Salad    size={15} className="text-emerald-400" /> },
  'Perda de peso':  { bg: 'bg-orange-500/15',  icon: <Flame    size={15} className="text-orange-400" /> },
  'Cutting':        { bg: 'bg-orange-500/15',  icon: <Flame    size={15} className="text-orange-400" /> },
  'Emagrecimento':  { bg: 'bg-orange-500/15',  icon: <Flame    size={15} className="text-orange-400" /> },
  'Manutenção':     { bg: 'bg-blue-500/15',    icon: <Salad    size={15} className="text-blue-400" />    },
  'Performance':    { bg: 'bg-cyan-500/15',    icon: <Beef     size={15} className="text-cyan-400" />    },
  'Definição':      { bg: 'bg-indigo-500/15',  icon: <Beef     size={15} className="text-indigo-400" />  },
  'Saúde geral':    { bg: 'bg-teal-500/15',    icon: <Salad    size={15} className="text-teal-400" />    },
};

function getGoalStyle(goal?: string): { bg: string; icon: React.ReactNode } {
  if (goal && GOAL_STYLES[goal]) return GOAL_STYLES[goal];
  return { bg: 'bg-violet-500/15', icon: <Salad size={15} className="text-violet-400" /> };
}

import React from 'react';

function DietListPage({ onNew, onEdit }: { onNew: () => void; onEdit: (diet: Diet) => void }) {
  const { data: diets = [], isLoading } = useDiets();
  const deleteDietMutation = useDeleteDiet();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterGoal, setFilterGoal] = useState('');
  const [filterLevel, setFilterLevel] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => { setPage(1); }, [search, filterStatus, filterGoal, filterLevel]);

  const totalDiets    = diets.length;
  const activeDiets   = diets.filter(d => d.status === 'ativa').length;
  const pausedDiets   = diets.filter(d => d.status === 'pausada').length;

  const filtered = diets.filter(d => {
    if (search) {
      const q = search.toLowerCase();
      if (!d.name.toLowerCase().includes(q) && !(d.goal?.toLowerCase().includes(q)) && !(d.description?.toLowerCase().includes(q))) return false;
    }
    if (filterStatus && d.status !== filterStatus) return false;
    if (filterGoal   && d.goal  !== filterGoal)    return false;
    if (filterLevel  && d.restrictionLevel !== filterLevel) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / LIST_ITEMS_PER_PAGE));
  const pageData   = filtered.slice((page - 1) * LIST_ITEMS_PER_PAGE, page * LIST_ITEMS_PER_PAGE);

  const allGoals  = Array.from(new Set(diets.map(d => d.goal).filter(Boolean))) as string[];
  const allLevels = Array.from(new Set(diets.map(d => d.restrictionLevel).filter(Boolean))) as string[];

  const THCls = 'text-xs font-semibold text-slate-500 uppercase tracking-wide';

  return (
    <div className="p-5 max-w-screen-xl mx-auto flex flex-col gap-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Todas as dietas</h1>
          <p className="text-sm text-slate-500 mt-0.5">Visualize e gerencie todas as dietas cadastradas na plataforma.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-slate-300 text-sm hover:bg-white/[0.04] transition-colors">
            <Download size={14} />
            Exportar
          </button>
          <button
            onClick={onNew}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
          >
            <Plus size={14} />
            Nova dieta
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center mb-3">
            <Salad size={18} className="text-violet-400" />
          </div>
          <p className="text-3xl font-bold text-white">{totalDiets}</p>
          <p className="text-xs text-slate-400 mt-0.5">Total de dietas</p>
          <p className="text-xs text-slate-600 mt-0.5">dietas cadastradas</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center mb-3">
            <Check size={18} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-white">{activeDiets}</p>
          <p className="text-xs text-slate-400 mt-0.5">Dietas ativas</p>
          <p className="text-xs text-emerald-400/80 mt-0.5">{totalDiets > 0 ? Math.round((activeDiets / totalDiets) * 100) : 0}% do total</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center mb-3">
            <Clock size={18} className="text-amber-400" />
          </div>
          <p className="text-3xl font-bold text-white">{pausedDiets}</p>
          <p className="text-xs text-slate-400 mt-0.5">Dietas pausadas</p>
          <p className="text-xs text-amber-400/80 mt-0.5">{totalDiets > 0 ? Math.round((pausedDiets / totalDiets) * 100) : 0}% do total</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="w-9 h-9 rounded-xl bg-slate-500/15 flex items-center justify-center mb-3">
            <Trash2 size={18} className="text-slate-500" />
          </div>
          <p className="text-3xl font-bold text-white">0</p>
          <p className="text-xs text-slate-400 mt-0.5">Dietas arquivadas</p>
          <p className="text-xs text-slate-600 mt-0.5">8% do total</p>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar dietas por nome, objetivo ou descrição..."
            className="w-full bg-transparent border border-white/[0.06] rounded-xl pl-9 pr-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>
        <div className="relative">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="appearance-none bg-[#080B18] border border-white/[0.06] rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
          >
            <option value="">Status · Todos</option>
            <option value="ativa">Ativa</option>
            <option value="pausada">Pausada</option>
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterGoal}
            onChange={e => setFilterGoal(e.target.value)}
            className="appearance-none bg-[#080B18] border border-white/[0.06] rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
          >
            <option value="">Objetivo · Todos</option>
            {allGoals.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select
            value={filterLevel}
            onChange={e => setFilterLevel(e.target.value)}
            className="appearance-none bg-[#080B18] border border-white/[0.06] rounded-xl pl-3 pr-8 py-2 text-sm text-slate-300 focus:outline-none focus:border-violet-500/50 transition-colors cursor-pointer"
          >
            <option value="">Nível · Todos</option>
            {allLevels.map(l => <option key={l} value={l}>{NIVEL_MAP[l]?.label ?? l}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl overflow-hidden">
        {/* Table header */}
        <div className="hidden lg:grid grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_1fr_auto] gap-x-4 px-5 py-3 border-b border-white/[0.06]">
          <span className={THCls}>Nome da dieta</span>
          <span className={THCls}>Objetivo</span>
          <span className={THCls}>Nível</span>
          <span className={THCls}>Refeições/dia</span>
          <span className={THCls}>Duração</span>
          <span className={THCls}>Criada em</span>
          <span className={THCls}>Status</span>
          <span className={`${THCls} text-right`}>Ações</span>
        </div>

        {isLoading ? (
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex gap-4 items-center">
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] animate-pulse shrink-0" />
                <div className="flex-1 h-4 rounded bg-white/[0.06] animate-pulse" />
              </div>
            ))}
          </div>
        ) : pageData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Salad size={36} className="mb-3 text-slate-700" />
            <p className="text-sm font-medium text-slate-400">
              {filtered.length === 0 && diets.length > 0 ? 'Nenhuma dieta corresponde aos filtros.' : 'Nenhuma dieta criada ainda.'}
            </p>
            {diets.length === 0 && (
              <button onClick={onNew} className="mt-3 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                Criar primeira dieta →
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-white/[0.04]">
            {pageData.map(diet => {
              const { bg, icon } = getGoalStyle(diet.goal);
              const nivel = diet.restrictionLevel ? (NIVEL_MAP[diet.restrictionLevel] ?? { label: diet.restrictionLevel, color: 'text-slate-400 bg-slate-500/10' }) : null;
              const sm = DIET_STATUS_META[diet.status ?? 'ativa'];
              return (
                <div
                  key={diet.id}
                  className="grid grid-cols-1 lg:grid-cols-[2.5fr_1fr_1fr_1fr_1fr_1.2fr_1fr_auto] gap-x-4 gap-y-1 px-5 py-3.5 items-center hover:bg-white/[0.02] transition-colors"
                >
                  {/* Nome */}
                  <button
                    onClick={() => navigate(`/personal/dietas/${diet.id}`)}
                    className="flex items-center gap-3 text-left min-w-0"
                  >
                    <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-100 truncate">{diet.name}</p>
                      {diet.description && (
                        <p className="text-xs text-slate-500 truncate max-w-xs">{diet.description}</p>
                      )}
                    </div>
                  </button>
                  {/* Objetivo */}
                  <span className="text-sm text-slate-300 truncate hidden lg:block">{diet.goal ?? '—'}</span>
                  {/* Nível */}
                  <span className="hidden lg:block">
                    {nivel ? (
                      <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full ${nivel.color}`}>{nivel.label}</span>
                    ) : <span className="text-slate-500 text-sm">—</span>}
                  </span>
                  {/* Refeições/dia */}
                  <span className="text-sm text-slate-300 hidden lg:block">{diet.meals.length} refeições</span>
                  {/* Duração */}
                  <span className="text-sm text-slate-300 hidden lg:block">{diet.durationDays ? `${diet.durationDays} dias` : '30 dias'}</span>
                  {/* Criada em */}
                  <div className="hidden lg:block">
                    <p className="text-sm text-slate-300">{new Date(diet.createdAt).toLocaleDateString('pt-BR')}</p>
                    <p className="text-xs text-slate-500">{new Date(diet.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {/* Status */}
                  <span className={`hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${sm.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                    {sm.label}
                  </span>
                  {/* Actions */}
                  <div className="flex items-center gap-0.5 justify-end">
                    <button
                      onClick={() => onEdit(diet)}
                      title="Editar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => toast.info('Duplicar dieta em breve.')}
                      title="Duplicar"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() => {
                        toast(`Excluir "${diet.name}"?`, {
                          action: { label: 'Excluir', onClick: () => deleteDietMutation.mutate(diet.id) },
                          cancel: { label: 'Cancelar', onClick: () => {} },
                        });
                      }}
                      title="Excluir"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {!isLoading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.06]">
            <p className="text-xs text-slate-500">
              Mostrando {Math.min((page - 1) * LIST_ITEMS_PER_PAGE + 1, filtered.length)} a {Math.min(page * LIST_ITEMS_PER_PAGE, filtered.length)} de {filtered.length} dietas
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const pg = totalPages <= 5 ? i + 1 : page <= 3 ? i + 1 : page >= totalPages - 2 ? totalPages - 4 + i : page - 2 + i;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${
                      pg === page ? 'bg-violet-600 text-white' : 'text-slate-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function DietasPage() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingDiet, setEditingDiet] = useState<Diet | undefined>(undefined);

  if (view === 'form') {
    return (
      <DietFormPage
        onBack={() => { setView('list'); setEditingDiet(undefined); }}
        diet={editingDiet}
      />
    );
  }

  return (
    <DietListPage
      onNew={() => { setEditingDiet(undefined); setView('form'); }}
      onEdit={(diet) => { setEditingDiet(diet); setView('form'); }}
    />
  );
}


