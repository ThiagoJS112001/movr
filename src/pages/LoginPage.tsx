import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Users,
  Target,
  ShieldCheck,
  Moon,
  Sun,
  ArrowRight,
} from 'lucide-react';
import BrandLogo from '../components/ui/BrandLogo';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { ROLE_ROUTES } from '../lib/constants';

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Evolução que se vê',
    description: 'Acompanhe métricas, resultados e performance em tempo real.',
  },
  {
    icon: Users,
    title: 'Conexão que transforma',
    description: 'Conecte personal, alunos e academias em um só lugar.',
  },
  {
    icon: Target,
    title: 'Foco que gera resultado',
    description: 'Planeje treinos, dietas e acompanhamentos com mais clareza e eficiência.',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados estão protegidos',
    description: 'Utilizamos criptografia e boas práticas para garantir a segurança das suas informações.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    navigate(ROLE_ROUTES[result.role ?? ''] ?? '/aluno/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18] flex flex-col items-center justify-center px-4 py-8">

      {/* Card */}
<div className="w-full max-w-5xl bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-2">

        {/* â”€â”€ LEFT: Login form â”€â”€ */}
        <div className="p-10 flex flex-col">

          {/* Logo */}
          <div className="mb-6 shrink-0 flex items-center gap-2.5">
            <img
              src="/images/android-chrome-192x192.png"
              alt="Movr"
              className="w-8 h-8 rounded-lg object-contain"
            />
            <span className="text-white font-bold text-xl tracking-tight">movr.</span>
          </div>

          <div className="flex-1 flex flex-col justify-center">

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
            Bem-vindo de volta! 👋
          </h2>
          <p className="text-slate-400 text-sm mb-7">
            Faça login para continuar{' '}
            <span className="text-indigo-400 font-medium">evoluindo.</span>
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-300">Senha</label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? (
                'Entrando...'
              ) : (
                <>
                  Entrar
                  <ArrowRight size={15} />
                </>
              )}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-600">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-transparent border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Entrar com Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition"
              >
                Criar conta →
              </button>
            </p>
          </form>
          </div>
        </div>

        {/* â”€â”€ RIGHT: Marketing panel â”€â”€ */}
<div className="relative hidden lg:grid grid-cols-[1fr_auto] border-l border-slate-200 dark:border-white/[0.07] bg-slate-50 dark:bg-[#0A0D1F] overflow-hidden">

          {/* Trend line decoration â€” top right */}
          <svg
            className="absolute top-0 right-0 w-72 h-56 opacity-25 pointer-events-none"
            viewBox="0 0 280 200"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M 10 180 C 50 155, 80 130, 110 105 S 160 65, 195 42 S 245 18, 275 8"
              stroke="url(#trendGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="110" cy="105" r="4.5" fill="#818CF8" opacity="0.9"/>
            <circle cx="175" cy="55" r="4.5" fill="#818CF8" opacity="0.9"/>
            <circle cx="275" cy="8" r="7" fill="#EF4444"/>
            <defs>
              <linearGradient id="trendGrad" x1="10" y1="180" x2="275" y2="8" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#4338CA" />
                <stop offset="100%" stopColor="#818CF8" />
              </linearGradient>
            </defs>
          </svg>

          {/* Features column */}
          <div className="flex flex-col justify-between p-8 pr-4">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.18em] text-indigo-400 uppercase mb-4">
                Uma plataforma completa
              </p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white leading-snug mb-2">
                Para treinar,<br />acompanhar<br />
                e{' '}
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  evoluir.
                </span>
              </h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                Tudo o que você precisa para levar<br />
                seus treinos e seus alunos mais longe.
              </p>
            </div>

            <ul className="space-y-4 mt-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 rounded-lg p-2 bg-indigo-600/20 text-indigo-400">
                    <Icon size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Connection diagram column */}
          <div className="flex items-center justify-center p-6 pl-2">
            <div className="relative w-44 h-64">

              {/* Orbital circle */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 176 256" fill="none" aria-hidden="true">
                <ellipse cx="88" cy="128" rx="70" ry="100" stroke="#4338CA" strokeWidth="1" strokeDasharray="5 4" opacity="0.35"/>
              </svg>

              {/* PERSONAL â€” top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#141830] border border-indigo-500/40 flex items-center justify-center shadow-lg">
                  <Users size={16} className="text-indigo-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Personal</span>
              </div>

              {/* Center icon */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-[#141830] border border-indigo-500/30 flex items-center justify-center shadow-xl overflow-hidden p-1.5">
                  <img src="/images/android-chrome-192x192.png" alt="Movr" className="w-full h-full object-contain" />
                </div>
              </div>

              {/* ALUNO â€” bottom left */}
              <div className="absolute top-[62%] left-[16%] -translate-x-1/2 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#141830] border border-violet-500/40 flex items-center justify-center shadow-lg">
                  <Users size={16} className="text-violet-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Aluno</span>
              </div>

              {/* ACADEMIA â€” bottom right */}
              <div className="absolute top-[62%] left-[84%] -translate-x-1/2 flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-[#141830] border border-indigo-500/40 flex items-center justify-center shadow-lg">
                  <ShieldCheck size={16} className="text-indigo-400" />
                </div>
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Academia</span>
              </div>

              {/* Dot on orbital */}
              <div className="absolute bottom-[30%] left-[2px] w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_2px_rgba(99,102,241,0.6)]" />
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="mt-5 flex flex-col items-center gap-2">
        <p className="text-xs text-slate-600 text-center">
          Ao continuar, você concorda com nossos{' '}
          <button type="button" className="text-slate-500 hover:text-slate-300 transition underline underline-offset-2">Termos de Uso</button>
          {' '}e{' '}
          <button type="button" className="text-slate-500 hover:text-slate-300 transition underline underline-offset-2">Política de Privacidade</button>
          .
        </p>
        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-400 transition"
        >
          {theme === 'dark' ? <Moon size={12} /> : <Sun size={12} />}
          Modo {theme === 'dark' ? 'escuro' : 'claro'} ativado
        </button>
      </div>
    </div>
  );
}
