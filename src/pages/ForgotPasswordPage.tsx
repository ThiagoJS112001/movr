import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dumbbell,
  Mail,
  ArrowLeft,
  Lock,
  Send,
  ShieldCheck,
  Moon,
  Sun,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';
import { APP_NAME } from '../lib/constants';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

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

        {/* Left: Form */}
        <div className="p-8 flex flex-col justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="flex items-center gap-1.5 text-sm text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 mb-6 w-fit transition"
          >
            <ArrowLeft size={15} />
            Voltar para o login
          </button>

          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Esqueci minha senha</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Sem problemas! Informe seu e-mail e enviaremos<br />
            um link para você redefinir sua senha.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

            {error && (
              <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50 rounded-xl px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || sent}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              <Send size={15} />
              {loading ? 'Enviando…' : sent ? 'Link enviado!' : 'Enviar link de recuperação'}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
              <span className="text-xs text-slate-400 dark:text-slate-500">ou</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-400 text-slate-700 dark:text-white rounded-xl py-2.5 text-sm font-medium transition"
            >
              <Lock size={15} className="text-slate-400" />
              Tentar fazer login novamente
            </button>

            <p className="text-center text-sm text-slate-500 dark:text-slate-400">
              Ainda precisa de ajuda?{' '}
              <button type="button" className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 font-medium transition">
                Fale com nosso suporte →
              </button>
            </p>
          </form>
        </div>

        {/* Right: Illustration / Confirmation */}
        <div className="bg-slate-50 dark:bg-slate-900/50 border-l border-slate-200 dark:border-slate-700/50 p-8 flex flex-col items-center justify-center gap-6">
          {!sent ? (
            /* Decorative illustration */
            <div className="flex flex-col items-center gap-4">
              <div className="relative flex items-center justify-center">
                {/* Outer glow circle */}
                <div className="w-44 h-44 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-indigo-200 dark:bg-indigo-800/60 flex items-center justify-center">
                    {/* Mailbox body */}
                    <div className="relative">
                      <div className="w-20 h-16 bg-indigo-500 dark:bg-indigo-600 rounded-lg flex items-end justify-center pb-1">
                        {/* Envelope slot */}
                        <div className="w-14 h-1.5 bg-indigo-300 dark:bg-indigo-400 rounded-full mb-2" />
                      </div>
                      {/* Flag */}
                      <div className="absolute -top-4 -right-2 flex flex-col items-center">
                        <div className="w-1.5 h-6 bg-slate-400 dark:bg-slate-500 rounded-full" />
                        <div className="absolute top-0 left-1.5 w-5 h-3.5 bg-indigo-400 dark:bg-violet-500 rounded-sm" />
                      </div>
                    </div>
                  </div>
                </div>
                {/* Floating envelope */}
                <div className="absolute -top-3 -right-3 bg-indigo-400 dark:bg-violet-500 rounded-lg p-2 shadow-lg rotate-12">
                  <Mail size={18} className="text-white" />
                </div>
                {/* Floating send dot */}
                <div className="absolute top-2 left-2 w-3 h-3 bg-indigo-300 dark:bg-indigo-400 rounded-full opacity-70" />
                <div className="absolute bottom-4 right-0 w-2 h-2 bg-indigo-200 dark:bg-indigo-500 rounded-full opacity-60" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-slate-700 dark:text-slate-300">Recuperação de senha</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Digite seu e-mail e enviaremos as instruções.</p>
              </div>
            </div>
          ) : (
            /* Confirmation state */
            <div className="flex flex-col items-center gap-5 text-center">
              <div className="relative flex items-center justify-center">
                <div className="w-36 h-36 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full bg-indigo-200 dark:bg-indigo-800/60 flex items-center justify-center">
                    <Mail size={40} className="text-indigo-500 dark:text-indigo-400" />
                  </div>
                </div>
                <div className="absolute -top-2 -right-2 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                  <svg width="12" height="12" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Verifique seu e-mail</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                  Enviamos um link de recuperação para o e-mail{' '}
                  <span className="font-semibold text-slate-800 dark:text-white">{email}.</span>{' '}
                  Clique no link recebido e siga as instruções para criar uma nova senha.
                </p>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-3 text-left">
                <div className="bg-indigo-100 dark:bg-indigo-600/20 rounded-xl p-2 flex-shrink-0">
                  <ShieldCheck size={16} className="text-indigo-500 dark:text-indigo-400" />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Por segurança, o link expira em 30 minutos.<br />
                  Caso não receba, verifique sua caixa de spam.
                </p>
              </div>
            </div>
          )}
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
