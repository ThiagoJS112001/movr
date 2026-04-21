import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME, LS_USER_KEY } from '../lib/constants';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? 'Erro ao fazer login.');
      return;
    }
    const stored = localStorage.getItem(LS_USER_KEY);
    if (stored) {
      const u = JSON.parse(stored) as { role: string };
      navigate(u.role === 'personal' ? '/personal/dashboard' : '/aluno/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl mb-4 shadow-lg shadow-indigo-900/40">
            <Dumbbell size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">{APP_NAME}</h1>
          <p className="text-slate-400 text-sm mt-1">Personal trainer & aluno, juntos.</p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-6 flex flex-col gap-4"
        >
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-1"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        {/* Demo credentials — collapsible */}
        <div className="mt-4">
          <button
            onClick={() => setShowDemo((v) => !v)}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full text-center"
          >
            {showDemo ? 'Ocultar' : 'Ver'} contas de demonstração
          </button>
          {showDemo && (
            <div className="mt-2 bg-slate-800/60 rounded-xl p-4 text-xs text-slate-400 space-y-1">
              <p className="font-semibold text-slate-300 mb-2">Senha: 123456</p>
              <p>Personal → carlos@personal.com</p>
              <p>Aluno → ana@aluno.com</p>
              <p>Aluno → bruno@aluno.com</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
