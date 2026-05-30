import { useState, useMemo } from 'react';
import { useSessions, useUpdateSessionStatus, useDeleteSession } from '../../hooks/useSessions';
import { useStudents } from '../../hooks/useStudents';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import {
  ChevronLeft, ChevronRight, Plus, Clock, User,
  CheckCircle2, XCircle, Calendar, MoreVertical, Trash2,
} from 'lucide-react';
import type { TrainingSession, SessionStatus } from '../../types';
import NewSessionModal from '../../components/NewSessionModal';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Mon=0 … Sun=6
}

function isoDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

const STATUS_META: Record<SessionStatus, { label: string; color: string; bg: string }> = {
  agendado:  { label: 'Agendado',   color: 'text-blue-400',   bg: 'bg-blue-500/20'   },
  confirmado:{ label: 'Confirmado', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  cancelado: { label: 'Cancelado',  color: 'text-red-400',    bg: 'bg-red-500/20'    },
  concluido: { label: 'Concluído',  color: 'text-slate-400',  bg: 'bg-slate-500/20'  },
};

const WEEKDAYS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const MONTHS_PT = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

// ── Component ─────────────────────────────────────────────────────────────────

export default function PersonalAgendaPage() {
  const { user } = useAuth();
  const { data: sessions = [], isLoading } = useSessions();
  const { data: students = [] } = useStudents();
  const updateStatus = useUpdateSessionStatus();
  const deleteSession = useDeleteSession();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string>(today.toISOString().split('T')[0]);
  const [showModal, setShowModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  // Calendar grid
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay   = getFirstDayOfMonth(year, month);
  const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  // Sessions grouped by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, TrainingSession[]> = {};
    sessions.forEach((s) => {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    });
    return map;
  }, [sessions]);

  const selectedSessions = useMemo(
    () => (sessionsByDate[selectedDate] ?? []).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    [sessionsByDate, selectedDate],
  );

  function prevMonth() {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  }

  async function handleStatusChange(id: string, status: SessionStatus) {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success('Status atualizado');
    } catch {
      toast.error('Erro ao atualizar status');
    }
    setMenuOpenId(null);
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta sessão?')) return;
    try {
      await deleteSession.mutateAsync(id);
      toast.success('Sessão removida');
    } catch {
      toast.error('Erro ao remover sessão');
    }
    setMenuOpenId(null);
  }

  const todayStr = today.toISOString().split('T')[0];

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Agenda</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie suas sessões com alunos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} />
          Nova Sessão
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-4">
        {/* Calendar */}
        <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-4">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="text-sm font-semibold text-white">
              {MONTHS_PT[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday labels */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-center text-[11px] font-medium text-slate-500 py-1">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: totalCells }).map((_, i) => {
              const dayNum = i - firstDay + 1;
              if (dayNum < 1 || dayNum > daysInMonth) return <div key={i} />;
              const dateStr = isoDate(year, month, dayNum);
              const hasSessions = !!sessionsByDate[dateStr]?.length;
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`relative aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-colors
                    ${isSelected ? 'bg-violet-600 text-white' : isToday ? 'bg-violet-600/20 text-violet-300' : 'text-slate-300 hover:bg-white/5'}
                  `}
                >
                  {dayNum}
                  {hasSessions && !isSelected && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-violet-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Month summary */}
          <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-2 gap-2">
            {(['agendado','confirmado','cancelado','concluido'] as SessionStatus[]).map((s) => {
              const count = sessions.filter(
                (sess) => sess.date.startsWith(`${year}-${String(month+1).padStart(2,'0')}`) && sess.status === s,
              ).length;
              const meta = STATUS_META[s];
              return (
                <div key={s} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg ${meta.bg}`}>
                  <span className={`text-xs font-semibold ${meta.color}`}>{count}</span>
                  <span className="text-xs text-slate-400">{meta.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Day detail */}
        <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-violet-400" />
              <span className="text-sm font-semibold text-white">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: '2-digit', month: 'long',
                })}
              </span>
            </div>
            <span className="text-xs text-slate-500">{selectedSessions.length} sessão(ões)</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : selectedSessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar size={32} className="text-slate-600 mb-3" />
              <p className="text-slate-400 text-sm">Nenhuma sessão neste dia</p>
              <button
                onClick={() => setShowModal(true)}
                className="mt-3 text-xs text-violet-400 hover:text-violet-300"
              >
                + Agendar sessão
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((session) => {
                const meta = STATUS_META[session.status];
                return (
                  <div
                    key={session.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-colors group"
                  >
                    <div className="flex flex-col items-center min-w-[52px] pt-0.5">
                      <span className="text-xs font-semibold text-white">{session.startTime}</span>
                      <div className="w-px h-3 bg-white/10 my-0.5" />
                      <span className="text-xs text-slate-500">{session.endTime}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white truncate">{session.title}</span>
                        <span className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <User size={12} className="text-slate-500" />
                        <span className="text-xs text-slate-400">{session.studentName ?? '—'}</span>
                      </div>
                      {session.notes && (
                        <p className="text-xs text-slate-500 mt-1 truncate">{session.notes}</p>
                      )}
                    </div>
                    {/* Actions menu */}
                    <div className="relative">
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === session.id ? null : session.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors"
                      >
                        <MoreVertical size={15} />
                      </button>
                      {menuOpenId === session.id && (
                        <div className="absolute right-0 top-8 z-20 bg-[#141828] border border-white/10 rounded-xl shadow-xl min-w-[160px] py-1">
                          {(['agendado','confirmado','concluido','cancelado'] as SessionStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => handleStatusChange(session.id, s)}
                              className={`w-full text-left px-3 py-2 text-xs hover:bg-white/5 transition-colors flex items-center gap-2
                                ${session.status === s ? STATUS_META[s].color : 'text-slate-300'}`}
                            >
                              {session.status === s && <CheckCircle2 size={12} />}
                              {STATUS_META[s].label}
                            </button>
                          ))}
                          <div className="border-t border-white/5 mt-1 pt-1">
                            <button
                              onClick={() => handleDelete(session.id)}
                              className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                            >
                              <Trash2 size={12} /> Remover
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <NewSessionModal
          defaultDate={selectedDate}
          students={students}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Close menus on outside click */}
      {menuOpenId && (
        <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
      )}
    </div>
  );
}
