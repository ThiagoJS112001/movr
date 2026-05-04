import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useWorkoutLogs } from '../../hooks/useWorkouts';
import { ChevronDown, ChevronUp, Dumbbell, Clock, CheckCircle2, History } from 'lucide-react';

export default function AlunoHistoricoPage() {
  const { user } = useAuth();
  const { data: logs = [] } = useWorkoutLogs(user?.id ?? '');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const mySessions = [...logs].sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#22c55e]/10 flex items-center justify-center">
            <History size={18} className="text-[#22c55e]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-none">Histórico</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {mySessions.length} treino{mySessions.length !== 1 ? 's' : ''} registrado{mySessions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {mySessions.length === 0 ? (
          <div className="rounded-2xl bg-[#131722] border border-white/5 flex flex-col items-center py-16 text-slate-500">
            <Dumbbell size={36} className="mb-3 opacity-30" />
            <p className="text-sm">Nenhum treino registrado ainda.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {mySessions.map((session) => {
              const isExpanded = expanded.has(session.id);
              const completedCount = session.completedExercises?.length ?? 0;

              return (
                <div
                  key={session.id}
                  className="bg-[#131722] rounded-2xl border border-white/5"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-[#22c55e]/10 flex items-center justify-center">
                      <Dumbbell size={16} className="text-[#22c55e]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {session.workoutName}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                        <span>{new Date(session.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                        {session.durationMinutes != null && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {session.durationMinutes} min
                          </span>
                        )}
                        <span className="flex items-center gap-0.5">
                          <CheckCircle2 size={10} />
                          {completedCount} exercícios
                        </span>
                      </div>
                    </div>

                    {session.notes && (
                      <button
                        onClick={() => toggle(session.id)}
                        className="p-2 rounded-lg text-slate-400 hover:bg-white/5 transition-colors shrink-0"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                    )}
                  </div>

                  {isExpanded && session.notes && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-3">
                      <p className="text-xs text-slate-400">{session.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
