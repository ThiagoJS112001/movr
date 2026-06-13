import { useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutLogs } from '../../hooks/useWorkouts';
import { useMyAssessments } from '../../hooks/useAssessments';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  ArrowDown, ArrowUp, ChevronRight, Download, Plus, Trophy, User,
} from 'lucide-react';
import NewAssessmentModal from '../../components/NewAssessmentModal';
import type { WorkoutLog, StudentAssessment } from '../../types';

// â”€â”€ Types & helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type Period = '1sem' | '1mes' | '3meses' | 'tudo';

function cutoffDate(period: Period): Date | null {
  const now = new Date();
  if (period === '1sem') return new Date(now.getTime() - 7 * 86400_000);
  if (period === '1mes') return new Date(now.getTime() - 30 * 86400_000);
  if (period === '3meses') return new Date(now.getTime() - 90 * 86400_000);
  return null;
}

function filterByPeriod(logs: WorkoutLog[], period: Period): WorkoutLog[] {
  const c = cutoffDate(period);
  if (!c) return logs;
  return logs.filter((l) => new Date(l.completedAt) >= c);
}

function computeStreak(logs: WorkoutLog[]): { current: number; max: number } {
  const dateSets = new Set(logs.map((l) => l.completedAt.slice(0, 10)));
  const dates = Array.from(dateSets).sort();
  let maxStreak = 0;
  let cur = 0;
  let lastDate: Date | null = null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (const ds of dates) {
    const d = new Date(ds);
    d.setHours(0, 0, 0, 0);
    if (lastDate) {
      const diff = Math.round((d.getTime() - lastDate.getTime()) / 86400_000);
      cur = diff === 1 ? cur + 1 : 1;
    } else {
      cur = 1;
    }
    maxStreak = Math.max(maxStreak, cur);
    lastDate = d;
  }
  if (lastDate && Math.round((today.getTime() - lastDate.getTime()) / 86400_000) > 1) cur = 0;
  return { current: cur, max: maxStreak };
}

function barColor(count: number): string {
  if (count === 0) return '#ef4444';
  if (count <= 2) return '#f97316';
  if (count <= 4) return '#22c55e';
  return '#a855f7';
}

function getLastNWeeks(n: number) {
  const now = new Date();
  const day = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() - (n - 1 - i) * 7);
    return { label: `S${i + 1}`, date: d };
  });
}

function totalVolume(logs: WorkoutLog[]): number {
  return logs.reduce((sum, l) => {
    if (!l.exerciseWeights) return sum;
    return sum + Object.values(l.exerciseWeights).reduce((s, v) => s + v, 0);
  }, 0);
}

// â”€â”€ Delta chip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Delta({ value, unit = '', invert = false }: { value: number; unit?: string; invert?: boolean }) {
  const positive = invert ? value < 0 : value > 0;
  const color = value === 0 ? 'text-slate-400' : positive ? 'text-emerald-400' : 'text-red-400';
  const Icon = value > 0 ? ArrowUp : ArrowDown;
  if (value === 0) return <span className="text-xs text-slate-500">â€”</span>;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${color}`}>
      <Icon size={10} />
      {Math.abs(value)}{unit}
    </span>
  );
}

// â”€â”€ Load bar for exercise â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LoadBar({ name, initial, current, pr }: { name: string; initial: number; current: number; pr: number }) {
  const initPct = pr > 0 ? Math.min((initial / pr) * 100, 100) : 0;
  const curPct = pr > 0 ? Math.min((current / pr) * 100, 100) : 0;
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-slate-300">{name}</span>
        <span className="text-xs font-bold text-yellow-400 flex items-center gap-1"><Trophy size={11} /> PR: {pr}kg</span>
      </div>
      <div className="relative h-2 bg-white/10 rounded-full mb-1">
        <div className="absolute h-full rounded-full bg-slate-500 transition-all" style={{ width: `${initPct}%` }} />
      </div>
      <div className="relative h-2 bg-white/10 rounded-full">
        <div className="absolute h-full rounded-full bg-violet-500 transition-all" style={{ width: `${curPct}%` }} />
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>Início: {initial}kg</span>
        <span>Atual: {current}kg</span>
      </div>
    </div>
  );
}

// â”€â”€ Weight line chart â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function WeightChart({
  data,
  gridColor,
  tickColor,
  tooltipStyle,
}: {
  data: { label: string; peso: number }[];
  gridColor: string;
  tickColor: string;
  tooltipStyle: React.CSSProperties;
}) {
  if (data.length < 2) return <EmptyChart message="Registre pelo menos 2 pesos para ver a evolução." />;
  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
        <XAxis dataKey="label" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis
          tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false}
          unit=" kg" domain={['auto', 'auto']}
        />
        <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v} kg`, 'Peso']} />
        <Line type="monotone" dataKey="peso" stroke="#a855f7" strokeWidth={2.5}
          dot={{ fill: '#a855f7', r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

// â”€â”€ Main Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AlunoProgressoPage() {
  const { user } = useAuth();
  const { data: allLogs = [] } = useWorkoutLogs(user?.id ?? '');
  const { data: assessments = [] } = useMyAssessments();

  const [period, setPeriod] = useState<Period>('1mes');
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);

  // chart colours (dark-only)
  const gridColor = '#334155';
  const tickColor = '#94a3b8';
  const tooltipStyle: React.CSSProperties = {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '0.75rem',
    fontSize: '0.75rem',
    color: '#f1f5f9',
  };
  const cursorStyle = { fill: '#334155' };

  const myLogs = useMemo(
    () => [...allLogs].sort((a, b) => a.completedAt.localeCompare(b.completedAt)),
    [allLogs],
  );

  const filteredLogs = useMemo(() => filterByPeriod(myLogs, period), [myLogs, period]);

  // â”€â”€ Weekly frequency â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const weeklyData = useMemo(() => {
    const weeks = getLastNWeeks(10);
    const counts: number[] = new Array(10).fill(0);
    filteredLogs.forEach((log) => {
      const ld = new Date(log.completedAt);
      ld.setHours(0, 0, 0, 0);
      weeks.forEach(({ date }, i) => {
        const end = new Date(date.getTime() + 7 * 86400_000);
        if (ld >= date && ld < end) counts[i]++;
      });
    });
    return weeks.map(({ label }, i) => ({ semana: label, treinos: counts[i] }));
  }, [filteredLogs]);

  const avgPerWeek = weeklyData.length
    ? (weeklyData.reduce((s, d) => s + d.treinos, 0) / weeklyData.length).toFixed(1)
    : '0';
  const goalPerWeek = 3;
  const bestWeek = Math.max(...weeklyData.map((d) => d.treinos));

  // â”€â”€ Streak â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const streak = useMemo(() => computeStreak(myLogs), [myLogs]);

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const totalLogs = filteredLogs.length;
  const prevPeriodLogs = useMemo(() => {
    const c = cutoffDate(period);
    if (!c) return myLogs.length;
    const half = (Date.now() - c.getTime());
    const prev = new Date(c.getTime() - half);
    return myLogs.filter((l) => new Date(l.completedAt) >= prev && new Date(l.completedAt) < c).length;
  }, [myLogs, period]);
  const logsDelta = totalLogs - prevPeriodLogs;

  const volNow = useMemo(() => totalVolume(filteredLogs), [filteredLogs]);
  const prevVol = useMemo(() => {
    const c = cutoffDate(period);
    if (!c) return 0;
    const half = Date.now() - c.getTime();
    const prev = new Date(c.getTime() - half);
    return totalVolume(myLogs.filter((l) => new Date(l.completedAt) >= prev && new Date(l.completedAt) < c));
  }, [myLogs, period]);
  const volDeltaPct = prevVol > 0 ? Math.round(((volNow - prevVol) / prevVol) * 100) : 0;

  // â”€â”€ Weight evolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const sortedAssessments: StudentAssessment[] = useMemo(
    () => [...assessments].sort((a, b) => a.date.localeCompare(b.date)),
    [assessments],
  );
  const weightData = useMemo(() =>
    sortedAssessments
      .filter((a) => a.weight != null)
      .map((a) => ({
        label: new Date(a.date).toLocaleDateString('pt-BR', { month: 'short' }),
        peso: a.weight!,
        date: a.date,
      })),
    [sortedAssessments],
  );

  const firstWeight = weightData[0]?.peso;
  const lastWeight = weightData[weightData.length - 1]?.peso;
  const weightDelta = firstWeight != null && lastWeight != null ? +(lastWeight - firstWeight).toFixed(1) : null;
  const weightGoal = 75;

  const latestAssessment = sortedAssessments[sortedAssessments.length - 1];
  const prevAssessment = sortedAssessments[sortedAssessments.length - 2];

  // â”€â”€ Load evolution â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const loadEvolution = useMemo(() => {
    const map = new Map<string, { name: string; values: number[] }>();
    const nameMap = new Map<string, string>();
    myLogs.forEach((log) => {
      if (!log.exerciseWeights) return;
      Object.entries(log.exerciseWeights).forEach(([exId, kg]) => {
        if (!map.has(exId)) map.set(exId, { name: nameMap.get(exId) ?? exId, values: [] });
        map.get(exId)!.values.push(kg);
      });
    });
    return Array.from(map.entries())
      .filter(([, v]) => v.values.length >= 2)
      .map(([id, v]) => ({
        id,
        name: v.name,
        initial: v.values[0],
        current: v.values[v.values.length - 1],
        pr: Math.max(...v.values),
      }))
      .slice(0, 3);
  }, [myLogs]);

  const PERIODS: { key: Period; label: string }[] = [
    { key: '1sem', label: '1 sem' },
    { key: '1mes', label: '1 mês' },
    { key: '3meses', label: '3 meses' },
    { key: 'tudo', label: 'Tudo' },
  ];

  return (
    <div className="min-h-screen bg-[#080B18] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white leading-none mb-0.5">Progresso</h1>
          <p className="text-slate-500 text-xs">
            Acompanhe sua evolução desde o início
          </p>
        </div>
        <div className="flex gap-1 bg-white/[0.05] rounded-xl p-1">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.key
                  ? 'bg-[#131722] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Treinos realizados */}
        <div className="bg-[#131722] rounded-2xl p-4 border border-white/5 col-span-1">
          <p className="text-xs text-slate-400 mb-1">Treinos realizados</p>
          <p className="text-3xl font-extrabold text-white">{totalLogs}</p>
          <Delta value={logsDelta} invert={false} /> <span className="text-[10px] text-slate-500">vs mês anterior</span>
        </div>
        {/* Peso atual */}
        <div className="bg-[#131722] rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Peso atual</p>
          {lastWeight != null ? (
            <>
              <p className="text-3xl font-extrabold text-emerald-400">{lastWeight}<span className="text-base">kg</span></p>
              {weightDelta != null && <Delta value={weightDelta} unit="kg" invert={true} />}
              <span className="text-[10px] text-slate-500"> desde o início</span>
            </>
          ) : <p className="text-slate-500 text-sm mt-1">Sem dados</p>}
        </div>
        {/* Sequência */}
        <div className="bg-[#131722] rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Sequência atual</p>
          <p className="text-3xl font-extrabold text-orange-400">{streak.current}<span className="text-base">d</span></p>
          {streak.current >= streak.max && streak.max > 0 && (
            <span className="text-xs text-orange-400 font-semibold flex items-center gap-1"><Trophy size={10} /> Recorde pessoal!</span>
          )}
        </div>
        {/* Volume */}
        <div className="bg-[#131722] rounded-2xl p-4 border border-white/5">
          <p className="text-xs text-slate-400 mb-1">Volume total</p>
          <p className="text-3xl font-extrabold text-white">{volNow >= 1000 ? `${(volNow / 1000).toFixed(0)}k` : volNow}<span className="text-base">kg</span></p>
          {prevVol > 0 && <><Delta value={volDeltaPct} unit="%" invert={false} /><span className="text-[10px] text-slate-500"> vs mês anterior</span></>}
        </div>
      </div>

      {/* Frequency chart */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-300 text-sm">Frequência de treinos</h2>
          <button className="text-xs text-violet-500 flex items-center gap-1 hover:underline">
            <Download size={12} /> Exportar
          </button>
        </div>
        {totalLogs === 0 ? <EmptyChart /> : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barSize={22}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="semana" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
              <Bar dataKey="treinos" radius={[6, 6, 0, 0]} name="Treinos">
                {weeklyData.map((entry, i) => (
                  <Cell key={i} fill={barColor(entry.treinos)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
          <span>Média: <strong className="text-slate-300">{avgPerWeek} treinos/sem</strong></span>
          <span className="text-emerald-500 flex items-center gap-1">Meta: {goalPerWeek} treinos/sem âœ“</span>
          {bestWeek > 0 && <span>Melhor semana: <strong className="text-violet-500">{bestWeek} treinos</strong></span>}
        </div>
      </div>

      {/* Weight evolution */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-300 text-sm">Evolução do peso</h2>
          <button
            onClick={() => setShowAssessmentModal(true)}
            className="text-xs text-violet-500 flex items-center gap-1 hover:underline"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>
        <WeightChart data={weightData} gridColor={gridColor} tickColor={tickColor} tooltipStyle={tooltipStyle} />
        {weightData.length >= 2 && (
          <div className="grid grid-cols-4 gap-3 mt-4 text-center">
            {[
              { label: 'Início', value: firstWeight != null ? `${firstWeight} kg` : 'â€”', color: 'text-slate-300' },
              { label: 'Atual', value: lastWeight != null ? `${lastWeight} kg` : 'â€”', color: 'text-violet-500 font-bold' },
              { label: 'Variação', value: weightDelta != null ? `${weightDelta > 0 ? '+' : ''}${weightDelta} kg` : 'â€”', color: weightDelta != null && weightDelta < 0 ? 'text-emerald-400' : 'text-red-400' },
              { label: 'Meta', value: `${weightGoal} kg`, color: 'text-slate-500' },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className={`text-sm font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Load evolution */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-300 text-sm">Evolução de cargas</h2>
          <button className="text-xs text-violet-500 flex items-center gap-1 hover:underline">
            Ver todos <ChevronRight size={12} />
          </button>
        </div>
        {loadEvolution.length === 0 ? (
          <EmptyChart message="Registre pesos nos treinos para acompanhar a evolução de cargas." />
        ) : (
          loadEvolution.map((ex) => (
            <LoadBar key={ex.id} name={ex.name} initial={ex.initial} current={ex.current} pr={ex.pr} />
          ))
        )}
      </div>

      {/* Body measurements */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-300 text-sm">Medidas corporais</h2>
          <button
            onClick={() => setShowAssessmentModal(true)}
            className="text-xs text-violet-500 flex items-center gap-1 hover:underline"
          >
            <Plus size={12} /> Registrar
          </button>
        </div>
        {latestAssessment ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Altura', value: latestAssessment.leanMass != null ? undefined : undefined, fixed: '1,78m' },
                { label: 'Peso', value: latestAssessment.weight, prev: prevAssessment?.weight, unit: 'kg', invert: true },
                { label: '% Gordura', value: latestAssessment.bodyFat, prev: prevAssessment?.bodyFat, unit: '%', invert: true },
                { label: 'Massa muscular', value: latestAssessment.muscleMass, prev: prevAssessment?.muscleMass, unit: 'kg', invert: false },
                { label: 'Cintura', value: latestAssessment.waist, prev: prevAssessment?.waist, unit: 'cm', invert: true },
                { label: 'Quadril', value: latestAssessment.hip, prev: prevAssessment?.hip, unit: 'cm' },
                { label: 'Tórax', value: latestAssessment.thigh, prev: prevAssessment?.thigh, unit: 'cm' },
                { label: 'Braço', value: latestAssessment.arm, prev: prevAssessment?.arm, unit: 'cm', invert: false },
              ].map(({ label, value, prev, unit, invert, fixed }) => (
                <div key={label} className="bg-white/[0.04] rounded-xl p-3">
                  <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                  {fixed ? (
                    <p className="text-base font-bold text-white">{fixed}</p>
                  ) : value != null ? (
                    <>
                      <p className="text-base font-bold text-white">{value}<span className="text-xs font-normal text-slate-500 ml-0.5">{unit}</span></p>
                      {prev != null && <Delta value={+(value - prev).toFixed(1)} unit={unit} invert={invert} />}
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">â€”</p>
                  )}
                </div>
              ))}
            </div>
            {latestAssessment.date && (
              <p className="text-[10px] text-slate-400 mt-3">
                Ãšltima atualização: {new Date(latestAssessment.date).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}
                {latestAssessment.notes ? ` · ${latestAssessment.notes}` : ''}
              </p>
            )}
          </>
        ) : (
          <EmptyChart message="Nenhuma avaliação ainda. Registre suas medidas para acompanhar o progresso." />
        )}
      </div>

      {/* Progress photos */}
      <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-slate-300 text-sm">Fotos de progresso</h2>
          <button className="text-xs text-violet-500 flex items-center gap-1 hover:underline">
            <Plus size={12} /> Adicionar
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {['Fev 2026', 'Mar 2026', 'Abr 2026'].map((month) => (
            <div key={month} className="flex flex-col items-center gap-1.5">
              <div className="w-full aspect-square bg-white/[0.04] rounded-xl flex items-center justify-center">
                <User size={28} className="text-slate-600" />
              </div>
              <span className="text-[10px] text-slate-500">{month}</span>
            </div>
          ))}
          <div className="flex flex-col items-center gap-1.5">
            <button className="w-full aspect-square bg-white/[0.04] rounded-xl flex flex-col items-center justify-center gap-1 border-2 border-dashed border-white/10 hover:border-violet-400 transition-colors">
              <Plus size={20} className="text-slate-500" />
              <span className="text-[10px] text-slate-400">Adicionar foto de Mai</span>
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 mt-3">Fotos ficam visíveis apenas para você e seu personal</p>
      </div>

      {/* Assessment modal */}
      {showAssessmentModal && user && (
        <NewAssessmentModal
          studentId={user.id}
          studentName={user.name}
          onClose={() => setShowAssessmentModal(false)}
        />
      )}

      </div>{/* end space-y-5 */}
    </div>
  );
}

function EmptyChart({ message = 'Nenhum dado ainda. Conclua treinos para ver seu progresso.' }: { message?: string }) {
  return (
    <div className="h-[160px] flex items-center justify-center text-slate-500 text-sm text-center px-8">
      {message}
    </div>
  );
}
