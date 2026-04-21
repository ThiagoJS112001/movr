import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../../contexts/AppContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Video,
  Clock,
  ChevronDown,
  ChevronUp,
  Weight,
} from 'lucide-react';

export default function AlunoTreinoPage() {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { assignments, workouts, logs, addLog } = useApp();

  const assignment = assignments.find((a) => a.id === assignmentId);
  const workout = assignment ? workouts.find((w) => w.id === assignment.workoutId) : null;

  // Last weights from history for pre-filling
  const lastWeights = useMemo<Record<string, number | null>>(() => {
    if (!workout || !user) return {};
    const result: Record<string, number | null> = {};
    for (const ex of workout.exercises) {
      const match = logs
        .filter((l) => l.studentId === user.id && l.exerciseWeights?.[ex.id] != null)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      result[ex.id] = match.length > 0 ? match[0].exerciseWeights![ex.id] : null;
    }
    return result;
  }, [workout, user, logs]);

  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [startTime] = useState(Date.now());

  // Weight inputs: pre-filled with last used weight
  const [weights, setWeights] = useState<Record<string, string>>(() => {
    if (!workout || !user) return {};
    const result: Record<string, string> = {};
    for (const ex of workout.exercises) {
      const match = logs
        .filter((l) => l.studentId === user.id && l.exerciseWeights?.[ex.id] != null)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      const last = match.length > 0 ? match[0].exerciseWeights![ex.id] : null;
      result[ex.id] = last != null ? String(last) : '';
    }
    return result;
  });

  if (!assignment || !workout) {
    return (
      <div className="p-5">
        <p className="text-slate-500">Treino não encontrado.</p>
        <button onClick={() => navigate('/aluno/dashboard')} className="text-emerald-600 text-sm mt-2">
          Voltar
        </button>
      </div>
    );
  }

  function toggleExercise(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleFinish() {
    if (!user) return;
    const durationMinutes = Math.round((Date.now() - startTime) / 60000);
    const exerciseWeights: Record<string, number> = {};
    for (const [id, val] of Object.entries(weights)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) exerciseWeights[id] = n;
    }
    addLog({
      assignmentId: assignment!.id,
      workoutId: workout!.id,
      workoutName: workout!.name,
      studentId: user.id,
      completedAt: new Date().toISOString(),
      completedExercises: Array.from(completed),
      durationMinutes: durationMinutes < 1 ? 1 : durationMinutes,
      exerciseWeights: Object.keys(exerciseWeights).length > 0 ? exerciseWeights : undefined,
    });
    setFinished(true);
  }

  const allDone = workout.exercises.every((e) => completed.has(e.id));

  if (finished) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 dark:bg-emerald-950 p-6 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold text-emerald-700 mb-2">Treino concluído!</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
          Você completou {completed.size} de {workout.exercises.length} exercícios.
        </p>
        <button
          onClick={() => navigate('/aluno/dashboard')}
          className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  return (
    <div className="p-5 max-w-2xl mx-auto pb-24">
      <button
        onClick={() => navigate('/aluno/dashboard')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-emerald-600 mb-4 transition-colors"
      >
        <ArrowLeft size={15} />
        Meus treinos
      </button>

      <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{workout.name}</h1>
      {workout.description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{workout.description}</p>
      )}

      {/* Progress bar */}
      <div className="bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-6">
        <div
          className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${(completed.size / workout.exercises.length) * 100}%` }}
        />
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
        {completed.size}/{workout.exercises.length} concluídos
      </p>

      {/* Exercise list */}
      <div className="flex flex-col gap-3">
        {workout.exercises.map((ex) => {
          const done = completed.has(ex.id);
          const isExpanded = expanded === ex.id;
          const lastKg = lastWeights[ex.id];
          return (
            <div
              key={ex.id}
              className={`bg-white dark:bg-slate-800 rounded-2xl shadow-sm overflow-hidden transition-all ${
                done ? 'opacity-70' : ''
              }`}
            >
              {/* Top row */}
              <div className="flex items-center gap-3 p-4 pb-2">
                <button onClick={() => toggleExercise(ex.id)} className="shrink-0">
                  {done ? (
                    <CheckCircle2 size={24} className="text-emerald-500" />
                  ) : (
                    <Circle size={24} className="text-slate-300" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm ${done ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>
                    {ex.exerciseName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {ex.sets} séries × {ex.reps} reps
                    {ex.weight && ` · ${ex.weight}`}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Clock size={10} className="text-slate-400 dark:text-slate-500" />
                    <p className="text-xs text-slate-400 dark:text-slate-500">Descanso: {ex.restSeconds}s</p>
                  </div>
                </div>
                <button
                  onClick={() => setExpanded((prev) => (prev === ex.id ? null : ex.id))}
                  className="text-slate-400 p-1 shrink-0"
                >
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>
              </div>

              {/* Weight row — always visible */}
              <div className="px-4 pb-3 pl-[52px] flex items-center gap-2">
                {lastKg != null && (
                  <span className="shrink-0 inline-flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg px-2 py-1 font-medium">
                    <Weight size={10} />
                    Último: {lastKg} kg
                  </span>
                )}
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder={lastKg != null ? `${lastKg} kg (anterior)` : 'Peso usado (kg)'}
                  value={weights[ex.id] ?? ''}
                  onChange={(e) => setWeights((p) => ({ ...p, [ex.id]: e.target.value }))}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <span className="text-xs text-slate-400 shrink-0">kg</span>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-700 pt-3">
                  {ex.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2">📝 {ex.notes}</p>
                  )}
                  {ex.imageUrl && (
                    <img
                      src={ex.imageUrl}
                      alt={ex.exerciseName}
                      className="rounded-xl w-full h-40 object-cover mb-2"
                    />
                  )}
                  {ex.videoUrl && (
                    <a
                      href={ex.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-emerald-600 hover:underline"
                    >
                      <Video size={13} />
                      Assistir vídeo demonstrativo
                    </a>
                  )}
                  {!ex.notes && !ex.imageUrl && !ex.videoUrl && (
                    <p className="text-xs text-slate-400 dark:text-slate-500">Sem informações adicionais.</p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Finish button */}
      <div className="fixed bottom-0 left-0 right-0 md:left-56 p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-700">
        <button
          onClick={handleFinish}
          className={`w-full max-w-2xl mx-auto block py-3 rounded-xl font-semibold text-sm transition-colors ${
            allDone
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
          disabled={!allDone}
        >
          {allDone ? '✓ Finalizar treino' : `Complete todos os exercícios (${completed.size}/${workout.exercises.length})`}
        </button>
      </div>
    </div>
  );
}
