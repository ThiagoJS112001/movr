import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  CheckCircle2,
  MapPin,
  GraduationCap,
  Award,
  MessageCircle,
  AlertCircle,
  Wifi,
  ShieldCheck,
} from 'lucide-react';

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

type TabKey = 'sobre' | 'formacao' | 'avaliacoes' | 'agenda';

interface EducationItem {
  label: string;
  institution?: string;
  year?: string;
  type: 'cref' | 'grad' | 'cert';
  status: 'verified' | 'pending';
}

interface Review {
  id: string;
  authorName: string;
  authorInitials: string;
  authorColor: string;
  rating: number;
  date: string;
  comment: string;
}

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  perLabel: string;
  features: string[];
  highlighted?: boolean;
}

interface PersonalProfile {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  verified: boolean;
  title: string;
  specialties: string[];
  yearsExp: number;
  city: string;
  state: string;
  rating: number;
  reviewCount: number;
  activeStudents: number;
  distanceKm: number;
  modality: 'online' | 'presencial' | 'ambos';
  bioParagraphs: string[];
  education: EducationItem[];
  reviews: Review[];
  ratingDistribution: number[]; // [5â˜…, 4â˜…, 3â˜…, 2â˜…, 1â˜…]
  plans: Plan[];
  unavailableDays: number[];
  availableHours: Record<number, string[]>; // day of month â†’ hours
}

// â”€â”€ Mock data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MOCK_PROFILES: Record<string, PersonalProfile> = {
  '1': {
    id: '1',
    name: 'Rafael Costa',
    initials: 'RC',
    avatarColor: 'from-violet-500 to-indigo-600',
    verified: true,
    title: 'Personal Trainer Â· Nutricionista',
    specialties: ['MusculaÃ§Ã£o', 'NutriÃ§Ã£o', 'Emagrecimento', 'Funcional', 'Hipertrofia'],
    yearsExp: 8,
    city: 'Blumenau',
    state: 'SC',
    rating: 4.9,
    reviewCount: 127,
    activeStudents: 43,
    distanceKm: 1.2,
    modality: 'ambos',
    bioParagraphs: [
      'Sou personal trainer e nutricionista hÃ¡ 8 anos, especializado em hipertrofia, emagrecimento funcional e nutriÃ§Ã£o esportiva. Atendo tanto de forma presencial em Blumenau quanto online para todo o Brasil.',
      'Minha metodologia combina treino periodizado com acompanhamento nutricional individualizado â€” sem fÃ³rmulas genÃ©ricas. Cada aluno tem um plano montado do zero, com ajustes semanais baseados em resultados reais.',
      'JÃ¡ trabalhei com atletas amadores, competidores de fisiculturismo e pessoas que simplesmente querem ter mais saÃºde e disposiÃ§Ã£o no dia a dia.',
    ],
    education: [
      { label: 'CREF 012345-G/SC', type: 'cref', status: 'verified' },
      { label: 'Bacharelado em EducaÃ§Ã£o FÃ­sica', institution: 'FURB â€” Blumenau', year: '2016', type: 'grad', status: 'verified' },
      { label: 'PÃ³s-graduaÃ§Ã£o em NutriÃ§Ã£o Esportiva', institution: 'UNIVALI', year: '2019', type: 'grad', status: 'verified' },
      { label: 'CrossFit Level 1 Trainer', institution: 'CrossFit Inc.', year: '2020', type: 'cert', status: 'verified' },
      { label: 'Treinamento Funcional AvanÃ§ado', institution: 'NASM', year: '2021', type: 'cert', status: 'verified' },
      { label: 'EspecializaÃ§Ã£o em PeriodizaÃ§Ã£o', institution: 'NSCA Brasil', year: '2023', type: 'cert', status: 'pending' },
    ],
    reviews: [
      {
        id: '1',
        authorName: 'Lucas Mendes',
        authorInitials: 'LM',
        authorColor: 'from-emerald-500 to-teal-500',
        rating: 5,
        date: '15 de abril de 2026',
        comment:
          'Rafael Ã© incrÃ­vel! Em 4 meses consegui resultados que nÃ£o tinha obtido em 2 anos treinando sozinho. O acompanhamento nutricional junto com os treinos fez toda a diferenÃ§a.',
      },
      {
        id: '2',
        authorName: 'Fernanda Alves',
        authorInitials: 'FA',
        authorColor: 'from-pink-500 to-rose-500',
        rating: 5,
        date: '3 de abril de 2026',
        comment:
          'Atendimento excelente, muito atencioso e dedicado. Os treinos sÃ£o desafiadores mas sempre adequados ao meu nÃ­vel. Super recomendo!',
      },
      {
        id: '3',
        authorName: 'Carlos Eduardo',
        authorInitials: 'CE',
        authorColor: 'from-orange-500 to-amber-500',
        rating: 4,
        date: '22 de marÃ§o de 2026',
        comment:
          'Muito bom! A metodologia Ã© diferente de tudo que jÃ¡ vi. O Ãºnico ponto a melhorar seria a agilidade nas respostas do chat Ã s vezes.',
      },
    ],
    ratingDistribution: [97, 19, 7, 3, 1],
    plans: [
      {
        id: 'avulso',
        name: 'SessÃ£o avulsa',
        subtitle: '1 sessÃ£o presencial ou online Â· Sem compromisso',
        price: 120,
        perLabel: 'sessÃ£o',
        features: ['1 sessÃ£o de 60 min', 'Plano de treino do dia', 'Feedback pÃ³s-sessÃ£o'],
      },
      {
        id: 'mensal3',
        name: 'Plano mensal Â· 3x/sem',
        subtitle: '12 sessÃµes + treinos + acompanhamento nutricional',
        price: 350,
        perLabel: 'mÃªs',
        features: ['12 sessÃµes/mÃªs', 'Plano de treino completo', 'Dieta personalizada', 'Chat seg a sex'],
      },
      {
        id: 'mensal5',
        name: 'Plano mensal Â· 5x/sem',
        subtitle: '20 sessÃµes + treinos + dieta + acesso ilimitado ao chat',
        price: 520,
        perLabel: 'mÃªs',
        highlighted: true,
        features: ['20 sessÃµes/mÃªs', 'Plano de treino completo', 'Dieta + suplementaÃ§Ã£o', 'Chat ilimitado', 'RelatÃ³rio mensal'],
      },
    ],
    unavailableDays: [4, 5, 11, 12, 25, 26],
    availableHours: {
      2:  ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      3:  ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      6:  ['07:00', '08:00', '09:00'],
      7:  ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      8:  ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      9:  ['07:00', '08:00', '09:00'],
      10: ['08:00', '09:00'],
      13: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      14: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      15: ['07:00', '08:00', '09:00'],
      16: ['07:00', '08:00', '09:00'],
      17: ['08:00', '09:00'],
      18: ['08:00', '09:00'],
      19: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      20: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      21: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      22: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      23: ['07:00', '08:00', '09:00'],
      24: ['08:00', '09:00'],
      27: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      28: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      29: ['07:00', '08:00', '09:00', '18:00', '19:00', '20:00'],
      30: ['07:00', '08:00', '09:00', '18:00'],
      31: ['09:00'],
    },
  },
  '2': {
    id: '2',
    name: 'Ana Martins',
    initials: 'AM',
    avatarColor: 'from-emerald-500 to-teal-600',
    verified: true,
    title: 'Personal Trainer',
    specialties: ['Emagrecimento', 'Funcional', 'Corrida', 'Pilates'],
    yearsExp: 5,
    city: 'Blumenau',
    state: 'SC',
    rating: 4.8,
    reviewCount: 89,
    activeStudents: 28,
    distanceKm: 2.8,
    modality: 'presencial',
    bioParagraphs: [
      'Personal trainer especializada em emagrecimento funcional e corrida de rua. Atendo de forma presencial em Blumenau com foco em resultados sustentÃ¡veis.',
      'Acredito que cada pessoa tem um ritmo Ãºnico. Meu mÃ©todo une treino funcional, reeducaÃ§Ã£o de movimento e periodizaÃ§Ã£o inteligente para garantir evoluÃ§Ã£o constante sem risco de lesÃµes.',
    ],
    education: [
      { label: 'CREF 054321-G/SC', type: 'cref', status: 'verified' },
      { label: 'GraduaÃ§Ã£o em EducaÃ§Ã£o FÃ­sica', institution: 'FURB', year: '2019', type: 'grad', status: 'verified' },
      { label: 'Treinamento Funcional', institution: 'NASM', year: '2021', type: 'cert', status: 'verified' },
      { label: 'Corrida de Rua â€” NÃ­vel AvanÃ§ado', institution: 'CBAt', year: '2023', type: 'cert', status: 'pending' },
    ],
    reviews: [
      {
        id: '1',
        authorName: 'Mariana Costa',
        authorInitials: 'MC',
        authorColor: 'from-violet-500 to-purple-500',
        rating: 5,
        date: '10 de abril de 2026',
        comment: 'Ana Ã© incrÃ­vel! Consegui correr minha primeira meia maratona graÃ§as ao trabalho dela. Muito atenciosa e profissional.',
      },
    ],
    ratingDistribution: [71, 12, 4, 1, 1],
    plans: [
      {
        id: 'avulso',
        name: 'SessÃ£o avulsa',
        subtitle: '1 sessÃ£o presencial Â· Sem compromisso',
        price: 90,
        perLabel: 'sessÃ£o',
        features: ['1 sessÃ£o de 50 min', 'AvaliaÃ§Ã£o fÃ­sica inicial', 'Plano de treino do dia'],
      },
      {
        id: 'mensal3',
        name: 'Plano mensal Â· 3x/sem',
        subtitle: '12 sessÃµes + plano de treino personalizado',
        price: 280,
        perLabel: 'mÃªs',
        highlighted: true,
        features: ['12 sessÃµes/mÃªs', 'Treino personalizado', 'Acompanhamento semanal'],
      },
    ],
    unavailableDays: [3, 4, 10, 11, 17, 18, 24, 25, 31],
    availableHours: {
      2:  ['06:00', '07:00', '08:00', '17:00', '18:00'],
      5:  ['06:00', '07:00', '08:00', '17:00', '18:00'],
      6:  ['07:00', '08:00'],
      7:  ['06:00', '07:00', '08:00', '17:00', '18:00'],
      8:  ['06:00', '07:00', '08:00', '17:00', '18:00'],
      9:  ['07:00', '08:00'],
      12: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      13: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      14: ['07:00', '08:00'],
      15: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      16: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      19: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      20: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      21: ['07:00', '08:00'],
      22: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      23: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      26: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      27: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      28: ['07:00', '08:00'],
      29: ['06:00', '07:00', '08:00', '17:00', '18:00'],
      30: ['06:00', '07:00'],
    },
  },
};

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

// Brazilian week: starts on Sunday
const DAY_ABBRS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StarRow({ count, size = 12 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-700'}
        />
      ))}
    </div>
  );
}

function EducationBadge({ item }: { item: EducationItem }) {
  if (item.status === 'pending') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#0D1025]/40 border border-white/5">
        <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center shrink-0 mt-0.5">
          <Award size={15} className="text-slate-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-slate-300">{item.label}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/25">
              <AlertCircle size={9} />
              Em anÃ¡lise
            </span>
          </div>
          {item.institution && (
            <p className="text-xs text-slate-500 mt-0.5">
              {item.institution}
              {item.year ? ` Â· ${item.year}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (item.type === 'cref') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-[#22c55e]/5 border border-[#22c55e]/20">
        <div className="w-8 h-8 rounded-lg bg-[#22c55e]/15 flex items-center justify-center shrink-0 mt-0.5">
          <ShieldCheck size={15} className="text-[#22c55e]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-white">{item.label}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e]">
              <CheckCircle2 size={9} />
              Verificado pelo Movr
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro obrigatÃ³rio â€” Conselho Federal de EducaÃ§Ã£o FÃ­sica
          </p>
        </div>
      </div>
    );
  }

  if (item.type === 'grad') {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/15">
        <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap size={15} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-white">{item.label}</span>
          {item.institution && (
            <p className="text-xs text-amber-400/70 mt-0.5">
              {item.institution}
              {item.year ? ` Â· ${item.year}` : ''}
            </p>
          )}
        </div>
      </div>
    );
  }

  // cert
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/4 border border-amber-500/10">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <Award size={15} className="text-amber-400" />
      </div>
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-white">{item.label}</span>
        {item.institution && (
          <p className="text-xs text-amber-400/60 mt-0.5">
            {item.institution}
            {item.year ? ` Â· ${item.year}` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Calendar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface CalendarProps {
  profile: PersonalProfile;
  selectedDay: number | null;
  onSelectDay: (day: number) => void;
  normalizedMonth: number;
  normalizedYear: number;
  onPrevMonth: () => void;
  onNextMonth: () => void;
}

function ScheduleCalendar({
  profile,
  selectedDay,
  onSelectDay,
  normalizedMonth,
  normalizedYear,
  onPrevMonth,
  onNextMonth,
}: CalendarProps) {
  // Hardcoded today for mock purposes
  const todayDay = 2;
  const todayMonth = 4; // May (0-indexed)
  const todayYear = 2026;

  const isCurrentMonth = normalizedMonth === todayMonth && normalizedYear === todayYear;
  // Only the mock month (May 2026) has hour data
  const isMockMonth = normalizedMonth === 4 && normalizedYear === 2026;

  const firstDayOfMonth = new Date(normalizedYear, normalizedMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(normalizedYear, normalizedMonth + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDayOfMonth).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  function getDayState(day: number): 'available' | 'unavailable' | 'past' {
    if (!isMockMonth) return 'unavailable';
    if (isCurrentMonth && day < todayDay) return 'past';
    if (profile.unavailableDays.includes(day)) return 'unavailable';
    if (!profile.availableHours[day]) return 'unavailable';
    return 'available';
  }

  return (
    <div>
      {/* Month nav */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onPrevMonth}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronLeft size={14} className="text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-white">
          {MONTH_NAMES[normalizedMonth]} {normalizedYear}
        </span>
        <button
          onClick={onNextMonth}
          className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
        >
          <ChevronRight size={14} className="text-slate-400" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_ABBRS.map((d, i) => (
          <div key={i} className="text-center text-[11px] text-slate-600 font-medium py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} />;

          const state = getDayState(day);
          const isToday = isCurrentMonth && day === todayDay;
          const isSelected = day === selectedDay;

          if (state === 'unavailable' || state === 'past') {
            return (
              <div
                key={idx}
                className={`aspect-square flex items-center justify-center rounded-lg text-xs ${
                  state === 'past' ? 'text-slate-800' : 'text-slate-700'
                }`}
              >
                {day}
              </div>
            );
          }

          return (
            <button
              key={idx}
              onClick={() => onSelectDay(day)}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${
                isSelected
                  ? 'bg-[#7c5cfc] text-white'
                  : isToday
                  ? 'border border-[#7c5cfc] text-[#7c5cfc] hover:bg-[#7c5cfc]/10'
                  : 'text-slate-300 hover:bg-white/8 hover:text-white'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-700" />
          <span className="text-[10px] text-slate-600">IndisponÃ­vel</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-[#7c5cfc]" />
          <span className="text-[10px] text-slate-600">Selecionado</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-[10px] text-slate-600">Livre</span>
        </div>
      </div>
    </div>
  );
}

// â”€â”€ Time slots â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TimeSlots({
  hours,
  selectedHour,
  onSelectHour,
  day,
  monthName,
}: {
  hours: string[];
  selectedHour: string | null;
  onSelectHour: (h: string) => void;
  day: number;
  monthName: string;
}) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-slate-400 mb-2.5">
        HorÃ¡rios disponÃ­veis â€” {day} de {monthName}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {hours.map((h) => (
          <button
            key={h}
            onClick={() => onSelectHour(h)}
            className={`py-2.5 rounded-xl text-sm font-medium transition-colors border ${
              selectedHour === h
                ? 'border-[#7c5cfc] bg-[#7c5cfc]/10 text-[#7c5cfc]'
                : 'border-white/10 text-slate-300 hover:border-white/25 hover:text-white'
            }`}
          >
            {h}
          </button>
        ))}
      </div>
    </div>
  );
}

// â”€â”€ Plan selector â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PlanSelector({
  plans,
  selectedPlanId,
  onSelectPlan,
}: {
  plans: Plan[];
  selectedPlanId: string;
  onSelectPlan: (id: string) => void;
}) {
  return (
    <div className="mt-5 space-y-2">
      <p className="text-sm font-semibold text-white mb-3">Escolha um plano</p>
      {plans.map((plan) => (
        <button
          key={plan.id}
          onClick={() => onSelectPlan(plan.id)}
          className={`w-full text-left p-3.5 rounded-xl border transition-all ${
            selectedPlanId === plan.id
              ? 'border-[#7c5cfc] bg-[#7c5cfc]/8'
              : 'border-white/8 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`text-sm font-semibold leading-tight ${
                selectedPlanId === plan.id ? 'text-white' : 'text-slate-200'
              }`}
            >
              {plan.name}
            </span>
            <span
              className={`text-sm font-bold shrink-0 ${
                selectedPlanId === plan.id ? 'text-[#7c5cfc]' : 'text-slate-300'
              }`}
            >
              R$ {plan.price}
              <span className="text-xs font-normal text-slate-500">/{plan.perLabel}</span>
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">{plan.subtitle}</p>
        </button>
      ))}
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function PersonalPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const profile = MOCK_PROFILES[id ?? ''] ?? MOCK_PROFILES['1'];

  const [activeTab, setActiveTab] = useState<TabKey>('sobre');
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    profile.plans.find((p) => p.highlighted)?.id ?? profile.plans[0].id,
  );
  const [monthOffset, setMonthOffset] = useState(0);

  // Compute the display month/year from monthOffset
  const { normalizedMonth, normalizedYear, displayMonthName } = useMemo(() => {
    const base = new Date(2026, 4 + monthOffset, 1); // May 2026 + offset
    return {
      normalizedMonth: base.getMonth(),
      normalizedYear: base.getFullYear(),
      displayMonthName: MONTH_NAMES[base.getMonth()],
    };
  }, [monthOffset]);

  const selectedPlan = profile.plans.find((p) => p.id === selectedPlanId) ?? profile.plans[0];
  const currentHours = selectedDay ? (profile.availableHours[selectedDay] ?? []) : [];
  const totalReviews = profile.ratingDistribution.reduce((a, b) => a + b, 0);

  function handleSelectDay(day: number) {
    setSelectedDay(day);
    setSelectedHour(null);
  }

  function handleMonthChange(dir: 1 | -1) {
    setMonthOffset((m) => m + dir);
    setSelectedDay(null);
    setSelectedHour(null);
  }

  function handleContratar() {
    navigate(`/aluno/checkout/${profile.id}`, {
      state: {
        planId: selectedPlanId,
        day: selectedDay,
        hour: selectedHour,
        monthName: displayMonthName,
      },
    });
  }

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'sobre',      label: 'Sobre'      },
    { key: 'formacao',   label: 'FormaÃ§Ã£o'   },
    { key: 'avaliacoes', label: 'AvaliaÃ§Ãµes' },
    { key: 'agenda',     label: 'Agenda'     },
  ];

  // â”€â”€ Scheduling panel (shared between right sidebar and Agenda tab) â”€â”€â”€â”€â”€â”€â”€â”€â”€

  const schedulingPanel = (
    <div className="bg-[#131722] border border-white/8 rounded-2xl p-5">
      <p className="text-sm font-semibold text-white">Agendar sessÃ£o</p>
      <p className="text-xs text-slate-500 mt-0.5 mb-4">Selecione data e horÃ¡rio</p>

      <ScheduleCalendar
        profile={profile}
        selectedDay={selectedDay}
        onSelectDay={handleSelectDay}
        normalizedMonth={normalizedMonth}
        normalizedYear={normalizedYear}
        onPrevMonth={() => handleMonthChange(-1)}
        onNextMonth={() => handleMonthChange(1)}
      />

      {selectedDay !== null && currentHours.length > 0 && (
        <TimeSlots
          hours={currentHours}
          selectedHour={selectedHour}
          onSelectHour={setSelectedHour}
          day={selectedDay}
          monthName={displayMonthName}
        />
      )}

      {selectedDay !== null && currentHours.length === 0 && (
        <p className="text-xs text-slate-600 mt-4 text-center">
          Nenhum horÃ¡rio disponÃ­vel para este dia.
        </p>
      )}

      <PlanSelector
        plans={profile.plans}
        selectedPlanId={selectedPlanId}
        onSelectPlan={setSelectedPlanId}
      />

      <button
        onClick={handleContratar}
        className="w-full mt-4 py-3.5 rounded-xl text-sm font-bold bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white transition-colors"
      >
        Contratar â€” R$ {selectedPlan.price}/{selectedPlan.perLabel}
      </button>
    </div>
  );

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="min-h-screen bg-[#080B18] text-white">
      <div className="max-w-5xl mx-auto px-4 pt-5 pb-10">

        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={16} />
            Voltar
          </button>
          <span className="text-slate-700 text-sm">/</span>
          <span className="text-sm text-slate-500">Personais</span>
          <span className="text-slate-700 text-sm">/</span>
          <span className="text-sm text-slate-300">{profile.name}</span>
        </div>

        {/* Profile header card */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-5 mb-4">
          <div className="flex items-start gap-4">
            {/* Avatar with online dot */}
            <div className="relative shrink-0">
              <div
                className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white font-bold text-xl`}
              >
                {profile.initials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-[#22c55e] border-2 border-[#131722]" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-white">{profile.name}</h1>
                {profile.verified && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-[#22c55e]/15 text-[#22c55e] border border-[#22c55e]/20">
                    <CheckCircle2 size={10} />
                    Verificado pelo Movr
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">
                {profile.title} Â· {profile.yearsExp} anos de experiÃªncia Â· {profile.city}, {profile.state}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                {profile.specialties.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 text-[#7c5cfc]"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/5">
            <div className="text-center">
              <p className="text-lg font-bold text-amber-400">{profile.rating.toFixed(1)}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">AvaliaÃ§Ã£o</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-white">{profile.reviewCount}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">AvaliaÃ§Ãµes</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-[#7c5cfc]">{profile.activeStudents}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Alunos ativos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-slate-300">{profile.distanceKm}km</p>
              <p className="text-[10px] text-slate-500 mt-0.5">de distÃ¢ncia</p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={handleContratar}
            className="py-3 rounded-xl text-sm font-bold bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white transition-colors"
          >
            Contratar
          </button>
          <button
            onClick={() => navigate('/aluno/chat')}
            className="py-3 rounded-xl text-sm font-semibold border border-white/12 text-slate-200 hover:bg-white/5 transition-colors flex items-center justify-center gap-2"
          >
            <MessageCircle size={15} />
            Enviar mensagem
          </button>
        </div>

        {/* Two-column layout: tabs left, scheduling right (desktop) */}
        <div className="flex flex-col lg:flex-row gap-5">

          {/* â”€â”€ Left column: tabs + content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="flex-1 min-w-0">
            {/* Tab nav */}
            <div className="flex border-b border-white/8 mb-5">
              {TABS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === key
                      ? 'border-[#7c5cfc] text-white'
                      : 'border-transparent text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* â”€â”€ Tab: Sobre â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'sobre' && (
              <div className="space-y-4">
                <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-base font-bold text-white mb-4">Sobre mim</h3>
                  <div className="space-y-3">
                    {profile.bioParagraphs.map((para, i) => (
                      <p key={i} className="text-sm text-slate-300 leading-relaxed">
                        {para}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Modalidade de atendimento</h3>
                  <div className="flex flex-wrap gap-2">
                    {(profile.modality === 'presencial' || profile.modality === 'ambos') && (
                      <span className="flex items-center gap-1.5 text-xs text-slate-300 bg-white/5 border border-white/8 px-3 py-1.5 rounded-lg">
                        <MapPin size={12} className="text-slate-500" />
                        Presencial â€” {profile.city}, {profile.state}
                      </span>
                    )}
                    {(profile.modality === 'online' || profile.modality === 'ambos') && (
                      <span className="flex items-center gap-1.5 text-xs text-[#7c5cfc] bg-[#7c5cfc]/8 border border-[#7c5cfc]/20 px-3 py-1.5 rounded-lg">
                        <Wifi size={12} />
                        Online â€” Todo o Brasil
                      </span>
                    )}
                  </div>
                </div>

                {/* Scheduling panel â€” mobile only (right col handles desktop) */}
                <div className="lg:hidden">{schedulingPanel}</div>
              </div>
            )}

            {/* â”€â”€ Tab: FormaÃ§Ã£o â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'formacao' && (
              <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
                <h3 className="text-base font-bold text-white mb-5">FormaÃ§Ã£o e CertificaÃ§Ãµes</h3>
                <div className="space-y-3">
                  {profile.education.map((item, i) => (
                    <EducationBadge key={i} item={item} />
                  ))}
                </div>
                <div className="mt-5 pt-4 border-t border-white/5 flex items-start gap-2">
                  <AlertCircle size={13} className="text-slate-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Documentos com badge &ldquo;Em anÃ¡lise&rdquo; foram enviados pelo profissional e aguardam
                    verificaÃ§Ã£o pela equipe Movr. Prazo de atÃ© 48h Ãºteis.
                  </p>
                </div>
              </div>
            )}

            {/* â”€â”€ Tab: AvaliaÃ§Ãµes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'avaliacoes' && (
              <div className="space-y-4">
                {/* Rating overview + bar chart */}
                <div className="bg-[#131722] border border-white/5 rounded-2xl p-5">
                  <div className="flex items-center gap-6">
                    {/* Big score */}
                    <div className="text-center shrink-0">
                      <p className="text-4xl font-bold text-white">{profile.rating.toFixed(1)}</p>
                      <StarRow count={Math.round(profile.rating)} size={14} />
                      <p className="text-xs text-slate-500 mt-1.5">{totalReviews} avaliaÃ§Ãµes</p>
                    </div>

                    {/* Horizontal bar chart */}
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((stars, i) => {
                        const count = profile.ratingDistribution[i];
                        const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                          <div key={stars} className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 w-3 shrink-0 text-right">{stars}</span>
                            <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
                            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-amber-400 rounded-full transition-all"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-600 w-6 text-right shrink-0">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Individual reviews */}
                <div className="space-y-3">
                  {profile.reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-[#131722] border border-white/5 rounded-2xl p-5"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${review.authorColor} flex items-center justify-center text-white text-xs font-bold shrink-0`}
                        >
                          {review.authorInitials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-white">{review.authorName}</p>
                            <span className="text-xs text-slate-600 shrink-0">{review.date}</span>
                          </div>
                          <StarRow count={review.rating} />
                          <p className="text-sm text-slate-300 mt-2 leading-relaxed">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* â”€â”€ Tab: Agenda â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
            {activeTab === 'agenda' && (
              <>
                {/* Mobile: show scheduling panel */}
                <div className="lg:hidden">{schedulingPanel}</div>
                {/* Desktop: right col already has it */}
                <div className="hidden lg:flex items-center justify-center py-12">
                  <p className="text-sm text-slate-600">
                    Use o painel Ã  direita para agendar sua sessÃ£o.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* â”€â”€ Right column: sticky scheduling (desktop only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="hidden lg:block w-80 shrink-0">
            <div className="sticky top-4">{schedulingPanel}</div>
          </div>
        </div>
      </div>

    </div>
  );
}
