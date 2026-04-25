import { useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import {
  Users, Dumbbell, ClipboardList, MessageCircle,
  CalendarDays, ChevronRight, Zap, Activity, UserPlus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { ElementType } from 'react';

// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ color, points }: { color: string; points: string }) {
  return (
    <svg viewBox="0 0 80 30" className="w-20 h-8" preserveAspectRatio="none">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIPS = [
  'Mantenha a consistência e celebre cada pequena conquista!',
  'Um treino bem planejado vale mais que dez improvisados.',
  'A recuperação faz parte do progresso. Respeite o descanso dos alunos.',
  'Pequenas melhorias diárias geram grandes resultados a longo prazo.',
];

function formatDateLabel(date: Date): string {
  const s = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ActivityItem = {
  id: string;
  Icon: ElementType;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function PersonalDashboard() {
  const { user } = useAuth();
  const { students, exercises, workoutSessions, unreadCount } = useApp();
  const navigate = useNavigate();

  const unread = user ? unreadCount(user.id) : 0;
  const today  = new Date();
  const tip    = TIPS[today.getDate() % TIPS.length];

  const stats = [
    {
      label: 'Alunos',
      value: students.length,
      Icon: Users,
      iconBg: 'bg-violet-500/20 dark:bg-violet-500/20',
      iconColor: 'text-violet-500 dark:text-violet-400',
      sparkColor: '#a78bfa',
      sparkPoints: '0,20 10,18 20,22 30,14 40,16 50,10 60,12 70,8 80,14',
      action: () => navigate('/personal/alunos'),
    },
    {
      label: 'Exercícios',
      value: exercises.length,
      Icon: Dumbbell,
      iconBg: 'bg-blue-500/20 dark:bg-blue-500/20',
      iconColor: 'text-blue-500 dark:text-blue-400',
      sparkColor: '#60a5fa',
      sparkPoints: '0,24 10,20 20,18 30,22 40,16 50,14 60,18 70,12 80,10',
      action: () => navigate('/personal/exercicios'),
    },
    {
      label: 'Treinos realizados',
      value: workoutSessions.length,
      Icon: ClipboardList,
      iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/20',
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      sparkColor: '#34d399',
      sparkPoints: '0,26 10,26 20,24 30,24 40,26 50,22 60,20 70,22 80,20',
      action: () => navigate('/personal/alunos'),
    },
    {
      label: 'Mensagens não lidas',
      value: unread,
      Icon: MessageCircle,
      iconBg: 'bg-rose-500/20 dark:bg-rose-500/20',
      iconColor: 'text-rose-500 dark:text-rose-400',
      sparkColor: '#f87171',
      sparkPoints: '0,20 10,22 20,18 30,24 40,20 50,16 60,18 70,14 80,16',
      action: () => navigate('/personal/chat'),
    },
  ];

  const recentActivities = useMemo((): ActivityItem[] => {
    const items: ActivityItem[] = [];

    // Recent workout sessions
    const sessions = [...workoutSessions]
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
      .slice(0, 2);
    for (const s of sessions) {
      const student = students.find((st) => st.id === s.studentId);
      items.push({
        id: `session-${s.id}`,
        Icon: ClipboardList,
        iconBg: 'bg-emerald-500/15 dark:bg-emerald-500/15',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
        title: 'Treino realizado',
        subtitle: `${student?.name ?? 'Aluno'} · ${s.label}`,
        time: new Date(s.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      });
    }

    // Last 2 exercises added
    const recentExs = exercises.slice(-2).reverse();
    for (const ex of recentExs) {
      items.push({
        id: `ex-${ex.id}`,
        Icon: Dumbbell,
        iconBg: 'bg-blue-500/15 dark:bg-blue-500/15',
        iconColor: 'text-blue-500 dark:text-blue-400',
        title: 'Novo exercício adicionado',
        subtitle: ex.name,
        time: 'Recente',
      });
    }

    // Last 2 students
    const recentStudents = students.slice(-2).reverse();
    for (const s of recentStudents) {
      items.push({
        id: `student-${s.id}`,
        Icon: UserPlus,
        iconBg: 'bg-violet-500/15 dark:bg-violet-500/15',
        iconColor: 'text-violet-500 dark:text-violet-400',
        title: 'Novo aluno cadastrado',
        subtitle: s.name,
        time: 'Recente',
      });
    }

    return items.slice(0, 5);
  }, [workoutSessions, exercises, students]);

  return (
    <div className="p-5 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Olá, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Aqui está um resumo da sua academia.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-600 dark:text-slate-300 shadow-sm">
          <CalendarDays size={14} className="text-indigo-500" />
          <span>{formatDateLabel(today)}</span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {stats.map(({ label, value, Icon, iconBg, iconColor, sparkColor, sparkPoints, action }) => (
          <button
            key={label}
            onClick={action}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col gap-2 text-left hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-700 transition-all"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
              <Icon size={20} className={iconColor} />
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-white">{value}</div>
            <div className="flex items-end justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 leading-tight">{label}</span>
              <Sparkline color={sparkColor} points={sparkPoints} />
            </div>
          </button>
        ))}
      </div>

      {/* Two-column section */}
      <div className="grid md:grid-cols-2 gap-4 mb-4">

        {/* Recent workout sessions */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays size={15} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Treinos recentes dos alunos</h2>
          </div>
          {workoutSessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <ClipboardList size={28} className="text-indigo-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum treino registrado ainda.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Os treinos dos seus alunos aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {[...workoutSessions]
                .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
                .slice(0, 5)
                .map((session) => {
                  const student = students.find((s) => s.id === session.studentId);
                  return (
                    <li key={session.id} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0">
                        <span className="text-indigo-500 font-bold text-xs">
                          {student?.name?.charAt(0).toUpperCase() ?? '?'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                          {student?.name ?? 'Aluno'}
                        </p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{session.label}</p>
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">
                        {new Date(session.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                        {` · ${session.durationMinutes}min`}
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </div>

        {/* Recent activities */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 p-5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={15} className="text-indigo-500" />
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 text-sm">Atividades recentes</h2>
          </div>
          {recentActivities.length === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center flex-1">
              Nenhuma atividade recente.
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/50 flex-1">
              {recentActivities.map(({ id, Icon, iconBg, iconColor, title, subtitle, time }) => (
                <li key={id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon size={14} className={iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{title}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">{subtitle}</p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{time}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            onClick={() => navigate('/personal/alunos')}
            className="flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 mt-4 transition-colors self-start"
          >
            Ver todas as atividades <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Tip of the day */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-5 overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Zap size={22} className="text-yellow-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white">Dica do dia</p>
            <p className="text-indigo-100 text-sm mt-0.5">{tip}</p>
          </div>
          <Dumbbell size={72} className="text-white/10 shrink-0 hidden md:block rotate-12" />
        </div>
      </div>

    </div>
  );
}
