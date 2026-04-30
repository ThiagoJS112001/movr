import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  ClipboardList,
  Users,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { APP_NAME } from '../lib/constants';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Gestão inteligente de treinos',
    description: 'Crie, organize e acompanhe treinos de forma prática e eficiente.',
    color: 'indigo',
  },
  {
    icon: ClipboardList,
    title: 'Dietas personalizadas',
    description: 'Monte dietas, planeje refeições e acompanhe a evolução nutricional.',
    color: 'emerald',
  },
  {
    icon: Users,
    title: 'Acompanhamento completo',
    description: 'Relatórios, métricas e evolução em tempo real de todos os seus alunos.',
    color: 'amber',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados estão seguros',
    description: 'Utilizamos criptografia e boas práticas para garantir a segurança das suas informações.',
    color: 'slate',
  },
];

const ICON_COLOR: Record<string, string> = {
  indigo: 'bg-indigo-600/20 text-indigo-400',
  emerald: 'bg-emerald-600/20 text-emerald-400',
  amber: 'bg-amber-600/20 text-amber-400',
  slate: 'bg-slate-600/30 text-slate-400',
};

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
    const roleMap: Record<string, string> = {
      personal: '/personal/dashboard',
      academia: '/academia/dashboard',
      aluno: '/aluno/dashboard',
    };
    navigate(roleMap[result.role ?? ''] ?? '/aluno/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950 flex flex-col items-center justify-center px-4 py-10 transition-colors duration-300">
      {/* Top branding */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-indigo-600 p-3 rounded-2xl mb-3 shadow-lg shadow-indigo-900/30">
          <Dumbbell size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{APP_NAME}</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Personal trainer &amp; aluno, juntos.</p>
      </div>

      {/* Two-panel card */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* Left: Login form */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Entrar na sua conta</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Acesse sua conta para continuar.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember me + Forgot password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-indigo-500 rounded"
                />
                <span className="text-sm text-slate-600 dark:text-slate-300">Lembrar de mim</span>
              </label>
              <button type="button" onClick={() => navigate('/forgot-password')} className="text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition">
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 dark:text-slate-500">ou</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-transparent border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 text-slate-800 dark:text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Entrar com Google
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition"
              >
                Criar conta →
              </button>
            </p>
          </form>
        </div>

        {/* Right: Features promo */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-700/50 p-8 flex flex-col justify-center gap-2">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Uma plataforma completa</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">para personal, alunos e academias.</p>
          <ul className="space-y-3">
            {FEATURES.map(({ icon: Icon, title, description, color }) => (
              <li key={title} className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 rounded-xl p-2 ${ICON_COLOR[color]}`}>
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
        Ao continuar, você concorda com nossos{' '}
        <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition">Termos de Uso</button>
        {' '}e{' '}
        <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition">Política de Privacidade</button>
        .
      </p>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        className="mt-4 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition"
      >
        {theme === 'dark' ? <Moon size={13} /> : <Sun size={13} />}
        Modo {theme === 'dark' ? 'escuro' : 'claro'} ativado
      </button>
    </div>
  );
}
