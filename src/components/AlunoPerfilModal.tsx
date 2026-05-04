import { useState, useEffect } from 'react';
import { X, User, Mail, MapPin, Phone, FileText, Camera, Shield, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Props {
  open: boolean;
  onClose: () => void;
}

interface ProfileForm {
  name: string;
  phone: string;
  city: string;
  state: string;
  bio: string;
  birth_date: string;
}

function calcCompletion(form: ProfileForm): number {
  const optional = [form.phone, form.city, form.state, form.bio, form.birth_date];
  const filled = optional.filter(Boolean).length;
  // name always filled → base 1/6
  return Math.round(((1 + filled) / 6) * 100);
}

export default function AlunoPerfilModal({ open, onClose }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm>({
    name: '',
    phone: '',
    city: '',
    state: '',
    bio: '',
    birth_date: '',
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setSuccess(false);
    setError(null);

    supabase
      .from('profiles')
      .select('name, phone, city, state, bio, birth_date')
      .eq('id', user.id)
      .single()
      .then(({ data, error: err }) => {
        if (!err && data) {
          setForm({
            name: data.name ?? '',
            phone: data.phone ?? '',
            city: data.city ?? '',
            state: data.state ?? '',
            bio: data.bio ?? '',
            birth_date: data.birth_date ?? '',
          });
        }
        setLoading(false);
      });
  }, [open, user]);

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setError(null);
    setSuccess(false);

    const { error: err } = await supabase
      .from('profiles')
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        city: form.city.trim() || null,
        state: form.state.trim() || null,
        bio: form.bio.trim() || null,
        birth_date: form.birth_date || null,
      })
      .eq('id', user.id);

    setSaving(false);
    if (err) {
      setError('Erro ao salvar. Tente novamente.');
    } else {
      setSuccess(true);
    }
  }

  if (!open) return null;

  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  const ROLE_LABEL: Record<string, string> = {
    aluno: 'Aluno',
    personal: 'Personal Trainer',
    academia: 'Academia',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-[#13161e] border border-white/8 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/6">
          <h2 className="text-base font-semibold text-white">Meu Perfil</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Completion bar */}
        {!loading && (() => {
          const pct = calcCompletion(form);
          return (
            <div className="px-6 pt-4 pb-0">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-400">Perfil completo</span>
                <span className={`text-[11px] font-semibold ${
                  pct >= 100 ? 'text-emerald-400' : 'text-[#7c5cfc]'
                }`}>{pct}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    pct >= 100 ? 'bg-emerald-400' : 'bg-[#7c5cfc]'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })()}

        <div className="overflow-y-auto flex-1 px-6 py-5 flex flex-col gap-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Avatar + conta */}
              <div className="flex flex-col items-center gap-3">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-[#7c5cfc]/20 border-2 border-[#7c5cfc]/40 flex items-center justify-center text-[#7c5cfc] text-2xl font-bold select-none">
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <button className="absolute -bottom-0.5 -right-0.5 w-7 h-7 bg-[#7c5cfc] rounded-full flex items-center justify-center text-white hover:bg-[#6b4de0] transition-colors shadow-lg">
                    <Camera size={13} />
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-base leading-tight">
                    {user?.name}
                  </p>
                  <span className="inline-flex items-center gap-1.5 mt-1 text-[11px] text-[#7c5cfc] bg-[#7c5cfc]/10 px-2 py-0.5 rounded-full font-medium">
                    <Shield size={10} />
                    {ROLE_LABEL[user?.role ?? ''] ?? user?.role}
                  </span>
                </div>
              </div>

              {/* Conta (somente leitura) */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Informações da conta
                </p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-3 bg-white/4 rounded-xl px-4 py-3">
                    <Mail size={15} className="text-slate-500 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 leading-none mb-0.5">E-mail</p>
                      <p className="text-sm text-slate-300 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos editáveis */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
                  Complete seu perfil
                </p>
                <div className="flex flex-col gap-3">
                  {/* Nome */}
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                      <User size={11} />
                      Nome completo
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Seu nome"
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors"
                    />
                  </div>

                  {/* Telefone */}
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                      <Phone size={11} />
                      Telefone
                    </label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="(00) 00000-0000"
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors"
                    />
                  </div>

                  {/* Cidade + Estado */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                        <MapPin size={11} />
                        Cidade
                      </label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => setForm({ ...form, city: e.target.value })}
                        placeholder="São Paulo"
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400 mb-1 block">
                        Estado
                      </label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => setForm({ ...form, state: e.target.value })}
                        placeholder="SP"
                        maxLength={2}
                        className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors uppercase"
                      />
                    </div>
                  </div>

                  {/* Data de nascimento */}
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                      <Calendar size={11} />
                      Data de nascimento
                    </label>
                    <input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      max={new Date().toISOString().split('T')[0]}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors [color-scheme:dark]"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                      <FileText size={11} />
                      Bio <span className="text-slate-600 ml-auto">{form.bio.length}/200</span>
                    </label>
                    <textarea
                      value={form.bio}
                      onChange={(e) =>
                        setForm({ ...form, bio: e.target.value.slice(0, 200) })
                      }
                      placeholder="Fale um pouco sobre você, seus objetivos..."
                      rows={3}
                      className="w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Feedback */}
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
                  {error}
                </p>
              )}
              {success && (
                <p className="text-xs text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 rounded-xl px-4 py-2.5">
                  Perfil atualizado com sucesso!
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="px-6 py-4 border-t border-white/6 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 border border-white/8 hover:bg-white/5 transition-colors"
            >
              Fechar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#7c5cfc] text-white hover:bg-[#6b4de0] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'Salvando…' : 'Salvar'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
