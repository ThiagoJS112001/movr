import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Clock, Dumbbell, Weight } from 'lucide-react';

// Returns the ISO week Monday label (dd/mm) for a given date string
function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

// Returns last n week Monday labels in order (oldest → newest)
function getLastNWeeks(n: number): string[] {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);

  const weeks: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(monday);
    d.setDate(monday.getDate() - i * 7);
    weeks.push(d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
  }
  return weeks;
}

export default function AlunoProgressoPage() {
  const { user } = useAuth();
  const { logs, workouts } = useApp();
  const { theme } = useTheme();

  const myLogs = useMemo(
    () =>
      logs
        .filter((l) => l.studentId === user?.id)
        .sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
    [logs, user]
  );

  const weekLabels = useMemo(() => getLastNWeeks(8), []);

  // Treinos por semana
  const weeklyData = useMemo(() => {
    const map: Record<string, number> = {};
    weekLabels.forEach((w) => (map[w] = 0));
    myLogs.forEach((log) => {
      const label = getWeekLabel(log.completedAt);
      if (label in map) map[label]++;
    });
    return weekLabels.map((semana) => ({ semana, treinos: map[semana] }));
  }, [myLogs, weekLabels]);

  // Duração dos últimos 10 treinos
  const durationData = useMemo(
    () =>
      myLogs
        .filter((l) => l.durationMinutes != null)
        .slice(-10)
        .map((l) => ({
          data: new Date(l.completedAt).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
          }),
          minutos: l.durationMinutes,
        })),
    [myLogs]
  );

  const totalLogs = myLogs.length;
  const logsWithDuration = myLogs.filter((l) => l.durationMinutes);
  const avgDuration = logsWithDuration.length
    ? Math.round(
        logsWithDuration.reduce((s, l) => s + (l.durationMinutes ?? 0), 0) /
          logsWithDuration.length
      )
    : 0;
  const thisWeek = weeklyData[weeklyData.length - 1]?.treinos ?? 0;

  // Exercises with weight history
  const exercisesWithWeights = useMemo(() => {
    const map = new Map<string, string>();
    for (const log of myLogs) {
      if (!log.exerciseWeights) continue;
      const workout = workouts.find((w) => w.id === log.workoutId);
      if (!workout) continue;
      for (const exId of Object.keys(log.exerciseWeights)) {
        if (!map.has(exId)) {
          const ex = workout.exercises.find((e) => e.id === exId);
          if (ex) map.set(exId, ex.exerciseName);
        }
      }
    }
    return Array.from(map.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [myLogs, workouts]);

  const [selectedExId, setSelectedExId] = useState('');
  const effectiveExId = selectedExId || exercisesWithWeights[0]?.id || '';

  const weightHistory = useMemo(() => {
    if (!effectiveExId) return [];
    return myLogs
      .filter((l) => l.exerciseWeights?.[effectiveExId] != null)
      .map((l) => ({
        data: new Date(l.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        kg: l.exerciseWeights![effectiveExId],
      }));
  }, [myLogs, effectiveExId]);

  // Chart theming
  const gridColor = theme === 'dark' ? '#334155' : '#e2e8f0';
  const tickColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
    border: `1px solid ${theme === 'dark' ? '#334155' : '#e2e8f0'}`,
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
  };
  const cursorStyle = { fill: theme === 'dark' ? '#334155' : '#f1f5f9' };

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        Meu Progresso
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Acompanhe sua evolução ao longo do tempo.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            Icon: Dumbbell,
            label: 'Total de treinos',
            value: totalLogs,
            color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
          },
          {
            Icon: Clock,
            label: 'Duração média',
            value: avgDuration ? `${avgDuration} min` : '—',
            color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600',
          },
          {
            Icon: TrendingUp,
            label: 'Esta semana',
            value: thisWeek,
            color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600',
          },
        ].map(({ Icon, label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 p-4 shadow-sm flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}
            >
              <Icon size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart — treinos por semana */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-5 mb-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">
          Treinos por semana
        </h2>
        {totalLogs === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="semana"
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
              <Bar dataKey="treinos" fill="#10b981" radius={[6, 6, 0, 0]} name="Treinos" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Area chart — duração dos treinos */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-5 mb-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">
          Duração dos treinos (min)
        </h2>
        {durationData.length < 2 ? (
          <EmptyChart message="Complete pelo menos 2 treinos para visualizar este gráfico." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={durationData}>
              <defs>
                <linearGradient id="gradDur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit=" min"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="minutos"
                stroke="#10b981"
                strokeWidth={2}
                fill="url(#gradDur)"
                name="Duração"
                dot={{ fill: '#10b981', r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Line chart — evolução de carga */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-5">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-1.5">
            <Weight size={14} className="text-emerald-500" />
            Evolução de carga
          </h2>
          {exercisesWithWeights.length > 0 && (
            <select
              value={effectiveExId}
              onChange={(e) => setSelectedExId(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              {exercisesWithWeights.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          )}
        </div>
        {weightHistory.length < 2 ? (
          <EmptyChart message="Complete pelo menos 2 treinos com registro de peso para visualizar a evolução." />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weightHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis
                dataKey="data"
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: tickColor, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                unit=" kg"
                domain={['auto', 'auto']}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Carga']} />
              <Line
                type="monotone"
                dataKey="kg"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="Carga"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

function EmptyChart({
  message = 'Nenhum dado ainda. Conclua treinos para ver seu progresso.',
}: {
  message?: string;
}) {
  return (
    <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm text-center px-8">
      {message}
    </div>
  );
}
