import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  ArrowLeft,
  Lock,
  Send,
  ShieldCheck,
  Headphones,
  ArrowRight,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const HOW_STEPS = [
  {
    number: 1,
    title: 'Informe seu e-mail',
    description: 'Digite o e-mail da sua conta Movr.',
  },
  {
    number: 2,
    title: 'Receba o link',
    description: 'Enviaremos um link seguro para redefinir sua senha.',
  },
  {
    number: 3,
    title: 'Crie uma nova senha',
    description: 'Escolha uma nova senha e pronto! VocÃª jÃ¡ pode acessar sua conta.',
  },
];

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.toLowerCase().trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18] flex items-center justify-center px-4 py-10">
      {/* Card */}
      <div className="w-full max-w-5xl bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">

        {/* â”€â”€ Left panel: Form â”€â”€ */}
        <div className="p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-6">
            {/* Back link */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center gap-1.5 text-sm text-indigo-400 hover:text-indigo-300 w-fit transition"
            >
              <ArrowLeft size={15} />
              Voltar para o login
            </button>

            {!sent ? (
              <>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Esqueci minha senha</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Sem problemas! Informe seu e-mail e enviaremos
                    um link para vocÃª redefinir sua senha.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

                  {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
                  >
                    <Send size={15} />
                    {loading ? 'Enviandoâ€¦' : 'Enviar link de recuperaÃ§Ã£o'}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-xs text-slate-600">ou</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/25 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl py-2.5 text-sm font-medium transition"
                  >
                    <Lock size={15} className="text-slate-400" />
                    Tentar fazer login novamente
                  </button>
                </form>
              </>
            ) : (
              /* Sent confirmation */
              <div className="flex flex-col items-center gap-5 text-center py-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-600/20 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center">
                      <Mail size={30} className="text-indigo-400" />
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                    <svg width="10" height="10" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Verifique seu e-mail</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                    Enviamos um link de recuperaÃ§Ã£o para{' '}
                    <span className="font-semibold text-white">{email}.</span>{' '}
                    Clique no link e siga as instruÃ§Ãµes.
                  </p>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3 text-left">
                  <div className="bg-indigo-600/20 rounded-xl p-2 flex-shrink-0">
                    <ShieldCheck size={16} className="text-indigo-400" />
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Por seguranÃ§a, o link expira em 30 minutos.<br />
                    Caso nÃ£o receba, verifique sua caixa de spam.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition-colors"
                >
                  Voltar para o login
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>

          {/* Help card */}
          <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex items-start gap-3">
            <div className="bg-indigo-600/20 rounded-xl p-2 flex-shrink-0">
              <Headphones size={16} className="text-indigo-400" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-white">Precisa de ajuda?</p>
              <p className="text-xs text-slate-400">Nossa equipe estÃ¡ pronta para te ajudar sempre que precisar.</p>
              <button type="button" className="text-xs text-indigo-400 hover:text-indigo-300 transition mt-1 text-left w-fit">
                Falar com o suporte â†’
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
            Ao continuar, vocÃª concorda com nossos{' '}
            <button type="button" className="text-slate-500 dark:text-slate-500 hover:text-slate-400 transition">Termos de Uso</button>
            {' '}e{' '}
            <button type="button" className="text-slate-500 dark:text-slate-500 hover:text-slate-400 transition">PolÃ­tica de Privacidade</button>
            .
          </p>
        </div>

        {/* â”€â”€ Right panel: Illustration + How it works â”€â”€ */}
        <div className="bg-slate-50 dark:bg-[#0A0D1F] border-l border-slate-200 dark:border-white/[0.07] p-8 flex flex-col items-center justify-center gap-8">
          {/* Envelope illustration */}
          <div className="relative flex items-center justify-center w-56 h-44">
            {/* Glow */}
            <div className="absolute inset-0 rounded-full bg-indigo-600/10 blur-2xl" />
            {/* Floating dots */}
            <div className="absolute top-2 left-6 w-2.5 h-2.5 rounded-full bg-indigo-400/60" />
            <div className="absolute top-8 right-4 w-1.5 h-1.5 rounded-full bg-violet-400/50" />
            <div className="absolute bottom-6 left-4 w-2 h-2 rounded-full bg-indigo-300/40" />
            <div className="absolute bottom-10 right-8 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            {/* Envelope body */}
            <div className="relative z-10">
              {/* Envelope */}
              <div className="w-36 h-28 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-2xl flex flex-col items-center justify-center relative overflow-hidden">
                {/* Envelope flap (triangle) */}
                <div
                  className="absolute top-0 left-0 w-full"
                  style={{
                    borderLeft: '72px solid transparent',
                    borderRight: '72px solid transparent',
                    borderTop: '40px solid rgba(255,255,255,0.15)',
                  }}
                />
                {/* Envelope lines */}
                <div className="mt-6 flex flex-col gap-1.5 w-20">
                  <div className="h-1.5 bg-white/20 rounded-full" />
                  <div className="h-1.5 bg-white/20 rounded-full w-3/4" />
                  <div className="h-1.5 bg-white/20 rounded-full w-1/2" />
                </div>
              </div>
              {/* Lock badge */}
              <div className="absolute -top-3 -right-3 bg-amber-400 rounded-full p-2 shadow-lg">
                <Lock size={14} className="text-amber-900" />
              </div>
              {/* Send badge */}
              <div className="absolute -bottom-3 -right-2 bg-violet-500 rounded-full p-1.5 shadow-lg">
                <Send size={11} className="text-white" />
              </div>
            </div>
          </div>

          {/* How it works */}
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-white/80 mb-1">Como funciona?</p>
            {HOW_STEPS.map((step) => (
              <div key={step.number} className="bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  {step.number}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}

            {/* Security card */}
            <div className="bg-white/5 dark:bg-white/5 border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mt-1">
              <div className="bg-indigo-600/20 rounded-xl p-2 flex-shrink-0">
                <ShieldCheck size={15} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white">Seus dados estÃ£o seguros</p>
                <p className="text-xs text-slate-400 mt-0.5">Utilizamos criptografia e boas prÃ¡ticas para garantir sua seguranÃ§a.</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
