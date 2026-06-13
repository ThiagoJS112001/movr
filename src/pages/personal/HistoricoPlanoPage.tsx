import { useState, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStudents } from '../../hooks/useStudents';
import { useExercises } from '../../hooks/useExercises';
import { usePlanArchives } from '../../hooks/useWeeklyPlans';
import { Archive, ChevronDown, ChevronUp, ArrowLeft, Search } from 'lucide-react';
import type { WeeklyPlanArchive } from '../../types';

const DAYS_ORDER = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'];
const DAYS_SHORT: Record<string, string> = {
  segunda: 'Seg', terca: 'Ter', quarta: 'Qua',
  quinta: 'Qui', sexta: 'Sex', sabado: 'Sáb', domingo: 'Dom',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function HistoricoPlanoPage() {
  const { user } = useAuth();
  const { data: weeklyPlanArchives = [] } = usePlanArchives();
  const { data: exercises = [] } = useExercises();
  const { data: students = [] } = useStudents();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedStudentId = searchParams.get('studentId') ?? '';

  const [studentFilter, setStudentFilter] = useState(preselectedStudentId);
  const [nameSearch, setNameSearch]       = useState('');
  const [expandedIds, setExpandedIds]     = useState<Set<string>>(new Set());

  // Only show archives for the logged-in personal
  const myArchives = useMemo(
    () => weeklyPlanArchives.filter((a) => a.personalId === user?.id),
    [weeklyPlanArchives, user],
  );

  const filteredArchives = useMemo(() => {
    return myArchives
      .filter((a) => {
        const matchesStudent = !studentFilter || a.studentId === studentFilter;
        const matchesName    = !nameSearch || a.studentName.toLowerCase().includes(nameSearch.toLowerCase());
        return matchesStudent && matchesName;
      })
      .sort((a, b) => b.archivedAt.localeCompare(a.archivedAt)); // newest first
  }, [myArchives, studentFilter, nameSearch]);

  // Unique students that have at least one archive
  const studentsWithArchives = useMemo(() => {
    const ids = [...new Set(myArchives.map((a) => a.studentId))];
    return ids
      .map((id) => students.find((s) => s.id === id))
      .filter(Boolean) as typeof students;
  }, [myArchives, students]);

  function toggleExpanded(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function getExerciseName(id: string) {
    return exercises.find((e) => e.id === id)?.name ?? id;
  }

  function getExerciseMuscle(id: string) {
    return exercises.find((e) => e.id === id)?.muscleGroup ?? '';
  }

  function getPlanSummary(archive: WeeklyPlanArchive) {
    const activeDays = archive.days.filter((d) => d.label.trim() || d.exerciseIds.length > 0);
    return activeDays;
  }

  return (
    <div className="p-5 max-w-screen-xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/personal/alunos')}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
            <Archive size={18} className="text-amber-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-tight">
              Histórico de Planos
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {myArchives.length} plano{myArchives.length !== 1 ? 's' : ''} arquivado{myArchives.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar por nome do aluno..."
            value={nameSearch}
            onChange={(e) => setNameSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
        <select
          value={studentFilter}
          onChange={(e) => setStudentFilter(e.target.value)}
          className="py-2 px-3 text-sm border border-slate-200 dark:border-white/[0.07] dark:bg-[#0D1025] dark:text-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
        >
          <option value="">Todos os alunos</option>
          {studentsWithArchives.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Empty state */}
      {myArchives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 dark:text-slate-500">
          <Archive size={40} className="mb-3 opacity-30" />
          <p className="text-sm font-medium">Nenhum plano arquivado ainda.</p>
          <p className="text-xs mt-1">
            Abra o plano de um aluno e clique em "Novo plano" para arquivar o atual.
          </p>
        </div>
      )}

      {myArchives.length > 0 && filteredArchives.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <p className="text-sm">Nenhum resultado para os filtros selecionados.</p>
        </div>
      )}

      {/* Archive list */}
      <div className="flex flex-col gap-3">
        {filteredArchives.map((archive) => {
          const expanded   = expandedIds.has(archive.id);
          const summary    = getPlanSummary(archive);
          const totalExs   = archive.days.reduce((acc, d) => acc + d.exerciseIds.length, 0);

          return (
            <div
              key={archive.id}
              className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.07]"
            >
              {/* Card header */}
              <div className="flex items-start gap-3 px-4 py-3">
                <div className="w-9 h-9 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center font-bold text-sm text-amber-600 dark:text-amber-400">
                  {archive.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">
                    {archive.studentName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Arquivado em {formatDate(archive.archivedAt)}
                  </p>
                  {/* Day summary chips */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {DAYS_ORDER.map((day) => {
                      const dayData = archive.days.find((d) => d.dayOfWeek === day);
                      const hasContent = dayData && (dayData.label.trim() || dayData.exerciseIds.length > 0);
                      if (!hasContent) return null;
                      return (
                        <span
                          key={day}
                          className="inline-flex items-center gap-1 text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-full"
                        >
                          <span className="font-semibold">{DAYS_SHORT[day]}:</span>
                          {dayData.label.trim() || `${dayData.exerciseIds.length}ex`}
                        </span>
                      );
                    })}
                    {summary.length === 0 && (
                      <span className="text-xs text-slate-400 dark:text-slate-500 italic">Plano vazio</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {totalExs} ex.
                  </span>
                  <button
                    onClick={() => toggleExpanded(archive.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                  >
                    {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>
              </div>

              {/* Expanded: exercises per day */}
              {expanded && (
                <div className="border-t border-slate-100 dark:border-white/[0.07] px-4 py-3">
                  {DAYS_ORDER.map((day) => {
                    const dayData = archive.days.find((d) => d.dayOfWeek === day);
                    const hasContent = dayData && (dayData.label.trim() || dayData.exerciseIds.length > 0);
                    if (!hasContent) return null;

                    return (
                      <div key={day} className="mb-4 last:mb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-2 py-0.5 rounded-full">
                            {DAYS_SHORT[day]}
                          </span>
                          {dayData.label && (
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                              {dayData.label}
                            </span>
                          )}
                        </div>
                        {dayData.exerciseIds.length > 0 ? (
                          <div className="flex flex-col gap-1 pl-2">
                            {dayData.exerciseIds.map((exId) => (
                              <div key={exId} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-slate-50 dark:bg-slate-700/50">
                                <span className="text-sm text-slate-700 dark:text-slate-200">
                                  {getExerciseName(exId)}
                                </span>
                                <span className="text-xs text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                  {getExerciseMuscle(exId)}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 dark:text-slate-500 pl-2 italic">
                            Sem exercícios â€” apenas rótulo
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
