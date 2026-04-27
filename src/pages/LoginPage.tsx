import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  ClipboardList,
  MessageSquare,
  BarChart2,
  Building2,
  MapPin,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { APP_NAME, LS_USER_KEY } from '../lib/constants';

const FEATURES = [
  {
    icon: ClipboardList,
    title: 'Gestão completa',
    description: 'Gerencie treinos, dietas e alunos em um só lugar.',
  },
  {
    icon: MessageSquare,
    title: 'Comunicação facilitada',
    description: 'Chat direto com seus alunos de forma rápida e prática.',
  },
  {
    icon: BarChart2,
    title: 'Acompanhamento inteligente',
    description: 'Relatórios e métricas para evoluir junto com seus alunos.',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { registerAcademia } = useApp();
  const navigate = useNavigate();
  // Login state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  // Right-panel tab: 'signup' or 'academia'
  const [rightTab, setRightTab] = useState<'signup' | 'academia'>('signup');
  // Academia registration state
  const [gymName, setGymName] = useState('');
  const [gymEmail, setGymEmail] = useState('');
  const [gymPassword, setGymPassword] = useState('');
  const [gymPasswordConfirm, setGymPasswordConfirm] = useState('');
  const [gymCity, setGymCity] = useState('');
  const [gymState, setGymState] = useState('');
  const [gymRegError, setGymRegError] = useState('');
  const [gymRegLoading, setGymRegLoading] = useState(false);
  const [showGymPassword, setShowGymPassword] = useState(false);

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
      const roleMap: Record<string, string> = {
        personal: '/personal/dashboard',
        academia: '/academia/dashboard',
        aluno: '/aluno/dashboard',
      };
      navigate(roleMap[u.role] ?? '/aluno/dashboard');
    }
  }

  async function handleGymRegister(e: React.FormEvent) {
    e.preventDefault();
    setGymRegError('');
    if (!gymName.trim() || !gymEmail.trim() || !gymPassword) {
      setGymRegError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (gymPassword !== gymPasswordConfirm) {
      setGymRegError('As senhas não coincidem.');
      return;
    }
    if (gymPassword.length < 6) {
      setGymRegError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setGymRegLoading(true);
    registerAcademia(gymName, gymEmail, gymPassword, gymCity || undefined, gymState || undefined);
    const result = await login(gymEmail, gymPassword);
    setGymRegLoading(false);
    if (!result.success) {
      setGymRegError(result.error ?? 'Erro ao fazer login após cadastro.');
      return;
    }
    navigate('/academia/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 flex flex-col items-center justify-center px-4 py-10">
      {/* Top branding */}
      <div className="flex flex-col items-center mb-8">
        <div className="bg-indigo-600 p-3 rounded-2xl mb-3 shadow-lg shadow-indigo-900/50">
          <Dumbbell size={30} className="text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{APP_NAME}</h1>
        <p className="text-slate-400 text-sm mt-1">Personal trainer &amp; aluno, juntos.</p>
      </div>

      {/* Two-panel card */}
      <div className="w-full max-w-3xl bg-slate-800/70 backdrop-blur-sm border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-2">

        {/* ── Left: Login form ── */}
        <div className="p-8 flex flex-col justify-center">
          <h2 className="text-xl font-bold text-white mb-1">Entrar na sua conta</h2>
          <p className="text-slate-400 text-sm mb-6">Bem-vindo de volta! Faça login para continuar.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">E-mail</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition"
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
                <span className="text-sm text-slate-300">Lembrar de mim</span>
              </label>
              <button
                type="button"
                className="text-sm text-indigo-400 hover:text-indigo-300 transition"
              >
                Esqueci minha senha
              </button>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-xs text-slate-500">ou</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Google */}
            <button
              type="button"
              className="flex items-center justify-center gap-2 bg-transparent border border-slate-600 hover:border-slate-400 text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Entrar com Google
            </button>
          </form>
        </div>

        {/* ── Right: Sign-up promo / Academia registration ── */}
        <div className="bg-slate-900/50 border-l border-slate-700/50 p-8 flex flex-col gap-4">
          {/* Tab switcher */}
          <div className="flex gap-1 bg-slate-800 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setRightTab('signup')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                rightTab === 'signup'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Personal / Aluno
            </button>
            <button
              type="button"
              onClick={() => setRightTab('academia')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 ${
                rightTab === 'academia'
                  ? 'bg-violet-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 size={12} />
              Academia
            </button>
          </div>

          {/* Personal/Aluno promo */}
          {rightTab === 'signup' && (
            <div className="flex flex-col items-center justify-center gap-6 flex-1">
              <div className="bg-indigo-600/20 border border-indigo-500/30 p-5 rounded-2xl">
                <Dumbbell size={36} className="text-indigo-400" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-white">Ainda não tem uma conta?</h3>
                <p className="text-slate-400 text-sm mt-1">Crie sua conta e comece agora mesmo.</p>
              </div>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 border border-indigo-500 hover:bg-indigo-500/10 text-indigo-300 hover:text-indigo-200 rounded-xl py-2.5 text-sm font-semibold transition"
              >
                <UserPlus size={15} />
                Criar conta
              </button>
              <ul className="w-full space-y-3">
                {FEATURES.map(({ icon: Icon, title, description }) => (
                  <li key={title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0 bg-indigo-600/20 border border-indigo-500/30 rounded-lg p-1.5">
                      <Icon size={14} className="text-indigo-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{title}</p>
                      <p className="text-xs text-slate-400">{description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Academia registration */}
          {rightTab === 'academia' && (
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
                  <Building2 size={18} className="text-violet-400" />
                </div>
                <h3 className="text-base font-bold text-white">Cadastrar academia</h3>
              </div>
              <p className="text-slate-400 text-xs mb-4">Registre sua academia e alcance novos alunos.</p>

              <form onSubmit={handleGymRegister} className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Nome da academia *</label>
                  <div className="relative">
                    <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      required
                      value={gymName}
                      onChange={(e) => setGymName(e.target.value)}
                      placeholder="Academia Força Total"
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">E-mail *</label>
                  <div className="relative">
                    <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={gymEmail}
                      onChange={(e) => setGymEmail(e.target.value)}
                      placeholder="contato@academia.com"
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Senha *</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showGymPassword ? 'text' : 'password'}
                        required
                        value={gymPassword}
                        onChange={(e) => setGymPassword(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-8 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                      <button type="button" onClick={() => setShowGymPassword((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                        {showGymPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Confirmar *</label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        type={showGymPassword ? 'text' : 'password'}
                        required
                        value={gymPasswordConfirm}
                        onChange={(e) => setGymPasswordConfirm(e.target.value)}
                        placeholder="••••••"
                        className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Cidade</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <input
                        value={gymCity}
                        onChange={(e) => setGymCity(e.target.value)}
                        placeholder="São Paulo"
                        className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">Estado</label>
                    <input
                      value={gymState}
                      onChange={(e) => setGymState(e.target.value)}
                      placeholder="SP"
                      maxLength={2}
                      className="w-full bg-slate-900/60 border border-slate-600 text-white placeholder:text-slate-500 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition"
                    />
                  </div>
                </div>

                {gymRegError && (
                  <p className="text-red-400 text-xs bg-red-900/30 border border-red-700/50 rounded-xl px-3 py-2">
                    {gymRegError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={gymRegLoading}
                  className="bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors mt-1"
                >
                  {gymRegLoading ? 'Cadastrando…' : 'Cadastrar academia'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Demo credentials */}
      <div className="mt-5 w-full max-w-3xl">
        <button
          onClick={() => setShowDemo((v) => !v)}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors w-full text-center"
        >
          {showDemo ? 'Ocultar' : 'Ver'} contas de demonstração
        </button>
        {showDemo && (
          <div className="mt-2 bg-slate-800/60 border border-slate-700/40 rounded-xl p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 mb-2">Senha: 123456</p>
            <p>Personal → carlos@personal.com</p>
            <p>Aluno → ana@aluno.com</p>
            <p>Aluno → bruno@aluno.com</p>
            <p className="mt-2 font-semibold text-violet-400">Academias:</p>
            <p>Academia Força Total → forca@academia.com</p>
            <p>FitLife Club → fitlife@academia.com</p>
            <p>Power House → power@academia.com</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-500 text-center">
        Ao continuar, você concorda com nossos{' '}
        <button type="button" className="text-indigo-400 hover:text-indigo-300 transition">Termos de Uso</button>{' '}
        e{' '}
        <button type="button" className="text-indigo-400 hover:text-indigo-300 transition">Política de Privacidade</button>
      </p>
    </div>
  );
}
