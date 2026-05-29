import { ShieldOff } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AcessoBloqueadoPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D1025] rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mx-auto mb-5">
          <ShieldOff size={32} className="text-red-500" />
        </div>

        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
          Acesso bloqueado
        </h1>

        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
          Olá, <span className="font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
          Seu acesso foi temporariamente bloqueado pelo seu personal trainer.
          Entre em contato para regularizar sua situação.
        </p>

        <button
          onClick={logout}
          className="w-full bg-[#0D1025] dark:bg-slate-700 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
