import { useState, useMemo } from 'react';
import emailjs from '@emailjs/browser';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Salad, ShieldOff, ShieldCheck,
  Search, ChevronDown, ChevronUp, Check, MessageSquare,
  UserPlus, CalendarDays, X, Archive, History, Plus,
  SlidersHorizontal, GripVertical, ClipboardList, Sparkles, Info, Dumbbell,
  ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { DietAssignment, WeeklyDay } from '../../types';

const ITEMS_PER_PAGE = 8;

const DAYS = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'] as const;
type DayKey = typeof DAYS[number];

const DAYS_LABEL: Record<DayKey, string> = {
  segunda: 'Segunda-feira',
  terca:   'Terça-feira',
  quarta:  'Quarta-feira',
  quinta:  'Quinta-feira',
  sexta:   'Sexta-feira',
  sabado:  'Sábado',
  domingo: 'Domingo',
};

// Used only in plan modal tabs
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

function getMuscleGroupColor(group: string): string {
  const map: Record<string, string> = {
    'Peito':       'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
    'Costas':      'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
    'Pernas':      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
    'Ombros':      'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
    'Bíceps':      'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    'Tríceps':     'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
    'Abdômen':     'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    'Panturrilha': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  };
  return map[group] ?? 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400';
}

function makeEmptyDays(): WeeklyDay[] {
  return DAYS.map((d) => ({ dayOfWeek: d, label: '', exerciseIds: [] }));
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
  const {
    students, addStudent,
    exercises, getWeeklyPlan, setWeeklyPlan, archiveWeeklyPlan,
    diets, dietAssignments, assignDiet, removeDietAssignment,
    isStudentBlocked, blockStudent, unblockStudent,
  } = useApp();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery]     = useState('');
  const [statusFilter, setStatusFilter]   = useState<'all' | 'active' | 'blocked'>('all');
  const [currentPage, setCurrentPage]     = useState(1);
  const [expandedStudents, setExpandedStudents] = useState<Set<string>>(new Set());

  const [newStudentModal, setNewStudentModal] = useState(false);
  const [newName,         setNewName]         = useState('');
  const [newEmail,        setNewEmail]        = useState('');
  const [creatingStudent, setCreatingStudent] = useState(false);

  const [credentialsModal, setCredentialsModal] = useState<{
    name: string; email: string; emailSent: boolean;
  } | null>(null);

  // Weekly plan modal
  const [planModal,     setPlanModal]     = useState<{ studentId: string; studentName: string } | null>(null);
  const [planDays,      setPlanDays]      = useState<WeeklyDay[]>(makeEmptyDays());
  const [planActiveDay, setPlanActiveDay] = useState<DayKey>('segunda');
  const [exerciseSearch,      setExerciseSearch]      = useState('');
  const [exerciseMuscleFilter, setExerciseMuscleFilter] = useState('');
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const [dietModal,      setDietModal]      = useState<{ studentId: string; studentName: string } | null>(null);
  const [selectedDietId, setSelectedDietId] = useState('');

  const [confirmBlock, setConfirmBlock] = useState<{ id: string; name: string } | null>(null);

  const myDiets = diets.filter((d) => d.personalId === user?.id);

  const totalStudents = students.length;
  const blockedCount  = students.filter((s) => isStudentBlocked(s.id)).length;
  const activeCount   = totalStudents - blockedCount;

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q);
      const blocked = isStudentBlocked(s.id);
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active'  && !blocked) ||
        (statusFilter === 'blocked' &&  blocked);
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter, isStudentBlocked]);

  const totalPages        = Math.max(1, Math.ceil(filteredStudents.length / ITEMS_PER_PAGE));
  const safePage          = Math.min(currentPage, totalPages);
  const paginatedStudents = filteredStudents.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  function toggleExpanded(id: string) {
    setExpandedStudents((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function getStudentDietAssignments(studentId: string): DietAssignment[] {
    return dietAssignments.filter((a) => a.studentId === studentId && a.personalId === user?.id);
  }

  async function handleCreateStudent() {
    if (!newName.trim() || !newEmail.trim()) return;
    const password = generatePassword();
    setCreatingStudent(true);
    try {
      addStudent(newName.trim(), newEmail.trim(), password);
      const emailSent = await sendWelcomeEmail(newEmail.trim(), newName.trim(), password);
      setCredentialsModal({ name: newName.trim(), email: newEmail.trim(), emailSent });
      setNewStudentModal(false);
      setNewName('');
      setNewEmail('');
      toast.success(`Aluno ${newName.trim()} cadastrado com sucesso!`);
    } finally {
      setCreatingStudent(false);
    }
  }

  function handleAssignDiet() {
    if (!selectedDietId || !dietModal || !user) return;
    const diet = myDiets.find((d) => d.id === selectedDietId);
    if (!diet) return;
    assignDiet({ dietId: selectedDietId, dietName: diet.name, studentId: dietModal.studentId, personalId: user.id });
    setDietModal(null);
    setSelectedDietId('');
  }

  const uniqueMuscleGroups = useMemo(
    () => [...new Set(exercises.map((ex) => ex.muscleGroup))].sort(),
    [exercises],
  );

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase();
    return exercises.filter((ex) => {
      const matchesName   = ex.name.toLowerCase().includes(q);
      const matchesMuscle = !exerciseMuscleFilter || ex.muscleGroup === exerciseMuscleFilter;
      return matchesName && matchesMuscle;
    });
  }, [exercises, exerciseSearch, exerciseMuscleFilter]);

  function openPlanModal(studentId: string, studentName: string) {
    const existing = getWeeklyPlan(studentId);
    setPlanDays(existing ? existing.days.map((d) => ({ ...d })) : makeEmptyDays());
    setPlanActiveDay('segunda');
    setExerciseSearch('');
    setExerciseMuscleFilter('');
    setShowArchiveConfirm(false);
    setPlanModal({ studentId, studentName });
  }

  function resetPlanDays() {
    setPlanDays(makeEmptyDays());
    setPlanActiveDay('segunda');
    setExerciseSearch('');
    setExerciseMuscleFilter('');
    setShowArchiveConfirm(false);
  }

  function handleNewPlan() {
    const hasContent = planDays.some((d) => d.label.trim() || d.exerciseIds.length > 0);
    if (hasContent) {
      setShowArchiveConfirm(true);
    } else {
      resetPlanDays();
    }
  }

  function updateActiveDayLabel(value: string) {
    setPlanDays((prev) =>
      prev.map((d) => d.dayOfWeek === planActiveDay ? { ...d, label: value } : d),
    );
  }

  function togglePlanExercise(exerciseId: string) {
    setPlanDays((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek !== planActiveDay) return d;
        const has = d.exerciseIds.includes(exerciseId);
        return {
          ...d,
          exerciseIds: has
            ? d.exerciseIds.filter((id) => id !== exerciseId)
            : [...d.exerciseIds, exerciseId],
        };
      }),
    );
  }

  function handleSavePlan() {
    if (!planModal || !user) return;
    setWeeklyPlan(planModal.studentId, user.id, planDays);
    setPlanModal(null);
    toast.success('Plano semanal salvo!');
  }

  const activeDayData = planDays.find((d) => d.dayOfWeek === planActiveDay);

  function getPlanSummaryChips(studentId: string) {
    const plan = getWeeklyPlan(studentId);
    if (!plan) return null;
    const withContent = plan.days.filter((d) => d.exerciseIds.length > 0 || d.label.trim());
    if (withContent.length === 0) return null;
    return withContent.map((d) => ({
      short: DAYS_SHORT[d.dayOfWeek as DayKey] ?? d.dayOfWeek,
      label: d.label.trim() || `${d.exerciseIds.length} ex.`,
    }));
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

      {/* Student list */}
      <div className="flex flex-col gap-2">
        {paginatedStudents.map((student) => {
          const studentDietAssignments = getStudentDietAssignments(student.id);
          const blocked   = isStudentBlocked(student.id);
          const expanded  = expandedStudents.has(student.id);
          const planChips = getPlanSummaryChips(student.id);
          const avatarColor = blocked ? 'bg-red-500' : getAvatarColor(student.name);

          return (
            <div
              key={student.id}
              className={`bg-white dark:bg-slate-800/80 rounded-2xl border transition-all ${
                blocked
                  ? 'border-red-200 dark:border-red-800/40'
                  : 'border-slate-100 dark:border-slate-700/40 hover:border-indigo-200 dark:hover:border-indigo-700/50'
              }`}
            >
              <div className="flex items-center gap-4 px-5 py-4">

                {/* Avatar + name — clickable to detail page */}
                <button
                  onClick={() => navigate(`/personal/alunos/${student.id}`)}
                  className="flex items-center gap-4 flex-1 min-w-0 text-left group"
                >
                  <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold text-base text-white ${avatarColor}`}>
                    {student.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-white text-sm truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {student.name}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">{student.email}</p>
                  </div>
                </button>

                {/* Status badge */}
                <div className="shrink-0">
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
                <div className="flex items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => navigate('/personal/chat')}
                    className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                    title="Chat"
                  >
                    <MessageSquare size={16} />
                  </button>
                  <button
                    onClick={() =>
                      blocked
                        ? unblockStudent(student.id)
                        : setConfirmBlock({ id: student.id, name: student.name })
                    }
                    className={`p-2.5 rounded-xl transition-colors ${
                      blocked
                        ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                        : 'text-red-400 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30'
                    }`}
                    title={blocked ? 'Desbloquear' : 'Bloquear'}
                  >
                    {blocked ? <ShieldCheck size={16} /> : <ShieldOff size={16} />}
                  </button>
                  <button
                    onClick={() => toggleExpanded(student.id)}
                    className="p-2.5 rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Expanded panel */}
              {expanded && (
                <div className="px-5 pb-4 border-t border-slate-100 dark:border-slate-700/50 pt-3">

                  {/* Plan chips */}
                  {planChips && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {planChips.map((chip) => (
                        <span
                          key={chip.short}
                          className="inline-flex items-center gap-1 text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full"
                        >
                          <span className="font-semibold">{chip.short}:</span> {chip.label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Diet assignments */}
                  {studentDietAssignments.length > 0 && (
                    <div className="mb-3 flex flex-col gap-1.5">
                      {studentDietAssignments.map((a) => (
                        <div key={a.id} className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-900/30 rounded-xl px-3 py-2">
                          <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200 min-w-0">
                            <Salad size={13} className="text-emerald-500 shrink-0" />
                            <span className="truncate">{a.dietName}</span>
                          </div>
                          <button onClick={() => removeDietAssignment(a.id)} className="text-xs text-red-400 hover:text-red-600 shrink-0 ml-2">
                            Remover
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => openPlanModal(student.id, student.name)}
                      className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <CalendarDays size={13} />
                      Plano semanal
                    </button>
                    <button
                      onClick={() => setDietModal({ studentId: student.id, studentName: student.name })}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      <Salad size={13} />
                      Atribuir dieta
                    </button>
                  </div>
                </div>
              )}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden">

            {/* Archive confirmation overlay */}
            {showArchiveConfirm && (
              <div className="absolute inset-0 bg-white/95 dark:bg-slate-900/95 rounded-2xl z-10 flex flex-col items-center justify-center gap-5 px-8 text-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                  <Archive size={26} className="text-amber-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100 mb-1">Arquivar plano atual?</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    O plano de <strong>{planModal.studentName}</strong> já possui conteúdo. Deseja enviá-lo para o histórico antes de criar um novo?
                  </p>
                </div>
                <div className="flex flex-col gap-2 w-full">
                  <button
                    onClick={() => {
                      if (user) archiveWeeklyPlan(planModal.studentId, user.id, planModal.studentName);
                      resetPlanDays();
                      toast.success('Plano arquivado no histórico!');
                    }}
                    className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl py-2.5 text-sm font-semibold transition-colors"
                  >
                    <Archive size={14} />
                    Arquivar e criar novo
                  </button>
                  <button
                    onClick={resetPlanDays}
                    className="w-full border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Criar sem arquivar
                  </button>
                  <button
                    onClick={() => setShowArchiveConfirm(false)}
                    className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 py-1 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                  <CalendarDays size={18} className="text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h2 className="font-bold text-slate-800 dark:text-white">Plano semanal</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{planModal.studentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => { setPlanModal(null); navigate(`/personal/historico-planos?studentId=${planModal.studentId}`); }}
                  className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <History size={14} />
                  <span>Histórico</span>
                </button>
                <button
                  onClick={handleNewPlan}
                  className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 transition-colors"
                >
                  <Plus size={12} />
                  <span>Novo plano</span>
                </button>
                <button
                  onClick={() => setPlanModal(null)}
                  className="ml-1 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Day tabs */}
            <div className="flex gap-1.5 px-6 pt-4 pb-3 shrink-0 overflow-x-auto">
              {DAYS.map((day) => {
                const dayData    = planDays.find((d) => d.dayOfWeek === day);
                const exCount    = dayData?.exerciseIds.length ?? 0;
                const hasContent = dayData && (dayData.label.trim() || exCount > 0);
                const isActive   = planActiveDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setPlanActiveDay(day)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all shrink-0 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/50'
                        : hasContent
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-700'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {DAYS_SHORT[day]}
                    {isActive && <Check size={13} />}
                  </button>
                );
              })}
            </div>

            {/* Body: two columns */}
            <div className="flex flex-1 overflow-hidden min-h-0">

              {/* Left column: exercise selection */}
              <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4 min-w-0">

                {/* Training name */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1.5">
                    Nome do treino{' '}
                    <span className="text-slate-400 font-normal text-xs">(ex: Peito, Costas — vazio = descanso)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={activeDayData?.label ?? ''}
                      onChange={(e) => updateActiveDayLabel(e.target.value)}
                      placeholder="Deixe em branco para dia de descanso"
                      className="w-full border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                    />
                    <Dumbbell size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 pointer-events-none" />
                  </div>
                </div>

                {/* Exercises section */}
                <div>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">
                    Exercícios{' '}
                    <span className="text-slate-400 font-normal text-xs">
                      ({activeDayData?.exerciseIds.length ?? 0} selecionados)
                    </span>
                  </p>

                  {/* Search bar */}
                  <div className="flex gap-2 mb-2.5">
                    <div className="relative flex-1">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Buscar por nome do exercício..."
                        value={exerciseSearch}
                        onChange={(e) => setExerciseSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder:text-slate-300 dark:placeholder:text-slate-600"
                      />
                    </div>
                    <button className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:border-indigo-300 dark:hover:border-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      <SlidersHorizontal size={15} />
                    </button>
                  </div>

                  {/* Muscle group filter pills */}
                  {uniqueMuscleGroups.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mb-3">
                      <button
                        onClick={() => setExerciseMuscleFilter('')}
                        className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                          !exerciseMuscleFilter
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        Todos
                      </button>
                      {uniqueMuscleGroups.map((group) => (
                        <button
                          key={group}
                          onClick={() => setExerciseMuscleFilter(exerciseMuscleFilter === group ? '' : group)}
                          className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                            exerciseMuscleFilter === group
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {group}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Exercise list */}
                  {exercises.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                      Nenhum exercício no catálogo ainda. Adicione em Exercícios.
                    </p>
                  ) : filteredExercises.length === 0 ? (
                    <p className="text-sm text-slate-400 dark:text-slate-500 py-4 text-center">
                      Nenhum exercício encontrado.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {filteredExercises.map((ex) => {
                        const checked = activeDayData?.exerciseIds.includes(ex.id) ?? false;
                        return (
                          <label
                            key={ex.id}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                              checked
                                ? 'border-indigo-200 dark:border-indigo-700 bg-indigo-50/50 dark:bg-indigo-900/20'
                                : 'border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => togglePlanExercise(ex.id)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 shrink-0"
                            />
                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 overflow-hidden">
                              {ex.imageUrl ? (
                                <img src={ex.imageUrl} alt={ex.name} className="w-full h-full object-cover" />
                              ) : (
                                <Dumbbell size={16} className="text-slate-400 dark:text-slate-500" />
                              )}
                            </div>
                            <span className="flex-1 text-sm text-slate-700 dark:text-slate-200 font-medium">{ex.name}</span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 ${getMuscleGroupColor(ex.muscleGroup)}`}>
                              {ex.muscleGroup}
                            </span>
                            <GripVertical size={15} className="text-slate-300 dark:text-slate-600 shrink-0" />
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right column: Day summary */}
              <div className="w-56 shrink-0 border-l border-slate-100 dark:border-slate-700/60 overflow-y-auto flex flex-col gap-4 p-4 bg-slate-50/50 dark:bg-slate-800/20">
                <div>
                  <p className="text-sm font-semibold text-slate-800 dark:text-white">Resumo do dia</p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">{DAYS_LABEL[planActiveDay as DayKey]}</p>
                </div>

                {(activeDayData?.exerciseIds.length ?? 0) === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 py-4">
                    <div className="w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center">
                      <ClipboardList size={26} className="text-slate-300 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 leading-snug">
                      Nenhum exercício selecionado ainda.
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Selecione exercícios ao lado para montar seu treino.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {activeDayData!.exerciseIds.map((id) => {
                      const ex = exercises.find((e) => e.id === id);
                      if (!ex) return null;
                      return (
                        <div key={id} className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-xl px-3 py-2 border border-slate-100 dark:border-slate-700">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                          <span className="text-xs text-slate-700 dark:text-slate-200 truncate">{ex.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Tips */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 border border-slate-100 dark:border-slate-700/60">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 mb-2">
                    <Sparkles size={12} className="text-indigo-500" />
                    Dicas
                  </p>
                  <ul className="text-xs text-slate-500 dark:text-slate-400 flex flex-col gap-1.5">
                    <li>• Comece pelos exercícios compostos.</li>
                    <li>• Respeite seu descanso entre as séries.</li>
                    <li>• Mantenha a execução correta.</li>
                    <li>• Progresso é consistência!</li>
                  </ul>
                </div>

                {/* Info note */}
                <div className="flex items-start gap-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl px-3 py-2.5">
                  <Info size={13} className="text-indigo-500 dark:text-indigo-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-indigo-600 dark:text-indigo-300">
                    Arraste os exercícios para reordenar. O plano será salvo automaticamente.
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700/60 shrink-0">
              <button
                onClick={() => setPlanModal(null)}
                className="flex-1 flex items-center justify-center gap-1.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-xl py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={14} />
                Cancelar
              </button>
              <button
                onClick={handleSavePlan}
                className="flex-1 flex items-center justify-center gap-1.5 bg-indigo-600 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                <Check size={14} />
                Salvar plano
              </button>
            </div>
          </div>
        </div>
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
              <button onClick={() => { blockStudent(confirmBlock.id); setConfirmBlock(null); }} className="flex-1 bg-red-500 text-white rounded-lg py-2 text-sm font-semibold hover:bg-red-600">Bloquear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
