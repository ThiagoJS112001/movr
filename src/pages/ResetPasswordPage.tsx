import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

const PASSWORD_TIPS = [
  'Use no mÃ­nimo 8 caracteres',
  'Misture letras maiÃºsculas e minÃºsculas',
  'Inclua nÃºmeros e sÃ­mbolos',
  'Evite senhas Ã³bvias como "123456"',
];

function StrengthBar({ password }: { password: string }) {
  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;

  const labels = ['', 'Fraca', 'RazoÃ¡vel', 'Boa', 'Forte'];
  const colors = ['', 'bg-red-500', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'];
  const textColors = ['', 'text-red-400', 'text-amber-400', 'text-blue-400', 'text-emerald-400'];

  if (!password) return null;

  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-1 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : 'bg-slate-200 dark:bg-white/10'
            }`}
          />
        ))}
      </div>
      {score > 0 && (
        <span className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</span>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when the user navigates to this page
    // from the reset email link â€” it exchanges the OTP/token automatically.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
        setSessionReady(true);
      }
    });

    // In case the page is loaded after the token has already been exchanged
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirm) {
      setError('As senhas nÃ£o coincidem.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      if (
        err.message.toLowerCase().includes('expired') ||
        err.message.toLowerCase().includes('invalid') ||
        err.message.toLowerCase().includes('token')
      ) {
        setExpired(true);
      } else {
        setError(err.message);
      }
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 3000);
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#080B18] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl bg-white dark:bg-[#0D1025] border border-slate-200 dark:border-white/[0.07] rounded-2xl overflow-hidden shadow-2xl grid grid-cols-1 md:grid-cols-2">

        {/* â”€â”€ Left panel: Form â”€â”€ */}
        <div className="p-8 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-6">

            {/* â”€â”€ Expired state â”€â”€ */}
            {expired ? (
              <div className="flex flex-col items-center gap-5 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle size={28} className="text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Link expirado</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    O link de redefiniÃ§Ã£o expirou. Os links sÃ£o vÃ¡lidos por{' '}
                    <span className="font-semibold text-white">15 minutos</span> por seguranÃ§a.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition-colors"
                >
                  Solicitar novo link
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : done ? (
              /* â”€â”€ Done state â”€â”€ */
              <div className="flex flex-col items-center gap-5 text-center py-8">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Senha redefinida!</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                    Sua nova senha foi salva com sucesso. Redirecionando para o loginâ€¦
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl py-2.5 px-6 text-sm transition-colors"
                >
                  Ir para o login
                  <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              /* â”€â”€ Form â”€â”€ */
              <>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Criar nova senha</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    Escolha uma senha forte para proteger sua conta. O link expira em{' '}
                    <span className="font-semibold text-indigo-400">15 minutos</span>.
                  </p>
                </div>

                {!sessionReady && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertCircle size={15} className="text-amber-400 flex-shrink-0" />
                    <p className="text-xs text-amber-400">
                      Aguardando validaÃ§Ã£o do linkâ€¦ Se vocÃª nÃ£o veio pelo e-mail de recuperaÃ§Ã£o, este acesso nÃ£o Ã© permitido.
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* New password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nova senha</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                    <StrengthBar password={password} />
                  </div>

                  {/* Confirm password */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Confirmar nova senha</label>
                    <div className="relative">
                      <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                      <input
                        type={showConfirm ? 'text' : 'password'}
                        required
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                        className="w-full bg-slate-50 dark:bg-white/[0.05] border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirm((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
                        aria-label={showConfirm ? 'Ocultar senha' : 'Mostrar senha'}
                      >
                        {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    {confirm && password !== confirm && (
                      <p className="text-xs text-red-400 mt-1">As senhas nÃ£o coincidem.</p>
                    )}
                    {confirm && password === confirm && confirm.length >= 8 && (
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Senhas coincidem.
                      </p>
                    )}
                  </div>

                  {error && (
                    <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !sessionReady}
                    className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
                  >
                    {loading ? 'Salvandoâ€¦' : 'Salvar nova senha'}
                    {!loading && <ArrowRight size={15} />}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <p className="text-xs text-slate-400 dark:text-slate-600 text-center">
            Ao continuar, vocÃª concorda com nossos{' '}
            <button type="button" className="text-slate-500 hover:text-slate-400 transition">Termos de Uso</button>
            {' '}e{' '}
            <button type="button" className="text-slate-500 hover:text-slate-400 transition">PolÃ­tica de Privacidade</button>.
          </p>
        </div>

        {/* â”€â”€ Right panel â”€â”€ */}
        <div className="bg-slate-50 dark:bg-[#0A0D1F] border-l border-slate-200 dark:border-white/[0.07] p-8 flex flex-col items-center justify-center gap-8">
          {/* Lock illustration */}
          <div className="relative flex items-center justify-center w-48 h-40">
            <div className="absolute inset-0 rounded-full bg-indigo-600/10 blur-2xl" />
            <div className="absolute top-3 left-8 w-2.5 h-2.5 rounded-full bg-indigo-400/60" />
            <div className="absolute top-6 right-5 w-1.5 h-1.5 rounded-full bg-violet-400/50" />
            <div className="absolute bottom-5 left-5 w-2 h-2 rounded-full bg-indigo-300/40" />
            <div className="absolute bottom-8 right-8 w-1.5 h-1.5 rounded-full bg-blue-400/50" />
            {/* Lock body */}
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-14 h-10 border-4 border-indigo-500 rounded-t-full border-b-0 mb-0" />
              <div className="w-24 h-20 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl shadow-2xl flex items-center justify-center">
                <div className="w-6 h-8 flex flex-col items-center gap-1">
                  <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-white/70" />
                  </div>
                  <div className="w-1.5 h-3 bg-white/40 rounded-full" />
                </div>
              </div>
              <div className="absolute -top-1 -right-2 bg-emerald-500 rounded-full p-1.5 shadow-lg">
                <ShieldCheck size={12} className="text-white" />
              </div>
            </div>
          </div>

          {/* Tips */}
          <div className="w-full flex flex-col gap-3">
            <p className="text-center text-sm font-semibold text-slate-900 dark:text-white/80 mb-1">Dicas para uma senha forte</p>
            {PASSWORD_TIPS.map((tip, i) => (
              <div key={i} className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                  {i + 1}
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300">{tip}</p>
              </div>
            ))}

            {/* Security card */}
            <div className="bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/[0.07] rounded-xl p-3 flex items-center gap-3 mt-1">
              <div className="bg-indigo-600/20 rounded-xl p-2 flex-shrink-0">
                <ShieldCheck size={15} className="text-indigo-400" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">Seus dados estÃ£o seguros</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Utilizamos criptografia e boas prÃ¡ticas para garantir sua seguranÃ§a.</p>
              </div>
              <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
