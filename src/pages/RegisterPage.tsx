import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  ArrowLeft,
  TrendingUp,
  MessageCircle,
  CalendarDays,
  ShieldCheck,
  Headphones,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../lib/constants';

type RegRole = 'personal' | 'aluno' | 'academia';

const PROFILES: {
  role: RegRole;
  label: string;
  description: string;
  icon: typeof User;
  selectedColor: string;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    role: 'personal',
    label: 'Personal Trainer',
    description: 'Gerencie seus alunos, treinos, dietas e avaliações.',
    icon: Dumbbell,
    selectedColor: 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/10 ring-1 ring-indigo-500',
    iconColor: 'text-indigo-500 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-600/20',
  },
  {
    role: 'aluno',
    label: 'Aluno',
    description: 'Acompanhe seus treinos, dietas e sua evolução.',
    icon: User,
    selectedColor: 'border-teal-500 bg-teal-500/10 dark:bg-teal-500/10 ring-1 ring-teal-500',
    iconColor: 'text-teal-500 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-600/20',
  },
  {
    role: 'academia',
    label: 'Academia',
    description: 'Gerencie sua equipe, alunos e resultados.',
    icon: Building2,
    selectedColor: 'border-amber-500 bg-amber-500/10 dark:bg-amber-500/10 ring-1 ring-amber-500',
    iconColor: 'text-amber-500 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-600/20',
  },
];

const RIGHT_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Gestão completa',
    description: 'Gerencie treinos, dietas, avaliações e métricas de forma prática e eficiente.',
    iconClass: 'bg-indigo-100 dark:bg-indigo-600/20 text-indigo-500 dark:text-indigo-400',
  },
  {
    icon: MessageCircle,
    title: 'Comunicação facilitada',
    description: 'Fale com seus alunos ou personal trainer de forma rápida e organizada.',
    iconClass: 'bg-emerald-100 dark:bg-emerald-600/20 text-emerald-500 dark:text-emerald-400',
  },
  {
    icon: CalendarDays,
    title: 'Acompanhamento inteligente',
    description: 'Acompanhe seu progresso com relatórios e gráficos avançados.',
    iconClass: 'bg-amber-100 dark:bg-amber-600/20 text-amber-500 dark:text-amber-400',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados protegidos',
    description: 'Utilizamos criptografia e boas práticas para garantir sua segurança.',
    iconClass: 'bg-slate-200 dark:bg-slate-600/30 text-slate-500 dark:text-slate-400',
  },
];

const inputClass =
  'w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition';

function formatPhone(value: string): string {
  const d = value.replace(/\D/g, '').slice(0, 11);
  if (d.length === 0) return '';
  if (d.length <= 2) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export default function RegisterPage() {
  const { signUp, signUpAcademia } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<RegRole>('personal');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!terms) {
      setError('Você precisa aceitar os Termos de Uso para continuar.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);

    if (role === 'academia') {
      const result = await signUpAcademia(name, email, password);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'Erro ao criar conta.');
        return;
      }
      navigate('/academia/dashboard');
    } else {
      const result = await signUp(name, email, password, role);
      setLoading(false);
      if (!result.success) {
        setError(result.error ?? 'Erro ao criar conta.');
        return;
      }
      const roleMap: Record<string, string> = {
        personal: '/personal/dashboard',
        aluno: '/aluno/dashboard',
      };
      navigate(roleMap[result.role ?? role] ?? '/aluno/dashboard');
    }
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
      <div className="w-full max-w-4xl bg-white dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-[1fr_320px]">

        {/* Left: Register form */}
        <div className="p-8 flex flex-col">
          {/* Back link */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 mb-6 w-fit transition"
          >
            <ArrowLeft size={15} />
            Voltar para o login
          </button>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">Criar sua conta</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Vamos começar! Escolha seu perfil e preencha seus dados.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {/* Profile selector */}
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Escolha seu perfil</p>
              <div className="grid grid-cols-3 gap-3">
                {PROFILES.map((p) => {
                  const Icon = p.icon;
                  const isSelected = role === p.role;
                  return (
                    <button
                      key={p.role}
                      type="button"
                      onClick={() => setRole(p.role)}
                      className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition cursor-pointer ${
                        isSelected
                          ? p.selectedColor
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-transparent'
                      }`}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                      <div className={`p-2.5 rounded-xl ${p.iconBg}`}>
                        <Icon size={22} className={p.iconColor} />
                      </div>
                      <span className="text-xs font-semibold text-slate-800 dark:text-white">{p.label}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 leading-snug">{p.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal data */}
            <div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Dados pessoais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Nome completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Digite seu nome completo"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Digite sua senha"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Confirmar senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      required
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirme sua senha"
                      className={`${inputClass} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                    >
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                {/* Birthdate */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Data de nascimento <span className="text-slate-400">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 dark:bg-slate-900/60 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Telefone <span className="text-slate-400">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="tel"
                      autoComplete="off"
                      inputMode="numeric"
                      maxLength={15}
                      value={phone}
                      onChange={(e) => setPhone(formatPhone(e.target.value))}
                      placeholder="(00) 00000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={terms}
                onChange={(e) => setTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-indigo-500 rounded flex-shrink-0"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Eu concordo com os{' '}
                <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:underline">Termos de Uso</button>
                {' '}e a{' '}
                <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:underline">Política de Privacidade</button>
                .
              </span>
            </label>

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? 'Criando conta…' : 'Criar conta'}
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
              Criar conta com Google
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition"
              >
                Fazer login
              </button>
            </p>
          </form>
        </div>

        {/* Right: Features */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-700/50 p-8 flex flex-col justify-between gap-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">O que você terá com o {APP_NAME}</h3>
            <ul className="space-y-4">
              {RIGHT_FEATURES.map(({ icon: Icon, title, description, iconClass }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 rounded-xl p-2 mt-0.5 ${iconClass}`}>
                    <Icon size={17} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Help card */}
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-violet-100 dark:bg-violet-600/20 rounded-xl p-2">
                <Headphones size={17} className="text-violet-500 dark:text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Precisa de ajuda?</p>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
              Nossa equipe está pronta para te ajudar sempre que precisar.
            </p>
            <button type="button" className="text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition">
              Entrar em contato →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-6 text-xs text-slate-400 dark:text-slate-500 text-center">
        Ao criar sua conta, você concorda com nossos{' '}
        <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition">Termos de Uso</button>
        {' '}e{' '}
        <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 transition">Política de Privacidade</button>
        .
      </p>
    </div>
  );
}
