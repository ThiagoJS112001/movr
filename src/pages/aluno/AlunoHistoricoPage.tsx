import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { CheckCircle2, Clock, Dumbbell, ChevronDown, ChevronUp, Weight } from 'lucide-react';

export default function AlunoHistoricoPage() {
  const { user } = useAuth();
  const { logs, workouts } = useApp();
  const [expanded, setExpanded] = useState<string | null>(null);

  const myLogs = logs
    .filter((l) => l.studentId === user?.id)
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-6">Histórico de treinos</h1>

      {myLogs.length === 0 ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum treino registrado ainda.</p>
          <p className="text-xs mt-1">Conclua um treino para aparecer aqui.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myLogs.map((log) => {
            const isOpen = expanded === log.id;
            const workout = workouts.find((w) => w.id === log.workoutId);
            const hasWeights = log.exerciseWeights && Object.keys(log.exerciseWeights).length > 0;
            return (
              <div key={log.id} className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden">
                {/* Header row */}
                <div
                  className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpanded(isOpen ? null : log.id)}
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={20} className="text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{log.workoutName}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {new Date(log.completedAt).toLocaleDateString('pt-BR', {
                        weekday: 'long',
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {log.durationMinutes && (
                      <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
                        <Clock size={12} />
                        {log.durationMinutes} min
                      </div>
                    )}
                    <button className="text-slate-400">
                      {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                    </button>
                  </div>
                </div>

                {/* Expanded: exercises + weights */}
                {isOpen && workout && (
                  <div className="border-t border-slate-100 dark:border-slate-700 px-4 py-3">
                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                      Exercícios realizados
                    </p>
                    <div className="flex flex-col gap-1.5">
                      {workout.exercises.map((ex) => {
                        const wasCompleted = log.completedExercises.includes(ex.id);
                        const kg = log.exerciseWeights?.[ex.id];
                        return (
                          <div
                            key={ex.id}
                            className={`flex items-center justify-between text-xs rounded-lg px-3 py-1.5 ${
                              wasCompleted
                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-300'
                                : 'bg-slate-50 dark:bg-slate-700/40 text-slate-400 dark:text-slate-500'
                            }`}
                          >
                            <span className="font-medium">{ex.exerciseName}</span>
                            {kg != null ? (
                              <span className="flex items-center gap-1 font-semibold">
                                <Weight size={10} />
                                {kg} kg
                              </span>
                            ) : (
                              wasCompleted && <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    {!hasWeights && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 italic">
                        Sem registro de carga para este treino.
                      </p>
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
