import { useState, useEffect, useRef } from 'react';
import { Building2, Save, Plus, X, Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import { useGymProfile, useUpdateGymProfile, useUploadGymLogo, useUploadGymPhoto } from '../../hooks/useAcademia';
import type { GymHours } from '../../types';

const DAYS: { key: keyof GymHours; label: string }[] = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'Terca-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'Sabado' },
  { key: 'domingo', label: 'Domingo' },
];

const AMENITY_OPTIONS = [
  'Estacionamento', 'Vestiario', 'Sauna', 'Wi-Fi', 'Area Kids',
  'Piscina', 'Lanchonete', 'Loja de suplementos', 'Espaco de alongamento',
];

export default function AcademiaPerfilPage() {
  const { user } = useAuth();
  const { data: gymProfile, isLoading } = useGymProfile();
  const updateProfile = useUpdateGymProfile();
  const uploadLogo = useUploadGymLogo();
  const uploadPhoto = useUploadGymPhoto();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [phone, setPhone] = useState('');
  const [hasPersonal, setHasPersonal] = useState(false);
  const [hasNutrition, setHasNutrition] = useState(false);
  const [amenities, setAmenities] = useState<string[]>([]);
  const [hours, setHours] = useState<GymHours>({});
  const [customAmenity, setCustomAmenity] = useState('');

  // Sync state once profile loads
  useEffect(() => {
    if (!gymProfile) return;
    setName(gymProfile.name ?? '');
    setBio(gymProfile.bio ?? '');
    setCnpj(gymProfile.cnpj ?? '');
    setAddress(gymProfile.address ?? '');
    setCity(gymProfile.city ?? '');
    setState(gymProfile.state ?? '');
    setPhone(gymProfile.phone ?? '');
    setHasPersonal(gymProfile.hasPersonal ?? false);
    setHasNutrition(gymProfile.hasNutrition ?? false);
    setAmenities(gymProfile.amenities ?? []);
    setHours((gymProfile.openingHours as GymHours) ?? {});
  }, [gymProfile]);

  function toggleAmenity(a: string) {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity('');
  }

  async function handleSave() {
    if (!user) return;
    try {
      await updateProfile.mutateAsync({
        name: name.trim(),
        bio: bio.trim() || undefined,
        cnpj: cnpj.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        phone: phone.trim() || undefined,
        hasPersonal,
        hasNutrition,
        amenities,
        openingHours: hours,
      });
      toast.success('Perfil atualizado com sucesso!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao salvar perfil.');
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadLogo.mutateAsync(file);
      toast.success('Logo atualizado!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao enviar logo.');
    }
    e.target.value = '';
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    try {
      for (const file of files) {
        await uploadPhoto.mutateAsync(file);
      }
      toast.success('Foto(s) adicionada(s)!');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao enviar foto.');
    }
    e.target.value = '';
  }

  async function handleRemovePhoto(url: string) {
    if (!gymProfile) return;
    const newPhotos = (gymProfile.photos ?? []).filter((p) => p !== url);
    try {
      await updateProfile.mutateAsync({ photos: newPhotos });
      toast.success('Foto removida.');
    } catch (err: any) {
      toast.error(err?.message ?? 'Erro ao remover foto.');
    }
  }

  const input = 'w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition';
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  if (isLoading) {
    return (
      <div className="p-6 max-w-2xl mx-auto flex items-center justify-center min-h-64">
        <Loader2 size={28} className="animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
          <Building2 size={22} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">Minha Academia</h1>
      </div>

      <div className="space-y-6">
        {/* Logo */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">Logo / Foto de perfil</h2>
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 flex-shrink-0">
              {gymProfile?.avatarUrl ? (
                <img
                  src={gymProfile.avatarUrl}
                  alt="Logo"
                  className="w-20 h-20 rounded-2xl object-cover border border-slate-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700/40 flex items-center justify-center">
                  <Building2 size={28} className="text-violet-400" />
                </div>
              )}
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-violet-600 hover:bg-violet-700 text-white p-1.5 rounded-lg shadow transition-colors"
              >
                <Camera size={12} />
              </button>
            </div>
            <div>
              <p className="text-sm dark:text-slate-200 font-medium">Logo da academia</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                JPG, PNG ou WEBP. Recomendado 400x400px.
              </p>
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadLogo.isPending}
                className="mt-2 text-xs text-violet-500 hover:text-violet-400 font-medium disabled:opacity-60"
              >
                {uploadLogo.isPending ? 'Enviando...' : 'Alterar logo'}
              </button>
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleLogoChange}
            />
          </div>
        </div>

        {/* Basic info */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5 space-y-4">
          <h2 className="font-semibold dark:text-white">Informacoes basicas</h2>

          <div>
            <label className={label}>Nome da academia</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Academia Forca Total" />
          </div>

          <div>
            <label className={label}>Descricao / Bio</label>
            <textarea
              className={`${input} resize-none`}
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Fale sobre sua academia..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={label}>CNPJ</label>
              <input className={input} value={cnpj} onChange={(e) => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div>
              <label className={label}>Telefone</label>
              <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className={label}>Cidade</label>
              <input className={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="Sao Paulo" />
            </div>
            <div>
              <label className={label}>UF</label>
              <input className={input} value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} />
            </div>
          </div>

          <div>
            <label className={label}>Endereco</label>
            <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua das Flores, 123" />
          </div>
        </div>

        {/* Photos */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">Fotos da academia</h2>
          <div className="grid grid-cols-3 gap-3 mb-3">
            {(gymProfile?.photos ?? []).map((url) => (
              <div key={url} className="relative group aspect-square">
                <img
                  src={url}
                  alt=""
                  className="w-full h-full object-cover rounded-xl border border-slate-200 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(url)}
                  className="absolute top-1 right-1 bg-black/60 hover:bg-red-600 text-white p-1 rounded-lg opacity-0 group-hover:opacity-100 transition"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={uploadPhoto.isPending}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-violet-400 dark:hover:border-violet-500 flex flex-col items-center justify-center gap-1 text-slate-400 hover:text-violet-500 transition-colors disabled:opacity-60"
            >
              {uploadPhoto.isPending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Upload size={18} />
              )}
              <span className="text-xs">Adicionar</span>
            </button>
          </div>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handlePhotoChange}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Fotos sao salvas no Supabase Storage (bucket: gym-photos).
          </p>
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">Servicos</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPersonal}
                onChange={(e) => setHasPersonal(e.target.checked)}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-sm dark:text-slate-200">Possui personal trainer</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={hasNutrition}
                onChange={(e) => setHasNutrition(e.target.checked)}
                className="w-4 h-4 accent-violet-500"
              />
              <span className="text-sm dark:text-slate-200">Possui nutricionista</span>
            </label>
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">Comodidades</h2>
          <div className="flex flex-wrap gap-2 mb-3">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  amenities.includes(a)
                    ? 'bg-violet-600 text-white border-violet-600'
                    : 'border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-violet-500'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
          {amenities.filter((a) => !AMENITY_OPTIONS.includes(a)).map((a) => (
            <span key={a} className="inline-flex items-center gap-1 px-3 py-1.5 mr-2 mb-2 rounded-xl text-sm font-medium bg-violet-600 text-white border border-violet-600">
              {a}
              <button onClick={() => setAmenities((prev) => prev.filter((x) => x !== a))} className="ml-1 hover:text-violet-200">
                <X size={12} />
              </button>
            </span>
          ))}
          <div className="flex gap-2 mt-3">
            <input
              className={`${input} flex-1`}
              value={customAmenity}
              onChange={(e) => setCustomAmenity(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustomAmenity()}
              placeholder="Adicionar comodidade personalizada..."
            />
            <button
              type="button"
              onClick={addCustomAmenity}
              className="bg-violet-600 hover:bg-violet-700 text-white px-3 py-2 rounded-xl transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Opening hours */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">Horario de funcionamento</h2>
          <div className="space-y-2">
            {DAYS.map(({ key, label: dayLabel }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-32 text-sm text-slate-600 dark:text-slate-300 flex-shrink-0">{dayLabel}</span>
                <input
                  className={`${input} flex-1`}
                  value={hours[key] ?? ''}
                  onChange={(e) => setHours((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="06:00-22:00 ou Fechado"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={updateProfile.isPending}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          {updateProfile.isPending ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          {updateProfile.isPending ? 'Salvando...' : 'Salvar alteracoes'}
        </button>
      </div>
    </div>
  );
}