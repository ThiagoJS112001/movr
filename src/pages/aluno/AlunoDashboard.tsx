import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Dumbbell, ChevronRight, Calendar, CheckCircle2 } from 'lucide-react';

export default function AlunoDashboard() {
  const { user } = useAuth();
  const { assignments, workouts, logs } = useApp();
  const navigate = useNavigate();

  const myAssignments = assignments.filter((a) => a.studentId === user?.id);
  const totalLogs = logs.filter((l) => l.studentId === user?.id).length;

  return (
    <div className="p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        Olá, {user?.name?.split(' ')[0]} 💪
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Aqui estão seus treinos.</p>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
            <Dumbbell size={20} className="text-emerald-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{myAssignments.length}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Treinos atribuídos</div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <CheckCircle2 size={20} className="text-blue-600" />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{totalLogs}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Treinos feitos</div>
          </div>
        </div>
      </div>

      {/* Workout cards */}
      {myAssignments.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <Dumbbell size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum treino atribuído ainda.</p>
          <p className="text-xs mt-1">Aguarde seu personal atribuir um treino.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {myAssignments.map((assignment) => {
            const workout = workouts.find((w) => w.id === assignment.workoutId);
            return (
              <button
                key={assignment.id}
                onClick={() => navigate(`/aluno/treino/${assignment.id}`)}
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-4 flex items-center gap-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Dumbbell size={22} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 dark:text-slate-100 text-sm truncate">
                    {assignment.workoutName}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                    {workout?.exercises.length ?? 0} exercícios
                  </p>
                  {assignment.scheduledDays && assignment.scheduledDays.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Calendar size={11} className="text-slate-400" />
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {assignment.scheduledDays.join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                <ChevronRight size={18} className="text-slate-400 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
