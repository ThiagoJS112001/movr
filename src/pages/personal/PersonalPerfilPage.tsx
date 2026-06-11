import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import {
  User, Instagram, Phone, MapPin, Award, BookOpen,
  Briefcase, Save, Plus, X, Camera,
} from 'lucide-react';

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

const SPECIALTIES_OPTIONS = [
  'Musculação', 'Funcional', 'CrossFit', 'HIIT', 'Pilates',
  'Yoga', 'Corrida', 'Natação', 'Ciclismo', 'Boxe',
  'Artes Marciais', 'Treinamento Esportivo', 'Reabilitação',
  'Emagrecimento', 'Hipertrofia', 'Idosos', 'Gestantes',
];

interface ProfileData {
  name: string;
  bio: string;
  phone: string;
  city: string;
  state: string;
  instagram: string;
  whatsapp: string;
  specialties: string[];
  certifications: string[];
  experienceYears: number | '';
  avatarUrl: string;
}

export default function PersonalPerfilPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [certInput, setCertInput] = useState('');

  const [data, setData] = useState<ProfileData>({
    name: '', bio: '', phone: '', city: '', state: '',
    instagram: '', whatsapp: '', specialties: [],
    certifications: [], experienceYears: '', avatarUrl: '',
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('name, bio, phone, city, state, avatar_url, specialties, certifications, experience_years, instagram, whatsapp')
      .eq('id', user.id)
      .single()
      .then(({ data: d }) => {
        if (d) {
          const row = d as Record<string, unknown>;
          setData({
            name: (row.name as string) ?? '',
            bio: (row.bio as string) ?? '',
            phone: (row.phone as string) ?? '',
            city: (row.city as string) ?? '',
            state: (row.state as string) ?? '',
            instagram: (row.instagram as string) ?? '',
            whatsapp: (row.whatsapp as string) ?? '',
            specialties: (row.specialties as string[]) ?? [],
            certifications: (row.certifications as string[]) ?? [],
            experienceYears: (row.experience_years as number) ?? '',
            avatarUrl: (row.avatar_url as string) ?? '',
          });
          setAvatarPreview((row.avatar_url as string) ?? '');
        }
        setLoading(false);
      });
  }, [user]);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  function toggleSpecialty(s: string) {
    setData((d) => ({
      ...d,
      specialties: d.specialties.includes(s)
        ? d.specialties.filter((x) => x !== s)
        : [...d.specialties, s],
    }));
  }

  function addCert() {
    const t = certInput.trim();
    if (!t) return;
    setData((d) => ({ ...d, certifications: [...d.certifications, t] }));
    setCertInput('');
  }

  function removeCert(i: number) {
    setData((d) => ({ ...d, certifications: d.certifications.filter((_, idx) => idx !== i) }));
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    try {
      let avatarUrl = data.avatarUrl;

      // Upload new avatar if changed
      if (avatarFile) {
        const ext = avatarFile.name.split('.').pop();
        const path = `avatars/${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true });
        if (!uploadErr) {
          const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = urlData.publicUrl;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          name: data.name,
          bio: data.bio,
          phone: data.phone,
          city: data.city,
          state: data.state,
          instagram: data.instagram || null,
          whatsapp: data.whatsapp || null,
          specialties: data.specialties,
          certifications: data.certifications,
          experience_years: data.experienceYears !== '' ? Number(data.experienceYears) : null,
          ...(avatarUrl !== data.avatarUrl ? { avatar_url: avatarUrl } : {}),
        })
        .eq('id', user.id);

      if (error) throw error;
      setData((d) => ({ ...d, avatarUrl }));
      toast.success('Perfil atualizado!');
    } catch {
      toast.error('Erro ao salvar perfil');
    } finally {
      setSaving(false);
    }
  }

  const initials = data.name
    ? data.name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '?';

  if (loading) {
    return (
      <div className="p-5 max-w-screen-xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
          <p className="text-sm text-slate-400 mt-0.5">Informações profissionais visíveis pelos alunos</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Save size={15} />
          {saving ? 'Salvando…' : 'Salvar'}
        </button>
      </div>

      {/* Avatar + Name */}
      <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          <User size={12} className="inline mr-1.5" />Dados Pessoais
        </h2>
        <div className="flex gap-5 items-start">
          <div className="relative shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-violet-600/20 border border-white/10 overflow-hidden flex items-center justify-center">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-violet-400">{initials}</span>
              )}
            </div>
            <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-lg">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-slate-400 mb-1.5">Nome completo</label>
              <input
                type="text"
                value={data.name}
                onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
                className={INPUT_CLS}
                placeholder="Seu nome"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">
                <Phone size={10} className="inline mr-1" />Telefone
              </label>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData((d) => ({ ...d, phone: e.target.value }))}
                className={INPUT_CLS}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  <MapPin size={10} className="inline mr-1" />Cidade
                </label>
                <input
                  type="text"
                  value={data.city}
                  onChange={(e) => setData((d) => ({ ...d, city: e.target.value }))}
                  className={INPUT_CLS}
                  placeholder="São Paulo"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">UF</label>
                <input
                  type="text"
                  value={data.state}
                  onChange={(e) => setData((d) => ({ ...d, state: e.target.value.slice(0,2).toUpperCase() }))}
                  className={INPUT_CLS}
                  placeholder="SP"
                  maxLength={2}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs text-slate-400 mb-1.5">Bio / Apresentação</label>
          <textarea
            value={data.bio}
            onChange={(e) => setData((d) => ({ ...d, bio: e.target.value.slice(0, 400) }))}
            rows={3}
            className={`${INPUT_CLS} resize-none`}
            placeholder="Conte sobre você, sua metodologia, diferenciais…"
          />
          <p className="text-[11px] text-slate-600 mt-1 text-right">{data.bio.length}/400</p>
        </div>
      </div>

      {/* Social */}
      <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          <Instagram size={12} className="inline mr-1.5" />Redes Sociais
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Instagram</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">@</span>
              <input
                type="text"
                value={data.instagram}
                onChange={(e) => setData((d) => ({ ...d, instagram: e.target.value.replace('@','') }))}
                className={`${INPUT_CLS} pl-7`}
                placeholder="seuusuario"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">WhatsApp</label>
            <input
              type="tel"
              value={data.whatsapp}
              onChange={(e) => setData((d) => ({ ...d, whatsapp: e.target.value }))}
              className={INPUT_CLS}
              placeholder="(00) 00000-0000"
            />
          </div>
        </div>
      </div>

      {/* Professional */}
      <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          <Briefcase size={12} className="inline mr-1.5" />Dados Profissionais
        </h2>
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1.5">Anos de experiência</label>
          <input
            type="number"
            min={0}
            max={50}
            value={data.experienceYears}
            onChange={(e) => setData((d) => ({ ...d, experienceYears: e.target.value === '' ? '' : Number(e.target.value) }))}
            className={`${INPUT_CLS} max-w-[120px]`}
            placeholder="5"
          />
        </div>

        {/* Specialties */}
        <div>
          <label className="block text-xs text-slate-400 mb-2">
            <Award size={10} className="inline mr-1" />Especialidades
          </label>
          <div className="flex flex-wrap gap-2">
            {SPECIALTIES_OPTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => toggleSpecialty(s)}
                className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                  ${data.specialties.includes(s)
                    ? 'bg-violet-600 border-violet-600 text-white'
                    : 'border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white'
                  }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-4">
          <BookOpen size={12} className="inline mr-1.5" />Certificações & Cursos
        </h2>
        {data.certifications.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.certifications.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs bg-white/5 border border-white/10 rounded-full px-3 py-1.5 text-slate-300"
              >
                {c}
                <button onClick={() => removeCert(i)} className="text-slate-500 hover:text-red-400 transition-colors">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={certInput}
            onChange={(e) => setCertInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCert(); }}}
            placeholder="Ex: CREF 012345-G/SP, CrossFit Level 2…"
            className={`${INPUT_CLS} flex-1`}
          />
          <button
            onClick={addCert}
            className="shrink-0 px-3 py-2 bg-violet-600/20 border border-violet-500/30 rounded-xl text-violet-400 hover:bg-violet-600/30 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-1.5">Pressione Enter ou + para adicionar</p>
      </div>

      {/* Save button (bottom for mobile) */}
      <div className="sticky bottom-20 md:bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-medium rounded-xl transition-colors shadow-xl"
        >
          <Save size={16} />
          {saving ? 'Salvando…' : 'Salvar Perfil'}
        </button>
      </div>
    </div>
  );
}
