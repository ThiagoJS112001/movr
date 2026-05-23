import { useState } from 'react';
import { Building2, Save, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../contexts/AuthContext';
import type { GymHours } from '../../types';

const DAYS: { key: keyof GymHours; label: string }[] = [
  { key: 'segunda', label: 'Segunda-feira' },
  { key: 'terca', label: 'TerÃ§a-feira' },
  { key: 'quarta', label: 'Quarta-feira' },
  { key: 'quinta', label: 'Quinta-feira' },
  { key: 'sexta', label: 'Sexta-feira' },
  { key: 'sabado', label: 'SÃ¡bado' },
  { key: 'domingo', label: 'Domingo' },
];

const AMENITY_OPTIONS = [
  'Estacionamento', 'VestiÃ¡rio', 'Sauna', 'Wi-Fi', 'Ãrea Kids',
  'Piscina', 'Lanchonete', 'Loja de suplementos', 'EspaÃ§o de alongamento',
];

export default function AcademiaPerfilPage() {
  const { user } = useAuth();
  function getGymById(_id: string) { return undefined; }
  function updateGym(_id: string, _data: unknown) { toast.error('Perfil da academia ainda nÃ£o disponÃ­vel.'); }

  const gym = user ? getGymById(user.id) : undefined;

  const [name, setName] = useState(gym?.name ?? '');
  const [bio, setBio] = useState(gym?.bio ?? '');
  const [address, setAddress] = useState(gym?.address ?? '');
  const [city, setCity] = useState(gym?.city ?? '');
  const [state, setState] = useState(gym?.state ?? '');
  const [phone, setPhone] = useState(gym?.phone ?? '');
  const [hasPersonal, setHasPersonal] = useState(gym?.hasPersonal ?? false);
  const [hasNutrition, setHasNutrition] = useState(gym?.hasNutrition ?? false);
  const [amenities, setAmenities] = useState<string[]>(gym?.amenities ?? []);
  const [hours, setHours] = useState<GymHours>(gym?.openingHours ?? {});
  const [saving, setSaving] = useState(false);
  const [customAmenity, setCustomAmenity] = useState('');

  function toggleAmenity(a: string) {
    setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  }

  function addCustomAmenity() {
    const trimmed = customAmenity.trim();
    if (!trimmed || amenities.includes(trimmed)) return;
    setAmenities((prev) => [...prev, trimmed]);
    setCustomAmenity('');
  }

  function handleSave() {
    if (!user) return;
    setSaving(true);
    updateGym(user.id, {
      name: name.trim(),
      bio: bio.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim() || undefined,
      phone: phone.trim() || undefined,
      hasPersonal,
      hasNutrition,
      amenities,
      openingHours: hours,
    });
    setSaving(false);
    toast.success('Perfil atualizado com sucesso!');
  }

  const input = 'w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition';
  const label = 'block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1';

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
          <Building2 size={22} className="text-violet-400" />
        </div>
        <h1 className="text-3xl font-bold dark:text-white">Minha Academia</h1>
      </div>

      <div className="space-y-6">
        {/* Basic info */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5 space-y-4">
          <h2 className="font-semibold dark:text-white">InformaÃ§Ãµes bÃ¡sicas</h2>

          <div>
            <label className={label}>Nome da academia</label>
            <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Academia ForÃ§a Total" />
          </div>

          <div>
            <label className={label}>DescriÃ§Ã£o / Bio</label>
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
              <label className={label}>Telefone</label>
              <input className={input} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <label className={label}>Estado (UF)</label>
              <input className={input} value={state} onChange={(e) => setState(e.target.value)} placeholder="SP" maxLength={2} />
            </div>
          </div>

          <div>
            <label className={label}>Cidade</label>
            <input className={input} value={city} onChange={(e) => setCity(e.target.value)} placeholder="SÃ£o Paulo" />
          </div>

          <div>
            <label className={label}>EndereÃ§o</label>
            <input className={input} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rua das Flores, 123" />
          </div>
        </div>

        {/* Services */}
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="font-semibold dark:text-white mb-4">ServiÃ§os</h2>
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
          {/* Custom amenities */}
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
          <h2 className="font-semibold dark:text-white mb-4">HorÃ¡rio de funcionamento</h2>
          <div className="space-y-2">
            {DAYS.map(({ key, label: dayLabel }) => (
              <div key={key} className="flex items-center gap-3">
                <span className="w-32 text-sm text-slate-600 dark:text-slate-300 flex-shrink-0">{dayLabel}</span>
                <input
                  className={`${input} flex-1`}
                  value={hours[key] ?? ''}
                  onChange={(e) => setHours((prev) => ({ ...prev, [key]: e.target.value }))}
                  placeholder="06:00â€“22:00 ou Fechado"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
        >
          <Save size={16} />
          {saving ? 'Salvandoâ€¦' : 'Salvar alteraÃ§Ãµes'}
        </button>
      </div>
    </div>
  );
}
