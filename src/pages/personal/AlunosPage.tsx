import { useState, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents, useCreateStudent, useBlockStudent } from '../../hooks/useStudents';
import { useDiets, useDietAssignments, useAssignDiet, useRemoveDietAssignment } from '../../hooks/useDiets';
import { usePersonalWorkoutLogs, useAssignments } from '../../hooks/useWorkouts';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Salad, ShieldOff, ShieldCheck,
  Search, Check, MessageSquare, MoreHorizontal,
  UserPlus, CalendarDays, X, History, Dumbbell,
  ChevronLeft, ChevronRight, TrendingUp,
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
    await emailjs.send(serviceId, templateId, { to_email: recipient, to_name: toName, password, app_name: 'FitCoach' }, publicKey);
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
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | 'active' | 'blocked'>('all');
  const [currentPage, setCurrentPage]     = useState(1);
  const [openMenuId, setOpenMenuId]         = useState<string | null>(null);

  const [newStudentModal, setNewStudentModal] = useState(false);
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
  const activeCount   = totalStudents - blockedCount;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const blocked = s.isBlocked ?? false;
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'  && !blocked) ||
        (statusFilter === 'blocked' &&  blocked);
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
      setNewStudentModal(false);
      setNewName('');
      setNewEmail('');
      toast.success(`Aluno ${newName.trim()} cadastrado com sucesso!`);
    } catch (err) {
      toast.error((err as Error).message ?? 'Erro ao cadastrar aluno.');
    } finally {
      setCreatingStudent(false);
    }
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
    <div className="p-6 max-w-6xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Alunos</h1>
        <button
          onClick={() => setNewStudentModal(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-2xl transition-colors shadow-sm shadow-indigo-200 dark:shadow-indigo-900/40"
        >
          <UserPlus size={16} />
          Novo aluno
        </button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 mb-5 text-sm">
        <span className="text-slate-500 dark:text-slate-400">
          {totalStudents} aluno{totalStudents !== 1 ? 's' : ''}
        </span>
        <span className="flex items-center gap-1.5 text-emerald-500 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {activeCount} ativo{activeCount !== 1 ? 's' : ''}
        </span>
        {blockedCount > 0 && (
          <span className="flex items-center gap-1.5 text-red-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
            {blockedCount} bloqueado{blockedCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-3 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 self-start sm:self-auto">
          {(['all', 'active', 'blocked'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setCurrentPage(1); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === f
                  ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Ativos' : 'Bloqueados'}
            </button>
          ))}
        </div>
      </div>

      {/* Empty state */}
      {filteredStudents.length === 0 && (
        <div className="text-center py-20 text-slate-400 dark:text-slate-500">
          <UserPlus size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum aluno encontrado.</p>
        </div>
      )}

      {/* Backdrop to close context menus */}
      {openMenuId && (
        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
      )}

      {/* Student list */}
      <div className="flex flex-col gap-2">
        {paginatedStudents.map((student) => {
          const blocked     = student.isBlocked ?? false;
          const avatarColor = blocked ? 'bg-red-500' : getAvatarColor(student.name);
          const lastLog     = getLastLog(student.id);
          const monthCount  = getMonthlyLogCount(student.id);
          const nextWork    = getNextWorkout(student.id);

          return (
            <div
              key={student.id}
              onClick={() => navigate(`/personal/alunos/${student.id}`)}
              className={`cursor-pointer bg-white dark:bg-slate-800/80 rounded-2xl border transition-all hover:shadow-sm ${
                blocked
                  ? 'border-red-200 dark:border-red-800/40 hover:border-red-300 dark:hover:border-red-700/50'
                  : 'border-slate-100 dark:border-slate-700/40 hover:border-indigo-200 dark:hover:border-indigo-700/50'
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">

                {/* Avatar */}
                <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold text-base text-white ${avatarColor}`}>
                  {student.name.charAt(0).toUpperCase()}
                </div>

                {/* Name + quick metrics */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">
                    {student.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {lastLog ? (
                      <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <History size={11} />
                        {relativeTime(lastLog.completedAt)}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Sem treinos</span>
                    )}
                    <span className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                      <TrendingUp size={11} />
                      {monthCount} treino{monthCount !== 1 ? 's' : ''} este mês
                    </span>
                    {nextWork && (
                      <span className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full font-medium">
                        <Dumbbell size={10} />
                        {nextWork}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status badge */}
                <div className="shrink-0 hidden sm:block">
                  {blocked ? (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-red-500">
                      <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
                      Bloqueado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-500">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Ativo
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div
                  className="flex items-center gap-0.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate('/personal/chat')}
                    className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Chat"
                  >
                    <MessageSquare size={16} />
                  </button>

                  {/* Context menu ⋯ */}
                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === student.id ? null : student.id)}
                      className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      title="Mais opções"
                    >
                      <MoreHorizontal size={16} />
                    </button>

                    {openMenuId === student.id && (
                      <div className="absolute right-0 top-full mt-1.5 w-52 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1.5 overflow-hidden">
                        <button
                          onClick={() => { openPlanModal(student.id, student.name); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                        >
                          <CalendarDays size={14} className="text-indigo-500" />
                          Plano semanal
                        </button>
                        <button
                          onClick={() => { setDietModal({ studentId: student.id, studentName: student.name }); setOpenMenuId(null); }}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors"
                        >
                          <Salad size={14} className="text-emerald-500" />
                          Atribuir dieta
                        </button>
                        <div className="my-1 border-t border-slate-100 dark:border-slate-700/60" />
                        <button
                          onClick={() => {
                            blocked ? toggleBlock({ studentId: student.id, blocked: false }) : setConfirmBlock({ id: student.id, name: student.name });
                            setOpenMenuId(null);
                          }}
                          className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm transition-colors ${
                            blocked
                              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                              : 'text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                          }`}
                        >
                          {blocked ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                          {blocked ? 'Desbloquear acesso' : 'Bloquear acesso'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-6">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          {getPaginationRange(safePage, totalPages).map((p, i) =>
            p === '...'
              ? <span key={`e-${i}`} className="px-1 text-slate-400 text-sm select-none">...</span>
              : (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p as number)}
                  className={`w-9 h-9 text-sm font-medium rounded-xl transition-colors ${
                    safePage === p
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {p}
                </button>
              )
          )}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* New student modal */}
      {newStudentModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                <UserPlus size={18} className="text-indigo-600 dark:text-indigo-400" />
              </div>
              <h2 className="font-bold text-slate-800 dark:text-slate-100">Novo aluno</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome completo</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="João Silva"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="aluno@email.com"
                  className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-indigo-500" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Uma senha de 6 dígitos será gerada automaticamente e enviada por e-mail.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setNewStudentModal(false); setNewName(''); setNewEmail(''); }}
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
        </div>
      )}

      {/* Credentials modal */}
      {credentialsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6">
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
