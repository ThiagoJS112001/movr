import { Dumbbell, Moon, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { useMyWeeklyPlan } from '../../hooks/useWeeklyPlans';
import { useNavigate } from 'react-router-dom';

const WEEK_DAYS = [
  { key: 'segunda', short: 'Seg', long: 'Segunda-feira' },
  { key: 'terca',   short: 'Ter', long: 'TerÃ§a-feira'   },
  { key: 'quarta',  short: 'Qua', long: 'Quarta-feira'  },
  { key: 'quinta',  short: 'Qui', long: 'Quinta-feira'  },
  { key: 'sexta',   short: 'Sex', long: 'Sexta-feira'   },
  { key: 'sabado',  short: 'SÃ¡b', long: 'SÃ¡bado'        },
  { key: 'domingo', short: 'Dom', long: 'Domingo'       },
];

// JS getDay(): 0=Sun â†’ domingo, 1=Mon â†’ segunda, â€¦
const JS_DAY_TO_KEY = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

const MUSCLE_COLORS: Record<string, string> = {
  peito:    'bg-rose-500/10 border-rose-500/30 text-rose-300',
  costas:   'bg-sky-500/10 border-sky-500/30 text-sky-300',
  pernas:   'bg-emerald-500/10 border-emerald-500/30 text-emerald-300',
  ombros:   'bg-amber-500/10 border-amber-500/30 text-amber-300',
  bracos:   'bg-purple-500/10 border-purple-500/30 text-purple-300',
  cardio:   'bg-orange-500/10 border-orange-500/30 text-orange-300',
  fullbody: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  full:     'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
};

function getDayColor(label: string) {
  if (!label) return null;
  const normalized = label
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
  for (const [k, v] of Object.entries(MUSCLE_COLORS)) {
    if (normalized.includes(k)) return v;
  }
  return 'bg-[#7c5cfc]/10 border-[#7c5cfc]/30 text-[#9b7fff]';
}

export default function AlunoAgendaPage() {
  const navigate = useNavigate();
  const { data: plan, isLoading } = useMyWeeklyPlan();

  const todayKey = JS_DAY_TO_KEY[new Date().getDay()];
  const todayIndex = WEEK_DAYS.findIndex((d) => d.key === todayKey);
  const planMap = new Map(plan?.days.map((d) => [d.dayOfWeek, d]) ?? []);
  const todayPlan = planMap.get(todayKey);

  return (
    <div className="min-h-screen bg-[#080B18] text-white px-4 pt-5 pb-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/10 flex items-center justify-center">
          <Calendar size={18} className="text-[#7c5cfc]" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Minha Agenda</h1>
          <p className="text-xs text-slate-500 mt-0.5">Plano semanal de treinos</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* No plan assigned */}
      {!isLoading && !plan && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-2xl bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 flex items-center justify-center mb-4">
            <Calendar size={24} className="text-[#7c5cfc]" />
          </div>
          <p className="text-slate-300 font-semibold">Sem plano configurado</p>
          <p className="text-slate-500 text-sm mt-1 max-w-xs">
            Aguarde seu personal trainer criar um plano de treinos semanal para vocÃª.
          </p>
          <button
            onClick={() => navigate('/aluno/treino')}
            className="mt-5 flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#9b7fff] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            <Dumbbell size={15} />
            Ver meus treinos
          </button>
        </div>
      )}

      {/* Plan exists */}
      {!isLoading && plan && (
        <div className="space-y-3">
          {/* Today highlight card */}
          {todayPlan && (
            <div
              className={`p-4 rounded-2xl border mb-4 ${
                todayPlan.label
                  ? (getDayColor(todayPlan.label) ?? 'bg-[#7c5cfc]/10 border-[#7c5cfc]/30')
                  : 'bg-white/[0.04] border-white/[0.07]'
              }`}
            >
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Hoje Â· {WEEK_DAYS[todayIndex]?.long}
              </p>
              {todayPlan.label ? (
                <>
                  <div className="flex items-center gap-2">
                    <Dumbbell size={18} />
                    <p className="text-lg font-bold">{todayPlan.label}</p>
                  </div>
                  {todayPlan.exerciseIds.length > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      {todayPlan.exerciseIds.length} exercÃ­cio{todayPlan.exerciseIds.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  <button
                    onClick={() => navigate('/aluno/treino')}
                    className="mt-3 flex items-center gap-1.5 text-xs font-semibold"
                  >
                    Ir para o treino <ChevronRight size={13} />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Moon size={18} className="text-slate-400" />
                  <p className="text-base font-semibold text-slate-300">Dia de descanso</p>
                </div>
              )}
            </div>
          )}

          {/* Full week list */}
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Semana completa
          </p>
          {WEEK_DAYS.map((day) => {
            const entry = planMap.get(day.key);
            const isToday = day.key === todayKey;
            const hasWorkout = entry && entry.label;

            return (
              <div
                key={day.key}
                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                  isToday
                    ? 'border-[#7c5cfc]/50 bg-[#7c5cfc]/5'
                    : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
                }`}
              >
                <div className="w-10 text-center shrink-0">
                  <p className={`text-xs font-bold ${isToday ? 'text-[#7c5cfc]' : 'text-slate-500'}`}>
                    {day.short}
                  </p>
                  {isToday && (
                    <div className="w-1.5 h-1.5 bg-[#7c5cfc] rounded-full mx-auto mt-1" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {hasWorkout ? (
                    <>
                      <p className="text-sm font-semibold text-white truncate">{entry.label}</p>
                      {entry.exerciseIds.length > 0 && (
                        <p className="text-xs text-slate-500 mt-0.5">
                          {entry.exerciseIds.length} exercÃ­cio{entry.exerciseIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </>
                  ) : (
                    <p className="text-sm text-slate-600">Descanso</p>
                  )}
                </div>

                <div className="shrink-0">
                  {hasWorkout ? (
                    <Dumbbell size={16} className="text-slate-400" />
                  ) : (
                    <Moon size={16} className="text-slate-700" />
                  )}
                </div>
              </div>
            );
          })}

          <p className="text-xs text-slate-600 text-center pt-2 flex items-center justify-center gap-1.5">
            <RefreshCw size={10} />
            Atualizado em{' '}
            {new Date(plan.updatedAt).toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </div>
  );
}
