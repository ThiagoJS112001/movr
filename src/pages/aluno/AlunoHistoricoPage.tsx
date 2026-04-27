import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { ChevronDown, ChevronUp, Dumbbell, Clock, CheckCircle2 } from 'lucide-react';

export default function AlunoHistoricoPage() {
  const { user } = useAuth();
  const { workoutSessions, exercises } = useApp();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const mySessions = [...workoutSessions]
    .filter((s) => s.studentId === user?.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  function toggle(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-5">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white">Histórico</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          {mySessions.length} treino{mySessions.length !== 1 ? 's' : ''} registrado{mySessions.length !== 1 ? 's' : ''}
        </p>
      </div>

      {mySessions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-slate-400 dark:text-slate-500">
          <Dumbbell size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Nenhum treino registrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {mySessions.map((session) => {
            const isExpanded = expanded.has(session.id);
            const completedExercises = session.completedExerciseIds
              .map((id) => exercises.find((e) => e.id === id))
              .filter(Boolean) as typeof exercises;

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm"
              >
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                    <Dumbbell size={16} className="text-emerald-600 dark:text-emerald-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {session.label}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      <span>{new Date(session.completedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {session.durationMinutes} min
                      </span>
                      <span className="flex items-center gap-0.5">
                        <CheckCircle2 size={10} />
                        {session.completedExerciseIds.length} exercícios
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggle(session.id)}
                    className="p-2 rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                    {completedExercises.length === 0 ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">Nenhum exercício registrado.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {completedExercises.map((ex) => (
                          <div key={ex.id} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                            <span className="text-slate-700 dark:text-slate-200">{ex.name}</span>
                            <span className="text-xs text-slate-400 dark:text-slate-500 ml-auto">{ex.muscleGroup}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
