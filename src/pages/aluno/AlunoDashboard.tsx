import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutLogs } from '../../hooks/useWorkouts';
import { useMyWeeklyPlan } from '../../hooks/useWeeklyPlans';
import { Play, CheckCircle2, Moon } from 'lucide-react';

const DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
type DayKey = typeof DAYS[number];

const DAYS_LABEL: Record<DayKey, string> = {
  segunda: 'Segunda',
  terca:   'Terça',
  quarta:  'Quarta',
  quinta:  'Quinta',
  sexta:   'Sexta',
  sabado:  'Sábado',
  domingo: 'Domingo',
};

// JS getDay(): 0=Sunday, 1=Monday … 6=Saturday
const TODAY_MAP: DayKey[] = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];

function getStartOfWeek(): Date {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day; // adjust to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function AlunoDashboard() {
  const { user } = useAuth();
  const { data: logs = [] } = useWorkoutLogs(user?.id ?? '');
  const { data: plan } = useMyWeeklyPlan();
  const navigate = useNavigate();

  const todayKey = TODAY_MAP[new Date().getDay()];

  const weekStart = getStartOfWeek();
  const weekEnd   = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 7);

  const sessionsThisWeek = logs.filter((s) => {
    const d = new Date(s.completedAt);
    return d >= weekStart && d < weekEnd;
  });

  const sessionsByDay = sessionsThisWeek.reduce<Record<string, number>>((acc, s) => {
    const dow = TODAY_MAP[new Date(s.completedAt).getDay()];
    acc[dow] = (acc[dow] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">
          Olá, {user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
          Aqui está seu plano da semana.
        </p>
      </div>

      {/* Stats strip */}
      <div className="flex gap-3 mb-6">
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{sessionsThisWeek.length}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Treinos esta semana</div>
        </div>
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center">
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {plan ? plan.days.filter((d) => d.exerciseIds.length > 0 || d.label.trim()).length : 0}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Dias com treino</div>
        </div>
        <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/60 shadow-sm text-center">
          <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
            {sessionsThisWeek.reduce((sum, s) => sum + (s.durationMinutes ?? 0), 0)}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Min. totais</div>
        </div>
      </div>

      {/* Weekly plan grid */}
      {!plan ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-8 text-center">
          <p className="text-slate-400 dark:text-slate-500 text-sm">
            Nenhum plano semanal configurado ainda. Seu personal trainer irá criar um para você em breve.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {DAYS.map((day) => {
            const dayData     = plan.days.find((d) => d.dayOfWeek === day);
            const isToday     = day === todayKey;
            const hasWorkout  = !!(dayData && (dayData.exerciseIds.length > 0 || dayData.label.trim()));
            const doneSessions = sessionsByDay[day] ?? 0;
            const isDone      = doneSessions > 0;

            return (
              <div
                key={day}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 border transition-colors ${
                  isToday
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700/50'
                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700/60'
                }`}
              >
                {/* Day label */}
                <div className="w-20 shrink-0">
                  <p className={`text-sm font-semibold ${
                    isToday ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {DAYS_LABEL[day]}
                  </p>
                  {isToday && (
                    <span className="text-xs text-emerald-500 dark:text-emerald-400">Hoje</span>
                  )}
                </div>

                {/* Workout info */}
                <div className="flex-1 min-w-0">
                  {hasWorkout ? (
                    <div>
                      <p className={`text-sm font-medium truncate ${
                        isToday ? 'text-emerald-800 dark:text-emerald-200' : 'text-slate-700 dark:text-slate-200'
                      }`}>
                        {dayData?.label || 'Treino'}
                      </p>
                      {dayData && dayData.exerciseIds.length > 0 && (
                        <p className="text-xs text-slate-400 dark:text-slate-500">
                          {dayData.exerciseIds.length} exercício{dayData.exerciseIds.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
                      <Moon size={13} />
                      <span className="text-sm">Descanso</span>
                    </div>
                  )}
                </div>

                {/* Status / action */}
                {hasWorkout && (
                  isDone ? (
                    <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-medium">Feito</span>
                    </div>
                  ) : isToday ? (
                    <button
                      onClick={() => navigate('/aluno/treino')}
                      className="shrink-0 flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <Play size={11} fill="currentColor" />
                      Iniciar
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/aluno/treino')}
                      className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      Ver
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      {plan && (
        <button
          onClick={() => navigate('/aluno/treino')}
          className="w-full mt-5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Play size={16} fill="currentColor" />
          Iniciar treino
        </button>
      )}
    </div>
  );
}
