import { useState, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents, useCreateStudent, useBlockStudent, useSearchAluno, useInviteStudent } from '../../hooks/useStudents';
import { useDiets, useDietAssignments, useAssignDiet, useRemoveDietAssignment } from '../../hooks/useDiets';
import { usePersonalWorkoutLogs, useAssignments } from '../../hooks/useWorkouts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Salad, ShieldOff, ShieldCheck,
  Search, Check, MessageSquare, MoreHorizontal,
  UserPlus, CalendarDays, X, Mail, Clock,
  ChevronLeft, ChevronRight, Download, ChevronDown, Users,
} from 'lucide-react';
import type { DietAssignment } from '../../types';
import WeeklyPlanModal from '../../components/WeeklyPlanModal';

const ITEMS_PER_PAGE = 8;

const DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
type DayKey = typeof DAYS[number];

const DAYS_SHORT: Record<DayKey, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
};


const AVATAR_COLORS = [
  'bg-violet-600',
  'bg-blue-600',
  'bg-rose-500',
  'bg-amber-500',
  'bg-teal-500',
  'bg-indigo-600',
  'bg-pink-500',
  'bg-emerald-600',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function generatePassword(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendWelcomeEmail(
  toEmail: string,
  toName: string,
  password: string,
): Promise<boolean> {
  const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID  as string | undefined;
  const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined;
  const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY  as string | undefined;
  if (!serviceId || !templateId || !publicKey) return false;
  const testOverride = import.meta.env.VITE_EMAILJS_TEST_TO as string | undefined;
  const recipient = testOverride?.trim() || toEmail;
  try {
    await emailjs.send(serviceId, templateId, { to_email: recipient, to_name: toName, password, app_name: 'Movr' }, publicKey);
    return true;
  } catch {
    return false;
  }
}

function getPaginationRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total];
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export default function AlunosPage() {
  const { user } = useAuth();
  const { data: diets = [] } = useDiets();
  const { data: dietAssignments = [] } = useDietAssignments();
  const assignDietMutation = useAssignDiet();
  const removeDietAssignmentMutation = useRemoveDietAssignment();
  const { data: logs = [] } = usePersonalWorkoutLogs();
  const { data: assignments = [] } = useAssignments();
  const { data: students = [], isLoading: studentsLoading } = useStudents();
  const { mutateAsync: createStudentMutation } = useCreateStudent();
  const { mutate: toggleBlock } = useBlockStudent();
  const { mutateAsync: searchAluno, isPending: searching } = useSearchAluno();
  const { mutateAsync: inviteStudent, isPending: inviting } = useInviteStudent();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | 'active' | 'blocked' | 'pending'>('all');
  const [currentPage, setCurrentPage]     = useState(1);
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null);

  // New student modal — shared open state + tab
  const [newStudentModal, setNewStudentModal] = useState(false);
  const [modalTab, setModalTab] = useState<'search' | 'new'>('search');

  // Tab: search existing aluno
  const [searchEmail,   setSearchEmail]   = useState('');
  const [searchResult,  setSearchResult]  = useState<{ id: string; name: string; avatarUrl?: string; alreadyLinked: boolean } | null | 'not-found'>(null);

  // Tab: create new aluno
  const [newName,         setNewName]         = useState('');
  const [newEmail,        setNewEmail]        = useState('');
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [credentialsModal, setCredentialsModal] = useState<{
    name: string; email: string; emailSent: boolean;
  } | null>(null);

  // Weekly plan modal
  const [planModal, setPlanModal] = useState<{ studentId: string; studentName: string } | null>(null);

  const [dietModal,      setDietModal]      = useState<{ studentId: string; studentName: string } | null>(null);
  const [selectedDietId, setSelectedDietId] = useState('');

  const [confirmBlock, setConfirmBlock] = useState<{ id: string; name: string } | null>(null);

  const myDiets = diets.filter((d) => d.personalId === user?.id);

  const totalStudents = students.length;
  const blockedCount  = students.filter((s) => s.isBlocked).length;
  const pendingCount  = students.filter((s) => !s.isBlocked && s.connectionStatus === 'pending').length;
  const activeCount   = totalStudents - blockedCount - pendingCount;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const blocked = s.isBlocked ?? false;
      const isPending = !blocked && s.connectionStatus === 'pending';
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'  && !blocked && !isPending) ||
        (statusFilter === 'blocked' &&  blocked) ||
        (statusFilter === 'pending' &&  isPending);
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const totalPages        = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const safePage          = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  function getStudentDietAssignments(studentId: string): DietAssignment[] {
    return dietAssignments.filter((a) => a.studentId === studentId && a.personalId === user?.id);
  }

  function getLastLog(studentId: string) {
    const sl = logs.filter((l) => l.studentId === studentId);
    if (sl.length === 0) return null;
    return [...sl].sort((a, b) => b.completedAt.localeCompare(a.completedAt))[0];
  }

  function getMonthlyLogCount(studentId: string) {
    const now = new Date();
    return logs.filter((l) => {
      const d = new Date(l.completedAt);
      return l.studentId === studentId && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
  }

  function getNextWorkout(studentId: string) {
    const sa = assignments.filter((a) => a.studentId === studentId);
    if (sa.length === 0) return null;
    const dowMap: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
    const todayDow = new Date().getDay();
    for (const assign of sa) {
      for (const day of assign.scheduledDays ?? []) {
        if ((dowMap[day] ?? -1) > todayDow) {
          return assign.workoutName.replace(/^(Treino [A-Z])\s*[-\u2013]\s*.+/, '$1');
        }
      }
    }
    return sa[0].workoutName.replace(/^(Treino [A-Z])\s*[-\u2013]\s*.+/, '$1');
  }

  function relativeTime(iso: string) {
    const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
    if (days === 0) return 'hoje';
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? 'há 1 semana' : `há ${weeks} semanas`;
  }

  async function handleCreateStudent() {
    if (!newName.trim() || !newEmail.trim()) return;
    const password = generatePassword();
    setCreatingStudent(true);
    try {
      await createStudentMutation({ name: newName.trim(), email: newEmail.trim(), password });
      const emailSent = await sendWelcomeEmail(newEmail.trim(), newName.trim(), password);
      setCredentialsModal({ name: newName.trim(), email: newEmail.trim(), emailSent });
      closeNewStudentModal();
      toast.success(`Aluno ${newName.trim()} cadastrado com sucesso!`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao cadastrar aluno.');
    } finally {
      setCreatingStudent(false);
    }
  }

  async function handleSearchAluno() {
    if (!searchEmail.trim()) return;
    try {
      const result = await searchAluno(searchEmail.trim());
      setSearchResult(result ?? 'not-found');
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao buscar aluno.');
    }
  }

  async function handleInviteAluno() {
    if (!searchResult || searchResult === 'not-found') return;
    try {
      await inviteStudent(searchResult.id);
      toast.success(`Convite enviado para ${searchResult.name}!`);
      closeNewStudentModal();
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao enviar convite.');
    }
  }

  function closeNewStudentModal() {
    setNewStudentModal(false);
    setModalTab('search');
    setSearchEmail('');
    setSearchResult(null);
    setNewName('');
    setNewEmail('');
  }

  function handleAssignDiet() {
    if (!selectedDietId || !dietModal || !user) return;
    const diet = myDiets.find((d) => d.id === selectedDietId);
    if (!diet) return;
    assignDietMutation.mutate({ dietId: selectedDietId, dietName: diet.name, studentId: dietModal.studentId, personalId: user.id });
    setDietModal(null);
    setSelectedDietId('');
  }

  function openPlanModal(studentId: string, studentName: string) {
    setPlanModal({ studentId, studentName });
  }

  function getPlanSummaryChips(_studentId: string) {
    return null; // TODO: migrate to useWeeklyPlan per student
  }

  return (
    <div className="p-6 max-w-[1280px] mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Meus alunos</h1>
          <p className="text-sm text-slate-400 mt-1">Gerencie seus alunos, acompanhe o progresso e mantenha tudo organizado.</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => toast.info('Exportar em breve')}
            className="flex items-center gap-2 border border-white/[0.07] text-slate-300 hover:bg-[#0D1025]/60 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
          >
            <Download size={15} />
            Exportar
          </button>
          <button
            onClick={() => setNewStudentModal(true)}
            className="flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6d4feb] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
          >
            <UserPlus size={15} />
            Adicionar aluno
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar aluno por nome..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#0D1025] border border-white/[0.07] text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 placeholder:text-slate-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <span className="absolute -top-2 left-2.5 text-[10px] text-slate-500 bg-[#080B18] px-1 leading-none">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setCurrentPage(1); }}
              className="appearance-none bg-[#0D1025] border border-white/[0.07] text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 cursor-pointer"
            >
              <option value="all">Todos</option>
              <option value="active">Ativo</option>
              <option value="pending">Pendente</option>
              <option value="blocked">Bloqueado</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-2.5 text-[10px] text-slate-500 bg-[#080B18] px-1 leading-none">Plano</span>
            <select className="appearance-none bg-[#0D1025] border border-white/[0.07] text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 cursor-pointer">
              <option value="all">Todos</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <div className="relative">
            <span className="absolute -top-2 left-2.5 text-[10px] text-slate-500 bg-[#080B18] px-1 leading-none">Acesso</span>
            <select className="appearance-none bg-[#0D1025] border border-white/[0.07] text-slate-300 text-sm rounded-xl pl-3 pr-8 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#7c5cfc]/50 cursor-pointer">
              <option value="all">Todos</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {(searchQuery || statusFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCurrentPage(1); }}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition-colors px-1"
            >
              <X size={13} />
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-[#7c5cfc]/15 flex items-center justify-center">
              <Users size={18} className="text-[#7c5cfc]" />
            </div>
            <span className="text-sm text-slate-400">Total de alunos</span>
          </div>
          <p className="text-3xl font-bold text-white">{totalStudents}</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <Check size={18} className="text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">Alunos ativos</span>
          </div>
          <p className="text-3xl font-bold text-white">{activeCount}</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/15 flex items-center justify-center">
              <UserPlus size={18} className="text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">Pendentes</span>
          </div>
          <p className="text-3xl font-bold text-white">{pendingCount}</p>
        </div>
        <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center">
              <Clock size={18} className="text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">Bloqueados</span>
          </div>
          <p className="text-3xl font-bold text-white">{blockedCount}</p>
        </div>
      </div>

      {/* Backdrop */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Empty state */}
      {filteredStudents.length === 0 && !studentsLoading && (
        <div className="text-center py-20 text-slate-500">
          <UserPlus size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum aluno encontrado.</p>
        </div>
      )}

      {/* Table */}
      {filteredStudents.length > 0 && (
        <>
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-white/[0.07]">
                    <th className="text-left text-xs font-medium text-slate-400 px-5 py-3.5">Aluno</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Plano</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Status</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Último treino</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Progresso</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Próxima sessão</th>
                    <th className="text-left text-xs font-medium text-slate-400 px-4 py-3.5">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {paginatedStudents.map((student) => {
                    const blocked   = student.isBlocked ?? false;
                    const isPending = !blocked && student.connectionStatus === 'pending';
                    const avatarColor = blocked ? 'bg-red-500' : getAvatarColor(student.name);
                    const lastLog   = getLastLog(student.id);
                    const monthCount = getMonthlyLogCount(student.id);
                    const nextWork  = getNextWorkout(student.id);
                    const progress  = Math.min(100, monthCount * 5);
                    const initials  = student.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

                    return (
                      <tr
                        key={student.id}
                        onClick={() => navigate(`/personal/alunos/${student.id}`)}
                        className="cursor-pointer hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Aluno */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm text-white ${avatarColor}`}>
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-white text-sm truncate">{student.name}</p>
                              <p className="text-xs text-slate-500 truncate">{student.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Plano */}
                        <td className="px-4 py-4">
                          <p className="text-sm text-slate-400">—</p>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-4">
                          {blocked ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-red-500/15 text-red-400 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              Inativo
                            </span>
                          ) : isPending ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-500/15 text-amber-400 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                              Pendente
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-emerald-500/15 text-emerald-400 px-2.5 py-1 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              Ativo
                            </span>
                          )}
                        </td>

                        {/* Último treino */}
                        <td className="px-4 py-4">
                          {lastLog ? (
                            <div>
                              <p className="text-sm text-slate-300 capitalize">{relativeTime(lastLog.completedAt)}</p>
                              <p className="text-xs text-slate-500 mt-0.5 max-w-[150px] truncate">{lastLog.workoutName}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-500">—</span>
                          )}
                        </td>

                        {/* Progresso */}
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2.5 min-w-[110px]">
                            <span className="text-sm font-medium text-white w-9 shrink-0">{progress}%</span>
                            <div className="flex-1 h-1.5 bg-slate-700/60 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#7c5cfc] rounded-full transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Próxima sessão */}
                        <td className="px-4 py-4">
                          {nextWork ? (
                            <div>
                              <p className="text-sm text-slate-300">Em breve</p>
                              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[140px]">{nextWork}</p>
                            </div>
                          ) : isPending ? (
                            <p className="text-xs text-slate-500">Aguardando confirmação</p>
                          ) : (
                            <p className="text-xs text-slate-500">Sem sessões agendadas</p>
                          )}
                        </td>

                        {/* Ações */}
                        <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => navigate('/personal/chat')}
                              className="p-2 rounded-lg text-slate-500 hover:text-[#7c5cfc] hover:bg-[#7c5cfc]/10 transition-colors"
                              title="Chat"
                            >
                              <MessageSquare size={15} />
                            </button>
                            <button
                              onClick={() => openPlanModal(student.id, student.name)}
                              className="p-2 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                              title="Plano semanal"
                            >
                              <CalendarDays size={15} />
                            </button>
                            <div className="relative">
                              <button
                                onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                                className="p-2 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-700/60 transition-colors"
                                title="Mais opções"
                              >
                                <MoreHorizontal size={15} />
                              </button>
                              {openMenuId === student.id && (
                                <div className="absolute right-0 top-full mt-1.5 w-52 bg-[#1a1d27] rounded-xl shadow-xl border border-white/[0.07] z-20 py-1.5 overflow-hidden">
                                  <button
                                    onClick={() => { openPlanModal(student.id, student.name); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                  >
                                    <CalendarDays size={14} className="text-[#7c5cfc]" />
                                    Plano semanal
                                  </button>
                                  <button
                                    onClick={() => { setDietModal({ studentId: student.id, studentName: student.name }); setOpenMenuId(null); }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700/50 transition-colors"
                                  >
                                    <Salad size={14} className="text-emerald-400" />
                                    Atribuir dieta
                                  </button>
                                  <div className="my-1 border-t border-white/[0.07]/40" />
                                  <button
                                    onClick={() => {
                                      blocked ? toggleBlock({ studentId: student.id, blocked: false }) : setConfirmBlock({ id: student.id, name: student.name });
                                      setOpenMenuId(null);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                                      blocked
                                        ? 'text-emerald-400 hover:bg-emerald-900/20'
                                        : 'text-red-400 hover:bg-red-900/20'
                                    }`}
                                  >
                                    {blocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                                    {blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">
              Mostrando {Math.min((safePage - 1) * ITEMS_PER_PAGE + 1, filteredStudents.length)} a{' '}
              {Math.min(safePage * ITEMS_PER_PAGE, filteredStudents.length)} de {filteredStudents.length} alunos
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 border border-white/[0.07] rounded-xl disabled:opacity-30 hover:bg-[#0D1025]/60 transition-colors"
                >
                  <ChevronLeft size={14} />
                  Anterior
                </button>
                {getPaginationRange(safePage, totalPages).map((p, i) =>
                  p === '...'
                    ? <span key={`e-${i}`} className="px-1.5 text-slate-500 text-sm select-none">...</span>
                    : (
                      <button
                        key={p}
                        onClick={() => setCurrentPage(p as number)}
                        className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors ${
                          safePage === p
                            ? 'bg-[#7c5cfc] text-white'
                            : 'text-slate-400 hover:bg-[#0D1025]/60 border border-white/[0.07]'
                        }`}
                      >
                        {p}
                      </button>
                    )
                )}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-400 border border-white/[0.07] rounded-xl disabled:opacity-30 hover:bg-[#0D1025]/60 transition-colors"
                >
                  Próxima
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {/* New student modal */}
      {newStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-xl w-full max-w-sm">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Adicionar aluno</h2>
              </div>
              <button onClick={closeNewStudentModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mx-6 mb-5 bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1">
              <button
                onClick={() => { setModalTab('search'); setSearchResult(null); setSearchEmail(''); }}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                  modalTab === 'search'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Buscar usuário
              </button>
              <button
                onClick={() => setModalTab('new')}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-colors ${
                  modalTab === 'new'
                    ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Novo usuário
              </button>
            </div>

            {/* Tab: Search existing */}
            {modalTab === 'search' && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Busque um aluno que já tem conta no Movr pelo e-mail. Um convite de vínculo será enviado.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-mail do aluno</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="email"
                        value={searchEmail}
                        onChange={(e) => { setSearchEmail(e.target.value); setSearchResult(null); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearchAluno()}
                        placeholder="aluno@email.com"
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <button
                      onClick={handleSearchAluno}
                      disabled={!searchEmail.trim() || searching}
                      className="px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors shrink-0"
                    >
                      {searching ? '...' : <Search size={14} />}
                    </button>
                  </div>
                </div>

                {/* Search result */}
                {searchResult === 'not-found' && (
                  <div className="rounded-xl bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-600 px-4 py-3 text-sm text-slate-500 dark:text-slate-400 text-center">
                    Nenhum aluno encontrado com esse e-mail.
                    <button
                      onClick={() => setModalTab('new')}
                      className="block w-full mt-2 text-indigo-500 hover:text-indigo-600 text-xs font-medium transition-colors"
                    >
                      Cadastrar como novo usuário ?
                    </button>
                  </div>
                )}

                {searchResult && searchResult !== 'not-found' && (
                  <div className="rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700/40 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm text-white ${getAvatarColor(searchResult.name)}`}>
                        {searchResult.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">{searchResult.name}</p>
                        {searchResult.alreadyLinked ? (
                          <p className="text-xs text-amber-500 mt-0.5">Já vinculado a um personal</p>
                        ) : (
                          <p className="text-xs text-emerald-500 mt-0.5">Disponível para convite</p>
                        )}
                      </div>
                    </div>
                    {!searchResult.alreadyLinked && (
                      <button
                        onClick={handleInviteAluno}
                        disabled={inviting}
                        className="w-full mt-3 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                      >
                        {inviting ? 'Enviando convite...' : 'Enviar convite de vínculo'}
                      </button>
                    )}
                  </div>
                )}

                <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                  <Clock size={13} className="text-slate-400 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    O aluno verá uma notificação no app para confirmar o vínculo. Você já pode criar treinos e dietas enquanto aguarda.
                  </p>
                </div>
              </div>
            )}

            {/* Tab: Create new */}
            {modalTab === 'new' && (
              <div className="px-6 pb-6 space-y-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Crie uma conta para um aluno que ainda não usa o Movr. A senha chega por e-mail automaticamente.
                </p>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Nome completo</label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="João Silva"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="aluno@email.com"
                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2.5 flex items-start gap-2.5">
                  <Check size={13} className="text-indigo-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Uma senha de 6 dígitos será gerada e enviada por e-mail. O vínculo fica pendente até o aluno confirmar no app.
                  </p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={closeNewStudentModal}
                    className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleCreateStudent}
                    disabled={!newName.trim() || !newEmail.trim() || creatingStudent}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                  >
                    {creatingStudent ? 'Criando...' : 'Criar aluno'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Credentials modal */}
      {credentialsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Check size={18} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 dark:text-slate-100">Aluno cadastrado!</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">{credentialsModal.name}</p>
              </div>
            </div>
            {credentialsModal.emailSent ? (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm text-emerald-700 dark:text-emerald-400 font-medium">E-mail enviado com sucesso!</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                  As credenciais foram enviadas para <strong>{credentialsModal.email}</strong>.
                </p>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 mb-5">
                <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">Envio automático não configurado</p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Configure as variáveis <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">VITE_EMAILJS_*</code> no arquivo <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded">.env</code>.
                </p>
              </div>
            )}
            <button onClick={() => setCredentialsModal(null)} className="w-full bg-indigo-600 text-white rounded-lg py-2 text-sm font-semibold hover:bg-indigo-700 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Weekly plan modal */}
      {planModal && (
        <WeeklyPlanModal
          studentId={planModal.studentId}
          studentName={planModal.studentName}
          onClose={() => setPlanModal(null)}
        />
      )}

      {/* Diet modal */}
      {dietModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-slate-800 dark:text-slate-100 mb-1">Atribuir dieta</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">Para: <strong>{dietModal.studentName}</strong></p>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Dieta</label>
            <select
              value={selectedDietId}
              onChange={(e) => setSelectedDietId(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Selecione uma dieta</option>
              {myDiets.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setDietModal(null)} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button onClick={handleAssignDiet} disabled={!selectedDietId} className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-semibold disabled:opacity-50 hover:bg-emerald-700">Atribuir</button>
            </div>
          </div>
        </div>
      )}

      {/* Block confirm */}
      {confirmBlock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                <ShieldOff size={20} className="text-red-500" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Bloquear aluno</h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
              Tem certeza que deseja bloquear <strong className="text-slate-700 dark:text-slate-200">{confirmBlock.name}</strong>?
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">O aluno perderá o acesso ao app até ser desbloqueado.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmBlock(null)} className="flex-1 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700">Cancelar</button>
              <button onClick={() => { toggleBlock({ studentId: confirmBlock.id, blocked: true }); setConfirmBlock(null); }} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600">Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
