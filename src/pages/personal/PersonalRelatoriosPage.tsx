import { useMemo, useRef, useState } from 'react';
import { usePersonalWorkoutLogs } from '../../hooks/useWorkouts';
import { useStudents } from '../../hooks/useStudents';
import { usePayments } from '../../hooks/usePayments';
import { useTheme } from '../../contexts/ThemeContext';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Users, Dumbbell, Download, FileSpreadsheet, TrendingUp, DollarSign } from 'lucide-react';

function getWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  return monday.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

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

const CHART_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function PersonalRelatoriosPage() {
  const { data: logs = [] } = usePersonalWorkoutLogs();
  const { data: students = [] } = useStudents();
  const { data: payments = [] } = usePayments();
  const { theme } = useTheme();

  const weekLabels = useMemo(() => getLastNWeeks(8), []);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  async function handleExportPDF() {
    if (!reportRef.current) return;
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(reportRef.current, { scale: 1.5, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: [canvas.width / 1.5, canvas.height / 1.5] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 1.5, canvas.height / 1.5);
      pdf.save('relatorio-movr.pdf');
    } finally {
      setExporting(false);
    }
  }

  function handleExportCSV() {
    const rows = [
      ['Aluno', 'Treino', 'Data', 'Duração (min)'],
      ...logs.map((l) => {
        const student = students.find((s) => s.id === l.studentId);
        return [
          student?.name ?? l.studentId,
          l.workoutName,
          new Date(l.completedAt).toLocaleDateString('pt-BR'),
          l.durationMinutes?.toString() ?? '',
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'treinos-movr.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // Treinos por aluno
  const byStudent = useMemo(
    () =>
      students
        .map((s) => ({
          nome: s.name.split(' ')[0],
          treinos: logs.filter((l) => l.studentId === s.id).length,
        }))
        .filter((s) => s.treinos > 0),
    [students, logs]
  );

  // Atividade semanal total (last 8 weeks)
  const weeklyData = useMemo(() => {
    const map: Record<string, number> = {};
    weekLabels.forEach((w) => (map[w] = 0));
    logs.forEach((log) => {
      const label = getWeekLabel(log.completedAt);
      if (label in map) map[label]++;
    });
    return weekLabels.map((semana) => ({ semana, treinos: map[semana] }));
  }, [logs, weekLabels]);

  // Distribuição por nome do treino (para Pie)
  const byWorkout = useMemo(() => {
    const map: Record<string, number> = {};
    logs.forEach((l) => {
      const name = l.workoutName.split('â€“')[0].trim();
      map[name] = (map[name] ?? 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [logs]);
  // Aderência: treinos realizados nas últimas 4 semanas vs. 4 semanas anteriores
  const adherenceData = useMemo(() => {
    const now = Date.now();
    const week4 = 28 * 86_400_000;
    return students
      .map((s) => {
        const recent = logs.filter((l) => l.studentId === s.id && now - new Date(l.completedAt).getTime() < week4).length;
        const prev = logs.filter((l) => {
          const age = now - new Date(l.completedAt).getTime();
          return l.studentId === s.id && age >= week4 && age < week4 * 2;
        }).length;
        return {
          nome: s.name.split(' ')[0],
          recentes: recent,
          anteriores: prev,
          variacao: prev > 0 ? Math.round(((recent - prev) / prev) * 100) : 0,
        };
      })
      .filter((s) => s.recentes > 0 || s.anteriores > 0);
  }, [students, logs]);

  // Financeiro por mês (últimos 6 meses)
  const financialData = useMemo(() => {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }));
    }
    const today = now.toISOString().split('T')[0];
    return months.map((mes, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const pago = payments
        .filter((p) => p.status === 'pago' && p.paidAt?.startsWith(key))
        .reduce((s, p) => s + p.amount, 0);
      const pendente = payments
        .filter((p) => (p.status === 'pendente' || (p.status === 'pendente' && p.dueDate < today)) && p.dueDate.startsWith(key))
        .reduce((s, p) => s + p.amount, 0);
      return { mes, pago, pendente };
    });
  }, [payments]);
  const totalLogs = logs.length;
  const activeStudents = byStudent.length;
  const thisWeek = weeklyData[weeklyData.length - 1]?.treinos ?? 0;

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
    <div className="p-5 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Relatórios</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl transition-colors"
          >
            <FileSpreadsheet size={14} />
            Exportar CSV
          </button>
          <button
            onClick={handleExportPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-xs font-medium rounded-xl transition-colors"
          >
            <Download size={14} />
            {exporting ? 'Exportando...' : 'Exportar PDF'}
          </button>
        </div>
      </div>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
        Visão geral da atividade dos seus alunos.
      </p>
      <div ref={reportRef}>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          {
            Icon: Dumbbell,
            label: 'Total de treinos',
            value: totalLogs,
            color: 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600',
          },
          {
            Icon: Users,
            label: 'Alunos ativos',
            value: activeStudents,
            color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600',
          },
          {
            Icon: Activity,
            label: 'Esta semana',
            value: thisWeek,
            color: 'bg-violet-50 dark:bg-violet-900/30 text-violet-600',
          },
        ].map(({ Icon, label, value, color }) => (
          <div
            key={label}
            className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] p-4 shadow-sm flex items-center gap-3"
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

      {/* Top row: bar by student + pie by workout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Treinos por aluno */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">
            Treinos por aluno
          </h2>
          {byStudent.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byStudent} barSize={36}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis
                  dataKey="nome"
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
                <Bar dataKey="treinos" fill="#6366f1" radius={[6, 6, 0, 0]} name="Treinos" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Treinos mais realizados (Pie) */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-5">
          <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">
            Treinos mais realizados
          </h2>
          {byWorkout.length === 0 ? (
            <EmptyChart />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={byWorkout}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {byWorkout.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', color: tickColor }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Line chart â€” atividade semanal */}
      <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm mb-4">
          Atividade semanal (todos os alunos)
        </h2>
        {totalLogs === 0 ? (
          <EmptyChart />
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={weeklyData}>
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
              <Tooltip contentStyle={tooltipStyle} />
              <Line
                type="monotone"
                dataKey="treinos"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ fill: '#6366f1', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
                name="Treinos"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Adherence chart */}
      {adherenceData.length > 0 && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Aderência por aluno — últimas 4 semanas vs. 4 anteriores
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={adherenceData} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="nome" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: tickColor }} />
              <Bar dataKey="recentes" fill="#6366f1" radius={[6, 6, 0, 0]} name="Últ. 4 sem." />
              <Bar dataKey="anteriores" fill="#475569" radius={[6, 6, 0, 0]} name="4 sem. anteriores" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Financial revenue chart */}
      {financialData.some((d) => d.pago > 0 || d.pendente > 0) && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07] p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-emerald-400" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">
              Receita mensal (últimos 6 meses)
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={financialData} barSize={24} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: tickColor, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip contentStyle={tooltipStyle} cursor={cursorStyle} formatter={(v: number) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
              <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', color: tickColor }} />
              <Bar dataKey="pago" fill="#10b981" radius={[6, 6, 0, 0]} name="Recebido" />
              <Bar dataKey="pendente" fill="#f59e0b" radius={[6, 6, 0, 0]} name="Pendente" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      </div>
    </div>
  );
}

function EmptyChart({ message = 'Nenhum dado disponível.' }: { message?: string }) {
  return (
    <div className="h-[200px] flex items-center justify-center text-slate-400 dark:text-slate-500 text-sm text-center px-8">
      {message}
    </div>
  );
}
