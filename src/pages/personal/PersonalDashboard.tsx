import { useAuth } from '../../contexts/AuthContext';
import { useApp } from '../../contexts/AppContext';
import { Users, Dumbbell, ClipboardList, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PersonalDashboard() {
  const { user } = useAuth();
  const { students, exercises, workoutSessions, unreadCount } = useApp();
  const navigate = useNavigate();

  const unread = user ? unreadCount(user.id) : 0;

  const stats = [
    {
      label: 'Alunos',
      value: students.length,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      action: () => navigate('/personal/alunos'),
    },
    {
      label: 'Exercícios',
      value: exercises.length,
      icon: Dumbbell,
      color: 'bg-indigo-50 text-indigo-600',
      action: () => navigate('/personal/exercicios'),
    },
    {
      label: 'Treinos realizados',
      value: workoutSessions.length,
      icon: ClipboardList,
      color: 'bg-violet-50 text-violet-600',
      action: () => navigate('/personal/alunos'),
    },
    {
      label: 'Mensagens não lidas',
      value: unread,
      icon: MessageCircle,
      color: 'bg-rose-50 text-rose-600',
      action: () => navigate('/personal/chat'),
    },
  ];

  return (
    <div className="p-5 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
        Olá, {user?.name?.split(' ')[0]} 👋
      </h1>
      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Aqui está um resumo da sua academia.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, action }) => (
          <button
            key={label}
            onClick={action}
            className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm flex flex-col gap-2 text-left hover:shadow-md transition-shadow"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={20} />
            </div>
            <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{label}</div>
          </button>
        ))}
      </div>

      {/* Recent activity */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm p-5">
        <h2 className="font-semibold text-slate-700 dark:text-slate-200 mb-4">Treinos recentes dos alunos</h2>
        {workoutSessions.length === 0 ? (
          <p className="text-slate-400 dark:text-slate-500 text-sm">Nenhum treino registrado ainda.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {[...workoutSessions]
              .sort((a, b) => b.completedAt.localeCompare(a.completedAt))
              .slice(0, 5)
              .map((session) => {
                const student = students.find((s) => s.id === session.studentId);
                return (
                  <li key={session.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{student?.name ?? 'Aluno'}</span>
                      <span className="text-slate-400 mx-2">·</span>
                      <span className="text-slate-600 dark:text-slate-300">{session.label}</span>
                    </div>
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      {new Date(session.completedAt).toLocaleDateString('pt-BR')}
                      {` · ${session.durationMinutes} min`}
                    </div>
                  </li>
                );
              })}
          </ul>
        )}
      </div>
    </div>
  );
}
