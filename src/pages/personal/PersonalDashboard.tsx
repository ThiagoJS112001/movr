﻿import { useMemo, useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useWorkouts, usePersonalWorkoutLogs } from '../../hooks/useWorkouts';
import { useTotalUnread, useMessages } from '../../hooks/useMessages';
import { usePayments } from '../../hooks/usePayments';
import { useSessions } from '../../hooks/useSessions';
import { supabase } from '../../lib/supabase';
import {
  Users,
  ClipboardList,
  MessageCircle,
  ChevronRight,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Activity,
  CalendarCheck,
  AlertTriangle,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function formatDateLabel(date: Date): string {
  const s = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins} min atrás`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} h atrás`;
  return `${Math.floor(hrs / 24)} dia${Math.floor(hrs / 24) !== 1 ? 's' : ''} atrás`;
}

function Avatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const s = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-9 h-9 text-sm';
  return (
    <div className={`${s} rounded-full bg-indigo-600/20 flex items-center justify-center shrink-0`}>
      <span className="text-indigo-400 font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

export default function PersonalDashboard() {
  const { user } = useAuth();
  const { data: students = [] } = useStudents();
  const { data: workouts = [] } = useWorkouts();
  const { data: allLogs = [] } = usePersonalWorkoutLogs();
  const { data: allMessages = [] } = useMessages();
  const { data: payments = [] } = usePayments();
  const { data: sessions = [] } = useSessions();
  const navigate = useNavigate();

  const unread = useTotalUnread();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const trainedTodayCount = useMemo(
    () => new Set(allLogs.filter((l) => l.completedAt.startsWith(todayStr)).map((l) => l.studentId)).size,
    [allLogs, todayStr],
  );

  // Profile completion – fetch extended fields once
  const [profilePct, setProfilePct] = useState(0);
  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('profiles')
      .select('name, bio, phone, city, state, avatar_url, specialties, certifications, experience_years, instagram, whatsapp')
      .eq('id', user.id)
      .single()
      .then(({ data: d }) => {
        if (!d) return;
        const row = d as Record<string, unknown>;
        let score = 0;
        const total = 9;
        if (row.name) score++;
        if (row.avatar_url) score++;
        if (row.bio) score++;
        if (row.phone) score++;
        if (row.city && row.state) score++;
        if (Array.isArray(row.specialties) && (row.specialties as unknown[]).length > 0) score++;
        if (Array.isArray(row.certifications) && (row.certifications as unknown[]).length > 0) score++;
        if (row.experience_years) score++;
        if (row.instagram || row.whatsapp) score++;
        setProfilePct(Math.round((score / total) * 100));
      });
  }, [user?.id]);

  const profileIncomplete = profilePct < 100;

  // Agenda do dia — today's logs as "Confirmado", remaining as no-show
  const agendaItems = useMemo(() => {
    const todayLogs = allLogs
      .filter((l) => l.completedAt.startsWith(todayStr))
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return todayLogs.map((log) => {
      const student = students.find((s) => s.id === log.studentId);
      return {
        id: log.id,
        studentName: student?.name ?? 'Aluno',
        workoutName: log.workoutName,
        status: 'confirmado' as const,
        time: new Date(log.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
    });
  }, [allLogs, students, todayStr]);

  // Atividades recentes
  const recentActivities = useMemo(
    () =>
      [...allLogs]
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
        .slice(0, 6)
        .map((log) => {
          const student = students.find((s) => s.id === log.studentId);
          return {
            id: log.id,
            label: `Treino concluído por ${student?.name ?? 'Aluno'}`,
            detail: log.workoutName,
            when: log.completedAt,
            type: 'workout' as const,
          };
        }),
    [allLogs, students],
  );

  // Alunos recentes (last 5)
  const recentStudents = useMemo(() => {
    const lastLog = new Map<string, string>();
    for (const l of allLogs) {
      const existing = lastLog.get(l.studentId);
      if (!existing || l.completedAt > existing) lastLog.set(l.studentId, l.completedAt);
    }
    return students
      .slice()
      .sort((a, b) => {
        const la = lastLog.get(a.id) ?? '';
        const lb = lastLog.get(b.id) ?? '';
        return lb.localeCompare(la);
      })
      .slice(0, 5)
      .map((s) => ({
        id: s.id,
        name: s.name,
        lastActivity: lastLog.get(s.id),
        plan: 'Plano Ativo',
      }));
  }, [students, allLogs]);

  // Smart alerts
  const smartAlerts = useMemo(() => {
    const alerts: { id: string; type: 'warning' | 'info'; message: string; link?: string }[] = [];

    // Overdue payments
    const overdueCount = payments.filter(
      (p) => p.status === 'pendente' && p.dueDate < todayStr
    ).length;
    if (overdueCount > 0)
      alerts.push({ id: 'overdue', type: 'warning', message: `${overdueCount} pagamento${overdueCount > 1 ? 's' : ''} vencido${overdueCount > 1 ? 's' : ''}`, link: '/personal/financeiro' });

    // Today's sessions
    const todaySessions = sessions.filter((s) => s.date === todayStr && s.status === 'agendado');
    if (todaySessions.length > 0)
      alerts.push({ id: 'sessions', type: 'info', message: `${todaySessions.length} sessão${todaySessions.length > 1 ? 'ões' : ''} agendada${todaySessions.length > 1 ? 's' : ''} para hoje`, link: '/personal/agenda' });

    // Inactive students (7+ days)
    const lastLog = new Map<string, string>();
    for (const l of allLogs) {
      const existing = lastLog.get(l.studentId);
      if (!existing || l.completedAt > existing) lastLog.set(l.studentId, l.completedAt);
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const inactiveCount = students.filter((s) => {
      const last = lastLog.get(s.id);
      return !last || last < sevenDaysAgo;
    }).length;
    if (inactiveCount > 0)
      alerts.push({ id: 'inactive', type: 'warning', message: `${inactiveCount} aluno${inactiveCount > 1 ? 's' : ''} sem treino há 7+ dias`, link: '/personal/alunos' });

    return alerts;
  }, [payments, sessions, allLogs, students, todayStr]);

  // Monthly revenue
  const totalPaidMonth = useMemo(() => {
    const monthKey = todayStr.substring(0, 7);
    return payments
      .filter((p) => p.status === 'pago' && p.paidAt?.startsWith(monthKey))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments, todayStr]);

  // Mensagens não lidas
  const unreadMessages = useMemo(
    () =>
      allMessages
        .filter((m) => m.toId === user?.id && !m.read)
        .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
        .slice(0, 4),
    [allMessages, user?.id],
  );

  return (
    <div className="p-5 max-w-screen-xl mx-auto flex flex-col gap-4">

      {/* —— Profile completion banner —— */}
      {profileIncomplete && (
        <button
          onClick={() => navigate('/completar-perfil')}
          className="w-full flex items-center gap-4 bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl px-5 py-3 text-left hover:border-indigo-500/40 transition group"
        >
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Perfil profissional{' '}
                <span className="text-indigo-400 font-semibold">{profilePct}% completo</span>
                {' '}— aumente sua visibilidade e conquiste mais alunos
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-white/10 rounded-full h-1.5">
              <div
                className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${profilePct}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition flex items-center gap-1">
            Completar perfil <ChevronRight size={13} />
          </span>
        </button>
      )}

      {/* —— Date + Greeting —— */}
      <div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateLabel(today)}</p>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
          Olá, {user?.name?.split(' ')[0]}! 👋
        </h1>
      </div>

      {/* Smart Alerts */}
      {smartAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {smartAlerts.map((alert) => (
            <button
              key={alert.id}
              onClick={() => alert.link && navigate(alert.link)}
              className={[
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm text-left transition',
                alert.type === 'warning'
                  ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400 hover:bg-amber-500/15'
                  : 'bg-blue-500/10 border border-blue-500/25 text-blue-300 hover:bg-blue-500/15',
              ].join(' ')}
            >
              {alert.type === 'warning' ? <AlertTriangle size={14} /> : <Clock size={14} />}
              <span>{alert.message}</span>
              {alert.link && <ChevronRight size={13} className="ml-auto" />}
            </button>
          ))}
        </div>
      )}

      {/* —— Stat cards —— */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Alunos ativos */}
        <button
          onClick={() => navigate('/personal/alunos')}
          className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 text-left hover:border-indigo-500/40 transition group flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-violet-500/15 flex items-center justify-center">
              <Users size={17} className="text-violet-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <TrendingUp size={10} /> +{trainedTodayCount > 0 ? trainedTodayCount : 0} hoje
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{students.length}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Alunos ativos</p>
          </div>
        </button>

        {/* Treinos hoje */}
        <button
          onClick={() => navigate('/personal/treinos')}
          className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 text-left hover:border-indigo-500/40 transition group flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
              <CalendarCheck size={17} className="text-blue-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              ao vivo
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{trainedTodayCount}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Treinos hoje
              {workouts.length > 0 && (
                <span className="ml-1 text-slate-400 dark:text-slate-500">· {workouts.length} fichas</span>
              )}
            </p>
          </div>
        </button>

        {/* Mensagens */}
        <button
          onClick={() => navigate('/personal/chat')}
          className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 text-left hover:border-indigo-500/40 transition group flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center">
              <MessageCircle size={17} className="text-rose-400" />
            </div>
            {unread > 0 && (
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-400/10 px-2 py-0.5 rounded-full">
                {unread} nova{unread !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{unread}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Mensagens não lidas</p>
          </div>
        </button>

        {/* Receita do mês */}
        <button
          onClick={() => navigate('/personal/financeiro')}
          className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5 text-left hover:border-emerald-500/40 transition group flex flex-col gap-3"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <DollarSign size={17} className="text-emerald-400" />
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
              este mês
            </span>
          </div>
          <div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {totalPaidMonth.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Receita do mês</p>
          </div>
        </button>
      </div>

      {/* —— Main grid —— */}
      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-4">

        {/* Left column */}
        <div className="flex flex-col gap-4">

          {/* Agenda do dia */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarCheck size={15} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Agenda do dia</h2>
              </div>
              <button
                onClick={() => navigate('/personal/alunos')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-0.5"
              >
                Ver agenda completa <ChevronRight size={12} />
              </button>
            </div>

            {agendaItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                  <CalendarCheck size={20} className="text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhum treino hoje</p>
                <p className="text-xs text-slate-400">Os treinos concluídos hoje aparecerão aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/40">
                {agendaItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500 w-10 shrink-0">
                      {item.time}
                    </span>
                    <Avatar name={item.studentName} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{item.studentName}</p>
                      <p className="text-xs text-slate-400 truncate">{item.workoutName}</p>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-400/10 text-emerald-400">
                      Confirmado
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Atividades recentes */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={15} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Atividades recentes</h2>
            </div>

            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                  <ClipboardList size={20} className="text-blue-400" />
                </div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Nenhuma atividade recente</p>
                <p className="text-xs text-slate-400">Os registros dos alunos aparecerão aqui.</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/40">
                {recentActivities.map((a) => (
                  <div key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{a.label}</p>
                      <p className="text-[11px] text-slate-400 truncate">{a.detail}</p>
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 shrink-0">{timeAgo(a.when)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">

          {/* Alunos recentes */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users size={15} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Alunos recentes</h2>
              </div>
              <button
                onClick={() => navigate('/personal/alunos')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-0.5"
              >
                Ver todos <ChevronRight size={12} />
              </button>
            </div>

            {recentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                  <Users size={18} className="text-violet-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nenhum aluno cadastrado</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/40">
                {recentStudents.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Avatar name={s.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{s.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{s.plan}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[11px] text-emerald-400">Ativo</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mensagens não lidas */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageCircle size={15} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Mensagens não lidas</h2>
              </div>
              <button
                onClick={() => navigate('/personal/chat')}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-0.5"
              >
                Abrir chat <ChevronRight size={12} />
              </button>
            </div>

            {unreadMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2 text-center">
                <div className="w-11 h-11 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                  <MessageCircle size={18} className="text-rose-400" />
                </div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Nenhuma mensagem nova</p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-700/40">
                {unreadMessages.map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Avatar name={students.find(s => s.id === m.fromId)?.name ?? 'Aluno'} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-white truncate">{students.find(s => s.id === m.fromId)?.name ?? 'Aluno'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{m.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[11px] text-slate-400">{timeAgo(m.sentAt)}</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Resumo financeiro */}
          <div className="bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <DollarSign size={15} className="text-indigo-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">Resumo financeiro</h2>
              </div>
              <button className="text-xs text-indigo-400 hover:text-indigo-300 transition flex items-center gap-0.5">
                Ver relatório <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Faturamento (mês)', value: 'R$ —', color: 'text-slate-900 dark:text-white' },
                { label: 'A receber', value: 'R$ —', color: 'text-emerald-400' },
                { label: 'Próximo receb.', value: '—', color: 'text-slate-900 dark:text-white' },
              ].map((item) => (
                <div key={item.label} className="flex flex-col gap-0.5">
                  <p className="text-[10px] text-slate-400 leading-tight">{item.label}</p>
                  <p className={`text-sm font-bold ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-3 border-t border-slate-100 dark:border-white/[0.07]/40 pt-3">
              <p className="text-[11px] text-slate-400 text-center">
                Módulo financeiro em breve
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
