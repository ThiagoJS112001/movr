import { useState } from 'react';
import { useStudentDiet } from '../../hooks/useDiets';
import { CheckCircle2, ChevronDown, ChevronUp, Clock, Droplets, Salad } from 'lucide-react';

// ── Caloric Ring ───────────────────────────────────────────────────────────────

function CaloricRing({ consumed, total }: { consumed: number; total: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const pct = total > 0 ? Math.min(consumed / total, 1) : 0;
  const offset = circ * (1 - pct);
  const onTrack = pct >= 0.5;
  const ringColor = onTrack ? '#22c55e' : '#a855f7';

  return (
    <div className="flex flex-col items-center">
      <svg width={128} height={128} className="-rotate-90">
        <circle cx={64} cy={64} r={r} fill="none" stroke="currentColor" strokeWidth={10} className="text-slate-700" />
        <circle
          cx={64} cy={64} r={r} fill="none"
          stroke={ringColor} strokeWidth={10}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
        />
      </svg>
      <div className="flex flex-col items-center -mt-[72px] mb-[44px]">
        <span className="text-xl font-extrabold text-white leading-none">{consumed}</span>
        <span className="text-[10px] text-slate-500 font-medium">/ {total} kcal</span>
      </div>
      <p className="text-xs font-semibold mt-1" style={{ color: ringColor }}>
        {total === 0 ? 'Sem meta' : pct >= 1 ? 'Meta atingida!' : onTrack ? 'No caminho certo' : 'Aguardando refeições'}
      </p>
    </div>
  );
}

// ── Macro Bar ──────────────────────────────────────────────────────────────────

function MacroBar({ label, consumed, total, color }: { label: string; consumed: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min((consumed / total) * 100, 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] font-medium mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-slate-300">{consumed}<span className="text-slate-500 font-normal">/{total}g</span></span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

// ── Hydration Panel ────────────────────────────────────────────────────────────

const WATER_GOAL = 8;

function HydrationPanel({ glasses, setGlasses }: { glasses: number; setGlasses: (n: number) => void }) {
  return (
    <div className="bg-[#131722] border border-white/5 rounded-2xl p-4 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Droplets size={16} className="text-sky-500" />
        <span className="text-sm font-semibold text-slate-200">Hidratação</span>
        <span className="ml-auto text-xs font-bold text-sky-500">{glasses}/{WATER_GOAL} copos</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: WATER_GOAL }, (_, i) => {
          const filled = i < glasses;
          return (
            <button
              key={i}
              onClick={() => setGlasses(filled && i === glasses - 1 ? glasses - 1 : i + 1)}
              className={`flex flex-col items-center gap-0.5 p-2 rounded-xl border-2 transition-all duration-200 ${
                filled
                  ? 'border-sky-400 bg-sky-900/30'
                  : 'border-white/10 bg-white/[0.02] opacity-40'
              }`}
              title={filled ? 'Clique para desfazer' : 'Registrar copo'}
            >
              <svg viewBox="0 0 24 24" className={`w-6 h-6 ${filled ? 'text-sky-500' : 'text-slate-400'}`} fill="currentColor">
                <path d="M6 2l1.5 16.5A2 2 0 009.49 20h5.02a2 2 0 001.99-1.5L18 2H6zm2.2 2h7.6l-1.36 15H9.56L8.2 4z" />
              </svg>
              <span className={`text-[9px] font-bold ${filled ? 'text-sky-500' : 'text-slate-400'}`}>{i + 1}</span>
            </button>
          );
        })}
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-sky-400 rounded-full transition-all duration-500"
          style={{ width: `${(glasses / WATER_GOAL) * 100}%` }}
        />
      </div>
      {glasses >= WATER_GOAL && (
        <p className="text-xs text-center font-semibold text-sky-500">Meta de hidratação atingida! 💧</p>
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AlunoDietaPage() {
  const { data, isLoading } = useStudentDiet();
  const diet = data?.diet ?? null;

  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [doneMeals, setDoneMeals] = useState<Set<string>>(new Set());
  const [waterGlasses, setWaterGlasses] = useState(0);

  const toggleExpand = (id: string) =>
    setExpandedMeals((prev) => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  const markDone = (id: string) =>
    setDoneMeals((prev) => { const s = new Set(prev); s.add(id); return s; });

  if (isLoading) return <div className="min-h-screen bg-[#0d0f14] flex items-center justify-center text-slate-400">Carregando...</div>;
  if (!diet) {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white">
        <div className="max-w-6xl mx-auto px-4 pt-5 pb-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
              <Salad size={18} className="text-[#22c55e]" />
            </div>
            <h1 className="text-xl font-bold text-white leading-none">Minha Dieta</h1>
          </div>
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <Salad size={40} className="mb-3 opacity-30" />
          <p className="text-sm">Nenhuma dieta atribuída ainda.</p>
          <p className="text-xs mt-1">Aguarde seu personal atribuir uma dieta.</p>
        </div>
        </div>
      </div>
    );
  }

  const sortedMeals = [...diet.meals].sort((a, b) => a.time.localeCompare(b.time));

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

  const consumed = sortedMeals
    .filter((m) => doneMeals.has(m.id))
    .reduce(
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

  // First non-done meal in order = "next"
  const nextMealId = sortedMeals.find((m) => !doneMeals.has(m.id))?.id ?? null;

  const getMealState = (id: string): 'done' | 'next' | 'pending' => {
    if (doneMeals.has(id)) return 'done';
    if (id === nextMealId) return 'next';
    return 'pending';
  };

  const stateStyles = {
    done:    { border: 'border-l-4 border-emerald-500', badge: 'bg-emerald-900/40 text-emerald-400', label: 'Feito', header: 'bg-emerald-600' },
    next:    { border: 'border-l-4 border-violet-500', badge: 'bg-violet-900/40 text-violet-400', label: 'Próxima', header: 'bg-violet-600' },
    pending: { border: 'border-l-4 border-white/10', badge: 'bg-white/[0.05] text-slate-400', label: 'Pendente', header: 'bg-slate-600' },
  };

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
            <Salad size={18} className="text-[#22c55e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Minha Dieta</h1>
            <p className="text-xs text-slate-500 mt-0.5">{diet.name}</p>
          </div>
        </div>

      {diet.description && (
        <p className="text-sm text-slate-400 bg-[#131722] border border-white/5 rounded-xl px-4 py-3 border-l-4 border-l-emerald-500">
          {diet.description}
        </p>
      )}

      {/* Top panel: ring + macros + hydration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: caloric ring + macro bars */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-5 flex flex-col gap-4">
          <CaloricRing consumed={consumed.cal} total={totals.cal} />
          <div className="flex flex-col gap-2.5">
            <MacroBar label="Proteína" consumed={consumed.prot} total={totals.prot} color="#3b82f6" />
            <MacroBar label="Carboidrato" consumed={consumed.carb} total={totals.carb} color="#eab308" />
            <MacroBar label="Gordura" consumed={consumed.fat} total={totals.fat} color="#ef4444" />
          </div>
        </div>

        {/* Right: hydration */}
        <HydrationPanel glasses={waterGlasses} setGlasses={setWaterGlasses} />
      </div>

      {/* Meals */}
      <div className="flex flex-col gap-3">
        {sortedMeals.map((meal) => {
          const state = getMealState(meal.id);
          const style = stateStyles[state];
          const isExpanded = expandedMeals.has(meal.id);
          const mealCal = meal.foods.reduce((a, f) => a + (f.calories ?? 0), 0);
          const mealProt = meal.foods.reduce((a, f) => a + (f.protein ?? 0), 0);

          return (
            <div key={meal.id} className={`bg-[#131722] rounded-2xl overflow-hidden ${style.border}`}>
              {/* Clickable header */}
              <button
                className={`w-full flex items-center gap-3 px-4 py-3 text-left ${style.header} focus:outline-none`}
                onClick={() => toggleExpand(meal.id)}
              >
                <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 shrink-0">
                  <Clock size={12} className="text-white" />
                  <span className="text-white text-xs font-bold">{meal.time}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">{meal.name}</p>
                  {(mealCal > 0 || mealProt > 0) && (
                    <p className="text-white/70 text-xs">
                      {mealCal > 0 && `${mealCal} kcal`}
                      {mealCal > 0 && mealProt > 0 && ' · '}
                      {mealProt > 0 && `${mealProt}g prot`}
                    </p>
                  )}
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${style.badge}`}>{style.label}</span>
                {isExpanded ? <ChevronUp size={16} className="text-white/70 shrink-0" /> : <ChevronDown size={16} className="text-white/70 shrink-0" />}
              </button>

              {/* Collapsible body */}
              {isExpanded && (
                <div className="px-4 py-3">
                  {meal.notes && (
                    <p className="text-xs text-slate-400 italic mb-3">📌 {meal.notes}</p>
                  )}

                  {meal.foods.length === 0 ? (
                    <p className="text-xs text-slate-500">Nenhum alimento cadastrado.</p>
                  ) : (
                    <div className="flex flex-col divide-y divide-white/5">
                      {meal.foods.map((food) => (
                        <div key={food.id} className="flex items-start justify-between gap-2 py-2 first:pt-0 last:pb-0">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white">{food.name}</p>
                            <p className="text-xs text-slate-500">{food.quantity}</p>
                          </div>
                          {(food.calories != null || food.protein != null) && (
                            <div className="text-right shrink-0">
                              {food.calories != null && (
                                <p className="text-xs font-semibold text-orange-500">{food.calories} kcal</p>
                              )}
                              <div className="flex gap-1.5 justify-end mt-0.5">
                                {food.protein != null && <span className="text-xs text-blue-500">{food.protein}g P</span>}
                                {food.carbs != null && <span className="text-xs text-yellow-600">{food.carbs}g C</span>}
                                {food.fat != null && <span className="text-xs text-red-400">{food.fat}g G</span>}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Mark as done */}
                  {state !== 'done' && (
                    <button
                      onClick={() => markDone(meal.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-sm font-semibold transition-all"
                    >
                      <CheckCircle2 size={15} />
                      Marcar como feito
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      </div>{/* end space-y-5 */}
    </div>
  );
}
