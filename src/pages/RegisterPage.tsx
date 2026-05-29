import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Phone,
  TrendingUp,
  MessageCircle,
  CalendarDays,
  ShieldCheck,
  Headphones,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import BrandLogo from '../components/ui/BrandLogo';
import { ROLE_ROUTES } from '../lib/constants';

type RegRole = 'personal' | 'aluno' | 'academia';

const PROFILES: {
  role: RegRole;
  label: string;
  description: string;
  icon: typeof User;
  ringColor: string;
  dotColor: string;
  iconColor: string;
  iconBg: string;
}[] = [
  {
    role: 'personal',
    label: 'Personal Trainer',
    description: 'Gerencie seus alunos, treinos, dietas e avaliações.',
    icon: Dumbbell,
    ringColor: 'border-indigo-500 ring-1 ring-indigo-500 bg-indigo-500/10',
    dotColor: 'bg-rose-500',
    iconColor: 'text-indigo-400',
    iconBg: 'bg-indigo-600/20',
  },
  {
    role: 'aluno',
    label: 'Aluno',
    description: 'Acompanhe seus treinos, dietas e sua evolução.',
    icon: User,
    ringColor: 'border-teal-500 ring-1 ring-teal-500 bg-teal-500/10',
    dotColor: 'bg-slate-500',
    iconColor: 'text-teal-400',
    iconBg: 'bg-teal-600/20',
  },
  {
    role: 'academia',
    label: 'Academia',
    description: 'Gerencie sua equipe, alunos e resultados.',
    icon: Building2,
    ringColor: 'border-amber-500 ring-1 ring-amber-500 bg-amber-500/10',
    dotColor: 'bg-slate-500',
    iconColor: 'text-amber-400',
    iconBg: 'bg-amber-600/20',
  },
];

const RIGHT_FEATURES = [
  {
    icon: TrendingUp,
    title: 'Gestão completa',
    description: 'Gerencie treinos, dietas, avaliações e métricas de forma prática e eficiente.',
    iconBg: 'bg-indigo-600/20',
    iconColor: 'text-indigo-400',
  },
  {
    icon: MessageCircle,
    title: 'Comunicação facilitada',
    description: 'Fale com seus alunos ou personal trainer de forma rápida e organizada.',
    iconBg: 'bg-emerald-600/20',
    iconColor: 'text-emerald-400',
  },
  {
    icon: CalendarDays,
    title: 'Acompanhamento inteligente',
    description: 'Acompanhe seu progresso com relatórios e gráficos avançados.',
    iconBg: 'bg-amber-600/20',
    iconColor: 'text-amber-400',
  },
  {
    icon: ShieldCheck,
    title: 'Seus dados protegidos',
    description: 'Utilizamos criptografia e boas práticas para garantir sua segurança.',
    iconBg: 'bg-slate-600/30',
    iconColor: 'text-slate-400',
  },
];

const inputClass =
  'w-full bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition';

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
  const [emailSent, setEmailSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!terms) { setError('Você precisa aceitar os Termos de Uso para continuar.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (password.length < 6) { setError('A senha deve ter pelo menos 6 caracteres.'); return; }
    setLoading(true);

    if (role === 'academia') {
      const result = await signUpAcademia(name, email, password);
      setLoading(false);
      if (!result.success) { setError(result.error ?? 'Erro ao criar conta.'); return; }
      navigate('/academia/dashboard');
    } else {
      const result = await signUp(name, email, password, role);
      setLoading(false);
      if (!result.success) { setError(result.error ?? 'Erro ao criar conta.'); return; }
      if (result.needsEmailConfirmation) { setEmailSent(true); return; }
      navigate(ROLE_ROUTES[result.role ?? role] ?? '/aluno/dashboard');
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#080B18] flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-[#0D1025] border border-white/[0.07] rounded-2xl shadow-2xl p-10 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 flex items-center justify-center">
            <Mail size={32} className="text-indigo-400" />
          </div>
          <h2 className="text-2xl font-bold text-white">Confirme seu e-mail</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            Enviamos um link de confirmação para{' '}
            <span className="font-semibold text-white">{email}</span>.{' '}
            Clique no link para ativar sua conta e depois faça login normalmente.
          </p>
          <p className="text-xs text-slate-600">Não recebeu? Verifique a pasta de spam.</p>
          <button type="button" onClick={() => navigate('/login')} className="mt-2 w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition">
            Ir para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B18] flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-5xl bg-[#0D1025] border border-white/[0.07] rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[1fr_320px]">

        {/* â”€â”€ LEFT: Form â”€â”€ */}
        <div className="p-8 flex flex-col">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6">
            <BrandLogo size={36} />
            <span className="text-xl font-bold text-white tracking-tight">
              movr<span className="text-rose-500">.</span>
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            Vamos começar sua{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              evolução.
            </span>
          </h2>
          <p className="text-slate-400 text-sm mb-7 leading-relaxed">
            Crie sua conta e faça parte da plataforma que conecta treinos, pessoas e resultados.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">

            {/* Profile selector */}
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-3">Escolha seu perfil</p>
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
                        isSelected ? p.ringColor : 'border-white/10 hover:border-white/20 bg-transparent'
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
                        <Icon size={20} className={p.iconColor} />
                      </div>
                      <span className="text-xs font-semibold text-white">{p.label}</span>
                      <span className="text-[11px] text-slate-500 leading-snug">{p.description}</span>
                      <span className={`w-2 h-2 rounded-full mt-1 ${isSelected ? p.dotColor : 'bg-slate-700'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personal data */}
            <div>
              <p className="text-sm font-semibold text-slate-300 mb-3">Dados pessoais</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nome completo</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Digite seu nome completo" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">E-mail</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Digite seu melhor e-mail" className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type={showPassword ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Digite sua senha" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmar senha</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type={showConfirm ? 'text' : 'password'} required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme sua senha" className={`${inputClass} pr-10`} />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition">
                      {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Data de nascimento <span className="text-slate-600">(opcional)</span>
                  </label>
                  <div className="relative">
                    <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="date" value={birthdate} onChange={(e) => setBirthdate(e.target.value)} max={new Date().toISOString().split('T')[0]} className="w-full bg-white/[0.05] border border-white/10 text-white placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition cursor-pointer" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Telefone <span className="text-slate-600">(opcional)</span>
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input type="tel" autoComplete="off" inputMode="numeric" maxLength={15} value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" className={inputClass} />
                  </div>
                </div>
              </div>
            </div>

            {/* Terms */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} className="mt-0.5 w-4 h-4 accent-indigo-500 rounded flex-shrink-0" />
              <span className="text-sm text-slate-400">
                Eu concordo com os{' '}
                <button type="button" className="text-indigo-400 hover:text-indigo-300 transition hover:underline">Termos de Uso</button>
                {' '}e a{' '}
                <button type="button" className="text-indigo-400 hover:text-indigo-300 transition hover:underline">Política de Privacidade</button>
                .
              </span>
            </label>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-slate-600">ou</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Google */}
            <button type="button" className="flex items-center justify-center gap-2 bg-transparent border border-white/10 hover:border-white/25 text-slate-300 hover:text-white rounded-xl py-2.5 text-sm font-medium transition">
              <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continuar com Google
            </button>

            <p className="text-center text-sm text-slate-500">
              Já tem uma conta?{' '}
              <button type="button" onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300 font-medium transition">
                Fazer login
              </button>
            </p>
          </form>
        </div>

        {/* â”€â”€ RIGHT: Info panel â”€â”€ */}
        <div className="relative hidden lg:flex flex-col justify-between border-l border-white/[0.07] bg-[#0A0D1F] p-7 overflow-hidden">

          {/* Features */}
          <div>
            <h3 className="text-sm font-bold text-white mb-5">O que você terá com o Movr</h3>
            <ul className="space-y-4">
              {RIGHT_FEATURES.map(({ icon: Icon, title, description, iconBg, iconColor }) => (
                <li key={title} className="flex items-start gap-3">
                  <div className={`flex-shrink-0 rounded-lg p-2 mt-0.5 ${iconBg}`}>
                    <Icon size={15} className={iconColor} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-0.5">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Trend line */}
          <div className="relative my-3">
            <svg className="w-full h-24 opacity-30" viewBox="0 0 280 96" fill="none" aria-hidden="true">
              <path d="M 10 80 C 50 60, 80 45, 120 30 S 195 12, 240 6" stroke="url(#rg2)" strokeWidth="2" strokeLinecap="round" fill="none"/>
              <circle cx="120" cy="30" r="4" fill="#818CF8"/>
              <circle cx="185" cy="15" r="4" fill="#818CF8"/>
              <circle cx="240" cy="6" r="6" fill="#EF4444"/>
              <defs>
                <linearGradient id="rg2" x1="10" y1="80" x2="240" y2="6" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#4338CA"/>
                  <stop offset="100%" stopColor="#818CF8"/>
                </linearGradient>
              </defs>
            </svg>

            {/* Quote card */}
            <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] px-4 py-3 -mt-1">
              <span className="text-indigo-400 text-2xl font-serif leading-none">"</span>
              <p className="text-sm text-white font-medium leading-relaxed mt-0.5">
                Movimento gera evolução.<br />
                Conexão cria resultados.<br />
                Juntos, vamos mais longe.
              </p>
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block mt-2" />
            </div>
          </div>

          {/* Help card */}
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.07] p-4">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="bg-violet-600/20 rounded-lg p-1.5">
                <Headphones size={15} className="text-violet-400" />
              </div>
              <p className="text-sm font-semibold text-white">Precisa de ajuda?</p>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              Nossa equipe está pronta para te ajudar sempre que precisar.
            </p>
            <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition">
              Entrar em contato â†’
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
