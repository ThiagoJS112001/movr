import { useState } from 'react';
import {
  Search,
  MapPin,
  Map,
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Award,
  GraduationCap,
  Wifi,
  Calendar,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ── Types ──────────────────────────────────────────────────────────────────────

type Modality = 'online' | 'presencial' | 'ambos';

interface Certification {
  label: string;
  type: 'cref' | 'grad' | 'cert';
}

interface Personal {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  verified: boolean;
  title: string;
  yearsExp: number;
  specialties: string[];
  certifications: Certification[];
  modality: Modality;
  city: string;
  state: string;
  schedule: string;
  priceMonth: number;
  planLabel: string;
  sessionsPerWeek: number;
  rating: number;
  reviewCount: number;
  distanceKm: number;
}

type FilterKey = 'todos' | 'perto' | 'avaliados' | 'online' | 'presencial';
type SpecialtyFilter = string | null;

// ── Mock data ──────────────────────────────────────────────────────────────────

const SPECIALTIES_LIST = [
  'Musculação', 'Hipertrofia', 'Emagrecimento', 'Funcional',
  'Crossfit', 'Corrida', 'Pilates', 'Nutrição', 'Reabilitação',
];

const MOCK_PERSONALS: Personal[] = [
  {
    id: '1',
    name: 'Rafael Costa',
    initials: 'RC',
    avatarColor: 'from-violet-500 to-indigo-600',
    verified: true,
    title: 'Personal Trainer · Nutricionista',
    yearsExp: 8,
    specialties: ['Musculação', 'Nutrição', 'Emagrecimento', 'Funcional'],
    certifications: [
      { label: 'CREF 012345-G/SC', type: 'cref' },
      { label: 'Pós-grad. Nutrição Esportiva · UNIVALI', type: 'grad' },
      { label: 'Cert. Funcional · CrossFit L1', type: 'cert' },
    ],
    modality: 'ambos',
    city: 'Blumenau',
    state: 'SC',
    schedule: 'Atende fins de semana',
    priceMonth: 350,
    planLabel: 'Plano mensal',
    sessionsPerWeek: 3,
    rating: 4.9,
    reviewCount: 127,
    distanceKm: 1.2,
  },
  {
    id: '2',
    name: 'Ana Martins',
    initials: 'AM',
    avatarColor: 'from-emerald-500 to-teal-600',
    verified: true,
    title: 'Personal Trainer',
    yearsExp: 5,
    specialties: ['Emagrecimento', 'Funcional', 'Corrida', 'Pilates'],
    certifications: [
      { label: 'CREF 054321-G/SC', type: 'cref' },
      { label: 'Grad. Ed. Física · FURB', type: 'grad' },
      { label: 'Cert. Treinamento Funcional · NASM', type: 'cert' },
    ],
    modality: 'presencial',
    city: 'Blumenau',
    state: 'SC',
    schedule: 'Seg a Sex',
    priceMonth: 280,
    planLabel: 'Plano mensal',
    sessionsPerWeek: 2,
    rating: 4.8,
    reviewCount: 89,
    distanceKm: 2.8,
  },
  {
    id: '3',
    name: 'Bruno Lima',
    initials: 'BL',
    avatarColor: 'from-orange-500 to-rose-500',
    verified: false,
    title: 'Personal Trainer',
    yearsExp: 3,
    specialties: ['Hipertrofia', 'Crossfit', 'Musculação'],
    certifications: [
      { label: 'CREF 078900-G/SC', type: 'cref' },
      { label: 'CrossFit Level 2 Trainer', type: 'cert' },
    ],
    modality: 'ambos',
    city: 'Blumenau',
    state: 'SC',
    schedule: 'Seg a Sáb',
    priceMonth: 220,
    planLabel: 'Plano mensal',
    sessionsPerWeek: 3,
    rating: 4.6,
    reviewCount: 41,
    distanceKm: 4.1,
  },
  {
    id: '4',
    name: 'Carla Souza',
    initials: 'CS',
    avatarColor: 'from-pink-500 to-purple-600',
    verified: true,
    title: 'Personal Trainer · Fisioterapeuta',
    yearsExp: 10,
    specialties: ['Reabilitação', 'Pilates', 'Funcional'],
    certifications: [
      { label: 'CREF 011223-G/SC', type: 'cref' },
      { label: 'Fisioterapia · UFSC', type: 'grad' },
      { label: 'Pilates Avançado · Stott', type: 'cert' },
    ],
    modality: 'online',
    city: 'Florianópolis',
    state: 'SC',
    schedule: 'Seg, Qua, Sex',
    priceMonth: 400,
    planLabel: 'Plano mensal',
    sessionsPerWeek: 3,
    rating: 5.0,
    reviewCount: 214,
    distanceKm: 12.5,
  },
];

const PRICE_RANGES = [
  { label: 'Até R$ 200', min: 0,   max: 200  },
  { label: 'R$ 200–300', min: 200, max: 300  },
  { label: 'R$ 300–400', min: 300, max: 400  },
  { label: 'Acima de R$ 400', min: 400, max: Infinity },
];

const DISTANCE_OPTIONS = [
  { label: 'Até 2 km',  max: 2   },
  { label: 'Até 5 km',  max: 5   },
  { label: 'Até 10 km', max: 10  },
  { label: 'Qualquer',  max: Infinity },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

function CertBadge({ cert }: { cert: Certification }) {
  if (cert.type === 'cref') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e]">
        <CheckCircle2 size={10} />
        {cert.label}
      </span>
    );
  }
  if (cert.type === 'grad') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400">
        <GraduationCap size={10} />
        {cert.label}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 text-[#7c5cfc]">
      <Award size={10} />
      {cert.label}
    </span>
  );
}

function ModalityDot({ modality }: { modality: Modality }) {
  if (modality === 'ambos') return <span className="w-2 h-2 rounded-full bg-[#22c55e] inline-block" />;
  if (modality === 'online') return <span className="w-2 h-2 rounded-full bg-[#7c5cfc] inline-block" />;
  return <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />;
}

function ModalityLabel({ modality }: { modality: Modality }) {
  if (modality === 'ambos')      return 'Online e presencial';
  if (modality === 'online')     return 'Apenas online';
  return 'Apenas presencial';
}

function AccordionSection({
  label,
  open,
  onToggle,
  children,
}: {
  label: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3.5 bg-[#131722] text-left"
      >
        <span className="text-sm font-medium text-slate-300">{label}</span>
        {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
      </button>
      {open && (
        <div className="bg-[#0f111a] border-t border-white/5 px-4 py-3">
          {children}
        </div>
      )}
    </div>
  );
}

function PersonalCard({
  personal,
  onContact,
  onViewProfile,
}: {
  personal: Personal;
  onContact: (p: Personal) => void;
  onViewProfile: (p: Personal) => void;
}) {
  return (
    <div className="rounded-2xl bg-[#131722] border border-white/5 p-5 space-y-4">
      {/* Top row */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${personal.avatarColor} flex items-center justify-center text-white font-bold text-lg shrink-0`}>
          {personal.initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-white text-base">{personal.name}</h3>
            {personal.verified && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e]">
                <CheckCircle2 size={10} />
                Verificado
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {personal.title} · {personal.yearsExp} anos de experiência
          </p>
          {/* Specialty chips */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {personal.specialties.map((s) => (
              <span key={s} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-slate-300">
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Rating + distance */}
        <div className="text-right shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <Star size={13} fill="#f59e0b" className="text-amber-400" />
            <span className="text-sm font-bold text-white">{personal.rating.toFixed(1)}</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">{personal.reviewCount} avaliações</p>
          <div className="flex items-center gap-1 justify-end mt-1">
            <MapPin size={10} className="text-slate-500" />
            <span className="text-[10px] text-slate-500">{personal.distanceKm} km</span>
          </div>
        </div>
      </div>

      {/* Certifications */}
      <div className="flex flex-wrap gap-1.5">
        {personal.certifications.map((c) => (
          <CertBadge key={c.label} cert={c} />
        ))}
      </div>

      {/* Modality + location + schedule */}
      <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-wrap">
        <ModalityDot modality={personal.modality} />
        <ModalityLabel modality={personal.modality} />
        <span className="text-slate-600">·</span>
        {personal.city}, {personal.state}
        <span className="text-slate-600">·</span>
        <Calendar size={11} />
        {personal.schedule}
        {personal.modality === 'online' || personal.modality === 'ambos' ? (
          <>
            <span className="text-slate-600">·</span>
            <Wifi size={11} className="text-[#7c5cfc]" />
            <span className="text-[#7c5cfc]">Remoto disponível</span>
          </>
        ) : null}
      </div>

      {/* Price + actions */}
      <div className="flex items-end justify-between pt-1 border-t border-white/5">
        <div>
          <span className="text-2xl font-bold text-white">R$ {personal.priceMonth}</span>
          <span className="text-sm text-slate-400">/mês</span>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {personal.planLabel} · {personal.sessionsPerWeek}x/semana
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => onViewProfile(personal)}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-white/10 text-slate-200 hover:bg-white/5 transition-colors"
          >
            Ver perfil
          </button>
          <button
            onClick={() => onContact(personal)}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white transition-colors"
          >
            Entrar em contato
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AlunoAcademiasPage() {
  const navigate = useNavigate();

  const [search, setSearch]               = useState('');
  const [activeFilter, setActiveFilter]   = useState<FilterKey>('todos');
  const [specialtyOpen, setSpecialtyOpen] = useState(false);
  const [priceOpen, setPriceOpen]         = useState(false);
  const [distanceOpen, setDistanceOpen]   = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyFilter>(null);
  const [selectedPrice, setSelectedPrice]   = useState<number | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number>(Infinity);

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: 'todos',      label: 'Todos'          },
    { key: 'perto',      label: 'Perto de mim'   },
    { key: 'avaliados',  label: 'Melhor avaliados'},
    { key: 'online',     label: 'Online'         },
    { key: 'presencial', label: 'Presencial'     },
  ];

  const filtered = MOCK_PERSONALS
    .filter((p) => {
      const q = search.toLowerCase();
      if (q && !p.name.toLowerCase().includes(q) &&
          !p.specialties.some((s) => s.toLowerCase().includes(q)) &&
          !p.city.toLowerCase().includes(q)) return false;

      if (activeFilter === 'online' && p.modality === 'presencial') return false;
      if (activeFilter === 'presencial' && p.modality === 'online')  return false;

      if (selectedSpecialty && !p.specialties.includes(selectedSpecialty)) return false;

      if (selectedPrice !== null) {
        const range = PRICE_RANGES[selectedPrice];
        if (p.priceMonth < range.min || p.priceMonth > range.max) return false;
      }

      if (p.distanceKm > selectedDistance) return false;

      return true;
    })
    .sort((a, b) => {
      if (activeFilter === 'avaliados') return b.rating - a.rating;
      if (activeFilter === 'perto')     return a.distanceKm - b.distanceKm;
      return 0;
    });

  function handleContact(p: Personal) {
    navigate('/aluno/chat');
  }

  function handleViewProfile(p: Personal) {
    navigate(`/aluno/personais/${p.id}`);
  }

  function handleViewProfile(p: Personal) {
    navigate(`/aluno/personais/${p.id}`);
  }

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <div className="max-w-6xl mx-auto px-4 pt-5 pb-6 space-y-5">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Encontrar Personal</h1>
          <p className="text-sm text-slate-500 mt-1">
            Profissionais verificados perto de você, prontos para te acompanhar
          </p>
        </div>

        {/* Search + map */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, especialidade ou modalidade..."
              className="w-full bg-[#131722] border border-white/8 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7c5cfc]/50 transition-colors"
            />
          </div>
          <button className="shrink-0 flex items-center gap-2 bg-[#131722] border border-white/8 hover:border-[#7c5cfc]/40 text-slate-300 hover:text-white text-sm font-medium px-4 py-3 rounded-xl transition-colors">
            <Map size={15} />
            Ver mapa
          </button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                activeFilter === key
                  ? 'bg-white text-[#0d0f14] border-white'
                  : 'bg-transparent border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'
              }`}
            >
              {key === 'perto' && <MapPin size={12} />}
              {label}
            </button>
          ))}
        </div>

        {/* Accordion filters */}
        <div className="space-y-2">
          <AccordionSection label="Especialidade" open={specialtyOpen} onToggle={() => setSpecialtyOpen((v) => !v)}>
            <div className="flex flex-wrap gap-2">
              {SPECIALTIES_LIST.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSpecialty(selectedSpecialty === s ? null : s)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    selectedSpecialty === s
                      ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                      : 'border-white/10 text-slate-400 hover:border-[#7c5cfc]/40 hover:text-slate-200'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection label="Preço / mês" open={priceOpen} onToggle={() => setPriceOpen((v) => !v)}>
            <div className="flex flex-wrap gap-2">
              {PRICE_RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setSelectedPrice(selectedPrice === i ? null : i)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    selectedPrice === i
                      ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                      : 'border-white/10 text-slate-400 hover:border-[#7c5cfc]/40 hover:text-slate-200'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </AccordionSection>

          <AccordionSection label="Distância" open={distanceOpen} onToggle={() => setDistanceOpen((v) => !v)}>
            <div className="flex flex-wrap gap-2">
              {DISTANCE_OPTIONS.map((d) => (
                <button
                  key={d.label}
                  onClick={() => setSelectedDistance(d.max)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                    selectedDistance === d.max
                      ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                      : 'border-white/10 text-slate-400 hover:border-[#7c5cfc]/40 hover:text-slate-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </AccordionSection>
        </div>

        {/* Results count */}
        <p className="text-xs text-slate-500">
          {filtered.length} profissional{filtered.length !== 1 ? 'is' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </p>

        {/* Cards */}
        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-[#131722] border border-white/5 p-12 text-center">
            <Search size={32} className="mx-auto text-slate-700 mb-3" />
            <p className="font-semibold text-slate-300">Nenhum personal encontrado</p>
            <p className="text-sm text-slate-600 mt-1">Tente ajustar os filtros.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((p) => (
              <PersonalCard key={p.id} personal={p} onContact={handleContact} onViewProfile={handleViewProfile} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
