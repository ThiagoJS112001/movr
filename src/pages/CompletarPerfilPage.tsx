import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  User,
  Phone,
  Calendar,
  MapPin,
  FileText,
  Camera,
  Briefcase,
  GraduationCap,
  Upload,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

// â”€â”€ Constants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SPECIALTIES_LIST = [
  'Musculação',
  'Hipertrofia',
  'Emagrecimento',
  'Funcional',
  'Crossfit',
  'Corrida',
  'Pilates',
  'Reabilitação',
  'Yoga',
  'Mobilidade',
  'Powerlifting',
  'HIIT',
  'Natação',
  'Spinning',
  'Boxe / Muay Thai',
  'Flexibilidade',
  'Calistenia',
  'Triatlo',
];

const MODALITY_OPTIONS = [
  { value: 'presencial' as const, label: 'Presencial', desc: 'Só atendimento presencial' },
  { value: 'online'     as const, label: 'Online',     desc: 'Atendimento remoto/online' },
  { value: 'ambos'      as const, label: 'Ambos',      desc: 'Presencial e online'       },
];

const STEPS_PERSONAL = [
  { id: 1, title: 'Dados pessoais'      },
  { id: 2, title: 'Dados profissionais' },
  { id: 3, title: 'Formação'            },
  { id: 4, title: 'Revisão'             },
] as const;

const STEPS_ALUNO = [
  { id: 1, title: 'Dados pessoais' },
] as const;

// â”€â”€ Types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface S1 {
  name: string;
  phone: string;
  birth_date: string;
  city: string;
  state: string;
  bio: string;
  avatarFile: File | null;
  avatarPreview: string;
}

interface S2 {
  cref: string;
  specialties: string[];
  modality: 'presencial' | 'online' | 'ambos';
  service_radius: number;
  price_session: number;
  price_monthly: number;
}

interface S3 {
  diplomas: Array<{ file: File; name: string }>;
  courses: string[];
  offers_nutrition: boolean;
  nutrition_proof: File | null;
}

type Errors = Partial<Record<string, string>>;

// â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const inputCls =
  'w-full bg-white/5 border border-white/8 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-[#7c5cfc]/60 focus:bg-[#7c5cfc]/5 transition-colors';

const errorInputCls =
  'w-full bg-white/5 border border-red-400/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-red-400/70 transition-colors';

function FieldWrap({
  label,
  icon: Icon,
  error,
  hint,
  children,
}: {
  label: string;
  icon?: React.ComponentType<{ size: number; className?: string }>;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5">
        {Icon && <Icon size={11} className="shrink-0" />}
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-[11px] text-slate-600 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  );
}

// â”€â”€ StepIndicator â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function StepIndicator({
  steps,
  current,
}: {
  steps: readonly { id: number; title: string }[];
  current: number;
}) {
  return (
    <div className="flex items-start justify-center mb-10">
      {steps.map((step, i) => {
        const done   = step.id < current;
        const active = step.id === current;
        return (
          <div key={step.id} className="flex items-start">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all duration-300 ${
                  done
                    ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                    : active
                    ? 'bg-transparent border-[#7c5cfc] text-[#7c5cfc]'
                    : 'bg-transparent border-white/15 text-slate-600'
                }`}
              >
                {done ? <Check size={15} /> : step.id}
              </div>
              <span
                className={`text-[11px] font-medium whitespace-nowrap text-center transition-colors duration-300 ${
                  active ? 'text-white' : done ? 'text-[#7c5cfc]' : 'text-slate-600'
                }`}
              >
                {step.title}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`w-12 sm:w-16 h-0.5 mt-4 mx-1 shrink-0 transition-colors duration-300 ${
                  done ? 'bg-[#7c5cfc]' : 'bg-white/10'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// â”€â”€ Step 1 â€“ Personal data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step1Form({
  data,
  errors,
  onChange,
}: {
  data: S1;
  errors: Errors;
  onChange: (d: Partial<S1>) => void;
}) {
  const avatarRef = useRef<HTMLInputElement>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ avatarFile: file, avatarPreview: preview });
  }

  return (
    <div className="space-y-5">
      {/* Avatar */}
      <div className="flex justify-center mb-2">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-[#7c5cfc]/20 border-2 border-[#7c5cfc]/40 flex items-center justify-center overflow-hidden select-none">
            {data.avatarPreview ? (
              <img src={data.avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={34} className="text-[#7c5cfc]/50" />
            )}
          </div>
          <button
            type="button"
            onClick={() => avatarRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 bg-[#7c5cfc] rounded-full flex items-center justify-center text-white hover:bg-[#6b4de0] transition-colors shadow-lg"
          >
            <Camera size={14} />
          </button>
          <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
      </div>

      {/* Name */}
      <FieldWrap label="Nome completo *" icon={User} error={errors.name}>
        <input
          type="text"
          value={data.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Seu nome completo"
          className={errors.name ? errorInputCls : inputCls}
        />
      </FieldWrap>

      {/* Phone + Birth date */}
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Telefone" icon={Phone} error={errors.phone}>
          <input
            type="tel"
            value={data.phone}
            onChange={(e) => onChange({ phone: e.target.value })}
            placeholder="(00) 00000-0000"
            className={inputCls}
          />
        </FieldWrap>
        <FieldWrap label="Nascimento" icon={Calendar} error={errors.birth_date}>
          <input
            type="date"
            value={data.birth_date}
            onChange={(e) => onChange({ birth_date: e.target.value })}
            max={new Date().toISOString().split('T')[0]}
            className={`${inputCls} [color-scheme:dark]`}
          />
        </FieldWrap>
      </div>

      {/* City + State */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <FieldWrap label="Cidade" icon={MapPin} error={errors.city}>
            <input
              type="text"
              value={data.city}
              onChange={(e) => onChange({ city: e.target.value })}
              placeholder="São Paulo"
              className={inputCls}
            />
          </FieldWrap>
        </div>
        <FieldWrap label="Estado" error={errors.state}>
          <input
            type="text"
            value={data.state}
            onChange={(e) => onChange({ state: e.target.value.slice(0, 2).toUpperCase() })}
            placeholder="SP"
            maxLength={2}
            className={`${inputCls} uppercase`}
          />
        </FieldWrap>
      </div>

      {/* Bio */}
      <FieldWrap label="Bio" icon={FileText} error={errors.bio}>
        <textarea
          value={data.bio}
          onChange={(e) => onChange({ bio: e.target.value.slice(0, 300) })}
          placeholder="Conte um pouco sobre você, seus objetivos..."
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <p className="text-[11px] text-slate-600 mt-1 text-right">{data.bio.length}/300</p>
      </FieldWrap>
    </div>
  );
}

// â”€â”€ Step 2 â€“ Professional data (personal only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step2Form({
  data,
  errors,
  onChange,
}: {
  data: S2;
  errors: Errors;
  onChange: (d: Partial<S2>) => void;
}) {
  function toggleSpecialty(s: string) {
    const curr = data.specialties;
    onChange({ specialties: curr.includes(s) ? curr.filter((x) => x !== s) : [...curr, s] });
  }

  return (
    <div className="space-y-6">
      {/* CREF */}
      <FieldWrap label="CREF *" icon={Award} error={errors.cref} hint="Ex: 012345-G/SP">
        <input
          type="text"
          value={data.cref}
          onChange={(e) => onChange({ cref: e.target.value.toUpperCase() })}
          placeholder="012345-G/SP"
          className={errors.cref ? errorInputCls : inputCls}
        />
      </FieldWrap>

      {/* Specialties */}
      <FieldWrap label="Especialidades *" error={errors.specialties} hint="Selecione ao menos 1">
        <div className="flex flex-wrap gap-2 mt-1">
          {SPECIALTIES_LIST.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => toggleSpecialty(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${
                data.specialties.includes(s)
                  ? 'bg-[#7c5cfc] border-[#7c5cfc] text-white'
                  : 'border-white/10 text-slate-400 hover:border-[#7c5cfc]/40 hover:text-white'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </FieldWrap>

      {/* Modality */}
      <FieldWrap label="Modalidade de atendimento *" icon={Briefcase} error={errors.modality}>
        <div className="grid grid-cols-3 gap-3 mt-1">
          {MODALITY_OPTIONS.map(({ value, label, desc }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ modality: value })}
              className={`p-3 rounded-xl border text-left transition-colors ${
                data.modality === value
                  ? 'border-[#7c5cfc] bg-[#7c5cfc]/10'
                  : 'border-white/8 bg-white/3 hover:border-white/20'
              }`}
            >
              <p className={`text-sm font-semibold ${data.modality === value ? 'text-white' : 'text-slate-300'}`}>
                {label}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{desc}</p>
            </button>
          ))}
        </div>
      </FieldWrap>

      {/* Service radius â€“ only for presencial / ambos */}
      {(data.modality === 'presencial' || data.modality === 'ambos') && (
        <FieldWrap
          label="Raio de atendimento (km) *"
          icon={MapPin}
          error={errors.service_radius}
          hint="DistÃ¢ncia máxima que você se desloca para atender"
        >
          <input
            type="number"
            min={1}
            max={200}
            value={data.service_radius || ''}
            onChange={(e) => onChange({ service_radius: Number(e.target.value) })}
            placeholder="10"
            className={errors.service_radius ? errorInputCls : inputCls}
          />
        </FieldWrap>
      )}

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <FieldWrap label="Valor por sessão (R$) *" error={errors.price_session}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">R$</span>
            <input
              type="number"
              min={0}
              value={data.price_session || ''}
              onChange={(e) => onChange({ price_session: Number(e.target.value) })}
              placeholder="150"
              className={`${errors.price_session ? errorInputCls : inputCls} pl-9`}
            />
          </div>
        </FieldWrap>
        <FieldWrap label="Valor mensal (R$) *" error={errors.price_monthly}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-500 pointer-events-none">R$</span>
            <input
              type="number"
              min={0}
              value={data.price_monthly || ''}
              onChange={(e) => onChange({ price_monthly: Number(e.target.value) })}
              placeholder="350"
              className={`${errors.price_monthly ? errorInputCls : inputCls} pl-9`}
            />
          </div>
        </FieldWrap>
      </div>
    </div>
  );
}

// â”€â”€ Step 3 â€“ Formation (personal only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function Step3Form({
  data,
  errors,
  onChange,
}: {
  data: S3;
  errors: Errors;
  onChange: (d: Partial<S3>) => void;
}) {
  const diplomaRef    = useRef<HTMLInputElement>(null);
  const nutritionRef  = useRef<HTMLInputElement>(null);
  const [courseInput, setCourseInput] = useState('');

  function handleDiplomasChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    onChange({ diplomas: [...data.diplomas, ...files.map((f) => ({ file: f, name: f.name }))] });
    e.target.value = '';
  }

  function removeDiploma(i: number) {
    onChange({ diplomas: data.diplomas.filter((_, idx) => idx !== i) });
  }

  function addCourse() {
    const t = courseInput.trim();
    if (!t) return;
    onChange({ courses: [...data.courses, t] });
    setCourseInput('');
  }

  function removeCourse(i: number) {
    onChange({ courses: data.courses.filter((_, idx) => idx !== i) });
  }

  return (
    <div className="space-y-7">
      {/* Diplomas */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Diploma(s) de Educação Física *
        </p>

        {data.diplomas.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {data.diplomas.map((d, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-[#131722] border border-white/8 rounded-xl px-4 py-2.5"
              >
                <GraduationCap size={14} className="text-[#7c5cfc] shrink-0" />
                <span className="text-sm text-slate-300 flex-1 truncate">{d.name}</span>
                <button
                  type="button"
                  onClick={() => removeDiploma(i)}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => diplomaRef.current?.click()}
          className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-5 text-sm font-medium transition-colors ${
            errors.diplomas
              ? 'border-red-400/50 text-red-400 hover:border-red-400/70'
              : 'border-white/12 text-slate-500 hover:border-[#7c5cfc]/50 hover:text-[#7c5cfc]'
          }`}
        >
          <Upload size={16} />
          Enviar diploma ou certificado de graduação
        </button>
        {errors.diplomas && <p className="text-xs text-red-400 mt-1">{errors.diplomas}</p>}
        <input
          ref={diplomaRef}
          type="file"
          accept="image/*,.pdf"
          multiple
          className="hidden"
          onChange={handleDiplomasChange}
        />
      </div>

      {/* Extra courses */}
      <div>
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Cursos e certificações extras (opcional)
        </p>

        {data.courses.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {data.courses.map((c, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 text-xs bg-[#131722] border border-white/8 rounded-full px-3 py-1.5 text-slate-300"
              >
                {c}
                <button
                  type="button"
                  onClick={() => removeCourse(i)}
                  className="text-slate-500 hover:text-red-400 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCourse();
              }
            }}
            placeholder="Ex: CrossFit Level 2, NASM CPT, Pilates Avançadoâ€¦"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={addCourse}
            className="shrink-0 px-4 py-2.5 bg-[#7c5cfc]/15 border border-[#7c5cfc]/30 rounded-xl text-[#7c5cfc] hover:bg-[#7c5cfc]/25 transition-colors"
          >
            <Plus size={16} />
          </button>
        </div>
        <p className="text-[11px] text-slate-600 mt-1">Pressione Enter ou clique + para adicionar</p>
      </div>

      {/* Nutrition checkbox */}
      <div className="rounded-xl bg-[#131722] border border-white/8 p-5 space-y-4">
        <button
          type="button"
          onClick={() => onChange({ offers_nutrition: !data.offers_nutrition })}
          className="flex items-start gap-3 w-full text-left"
        >
          <div
            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
              data.offers_nutrition ? 'bg-[#7c5cfc] border-[#7c5cfc]' : 'border-white/20 bg-transparent'
            }`}
          >
            {data.offers_nutrition && <Check size={11} className="text-white" />}
          </div>
          <div>
            <p className="text-sm font-medium text-white">
              Ofereço acompanhamento nutricional
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Marque se você também oferece consultoria nutricional aos seus alunos
            </p>
          </div>
        </button>

        {data.offers_nutrition && (
          <div className="pt-4 border-t border-white/8">
            <p className="text-[11px] font-medium text-slate-400 mb-2">
              Comprovante de formação em Nutrição *
            </p>

            {data.nutrition_proof ? (
              <div className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-xl px-4 py-2.5">
                <CheckCircle2 size={14} className="text-[#22c55e] shrink-0" />
                <span className="text-sm text-slate-300 flex-1 truncate">{data.nutrition_proof.name}</span>
                <button
                  type="button"
                  onClick={() => onChange({ nutrition_proof: null })}
                  className="text-slate-600 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => nutritionRef.current?.click()}
                  className={`w-full flex items-center justify-center gap-2 border-2 border-dashed rounded-xl py-4 text-sm font-medium transition-colors ${
                    errors.nutrition_proof
                      ? 'border-red-400/50 text-red-400'
                      : 'border-white/12 text-slate-500 hover:border-emerald-500/50 hover:text-emerald-400'
                  }`}
                >
                  <Upload size={15} />
                  Enviar comprovante de Nutrição
                </button>
                {errors.nutrition_proof && (
                  <p className="text-xs text-red-400 mt-1">{errors.nutrition_proof}</p>
                )}
              </>
            )}
            <input
              ref={nutritionRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onChange({ nutrition_proof: f });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// â”€â”€ Step 4 â€“ Review (personal only) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function ReviewRow({ label, value, multiline }: { label: string; value: string; multiline?: boolean }) {
  return (
    <div className="flex items-start gap-4 px-4 py-3">
      <span className="text-[11px] font-medium text-slate-500 w-32 shrink-0 pt-0.5">{label}</span>
      <span className={`text-sm text-slate-200 flex-1 ${multiline ? 'whitespace-pre-wrap' : 'truncate'}`}>
        {value || 'â€“'}
      </span>
    </div>
  );
}

function Step4Review({ s1, s2, s3 }: { s1: S1; s2: S2; s3: S3 }) {
  const modalityLabel = { presencial: 'Presencial', online: 'Online', ambos: 'Presencial e online' }[s2.modality];

  return (
    <div className="space-y-6">
      {/* Personal data */}
      <section>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Dados pessoais
        </p>
        <div className="rounded-xl bg-[#131722] border border-white/8 divide-y divide-white/5">
          <ReviewRow label="Nome"       value={s1.name} />
          <ReviewRow label="Telefone"   value={s1.phone} />
          <ReviewRow label="Nascimento" value={s1.birth_date} />
          <ReviewRow label="Localização" value={s1.city && s1.state ? `${s1.city}, ${s1.state}` : s1.city || s1.state} />
          <ReviewRow label="Bio"        value={s1.bio} multiline />
        </div>
      </section>

      {/* Professional data */}
      <section>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Dados profissionais
        </p>
        <div className="rounded-xl bg-[#131722] border border-white/8 divide-y divide-white/5">
          <ReviewRow label="CREF"          value={s2.cref} />
          <ReviewRow label="Especialidades" value={s2.specialties.join(', ')} />
          <ReviewRow label="Modalidade"    value={modalityLabel} />
          {s2.modality !== 'online' && (
            <ReviewRow label="Raio" value={`${s2.service_radius} km`} />
          )}
          <ReviewRow label="Valor / sessão" value={`R$ ${s2.price_session}`} />
          <ReviewRow label="Valor mensal"  value={`R$ ${s2.price_monthly}`} />
        </div>
      </section>

      {/* Formation */}
      <section>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Formação
        </p>
        <div className="rounded-xl bg-[#131722] border border-white/8 divide-y divide-white/5">
          <ReviewRow
            label="Diplomas"
            value={s3.diplomas.length ? s3.diplomas.map((d) => d.name).join(', ') : ''}
          />
          <ReviewRow
            label="Cursos extras"
            value={s3.courses.join(', ')}
          />
          <ReviewRow
            label="Nutrição"
            value={s3.offers_nutrition ? `Sim${s3.nutrition_proof ? ` · ${s3.nutrition_proof.name}` : ''}` : 'Não'}
          />
        </div>
      </section>

      <p className="text-xs text-slate-500 text-center pb-2">
        Confira os dados acima antes de salvar. Você poderá editá-los depois.
      </p>
    </div>
  );
}

// â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function CompletarPerfilPage() {
  const { user } = useAuth();
  const navigate  = useNavigate();

  const isPersonal = user?.role === 'personal';
  const steps      = isPersonal ? STEPS_PERSONAL : STEPS_ALUNO;
  const totalSteps = steps.length;

  const [step,        setStep       ] = useState(1);
  const [s1,          setS1         ] = useState<S1>({ name: '', phone: '', birth_date: '', city: '', state: '', bio: '', avatarFile: null, avatarPreview: '' });
  const [s2,          setS2         ] = useState<S2>({ cref: '', specialties: [], modality: 'presencial', service_radius: 10, price_session: 0, price_monthly: 0 });
  const [s3,          setS3         ] = useState<S3>({ diplomas: [], courses: [], offers_nutrition: false, nutrition_proof: null });
  const [errors,      setErrors     ] = useState<Errors>({});
  const [saving,      setSaving     ] = useState(false);
  const [savedOk,     setSavedOk    ] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [loading,     setLoading    ] = useState(true);

  // â”€â”€ Load existing profile â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    supabase
      .from('profiles')
      .select('name, phone, city, state, bio, birth_date, avatar_url, opening_hours, has_nutrition, amenities')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (!data) { setLoading(false); return; }

        setS1({
          name:         data.name        ?? '',
          phone:        data.phone       ?? '',
          city:         data.city        ?? '',
          state:        data.state       ?? '',
          bio:          data.bio         ?? '',
          birth_date:   (data as any).birth_date ?? '',
          avatarFile:   null,
          avatarPreview: data.avatar_url ?? '',
        });

        // Restore professional data if it was previously saved in opening_hours
        if (isPersonal && data.opening_hours && typeof data.opening_hours === 'object') {
          const pd = data.opening_hours as Record<string, unknown>;
          if (pd._type === 'personal_professional_data') {
            setS2({
              cref:           (pd.cref           as string)   ?? '',
              specialties:    (pd.specialties     as string[]) ?? [],
              modality:       (pd.modality        as S2['modality']) ?? 'presencial',
              service_radius: (pd.service_radius  as number)  ?? 10,
              price_session:  (pd.price_session   as number)  ?? 0,
              price_monthly:  (pd.price_monthly   as number)  ?? 0,
            });
            setS3((prev) => ({
              ...prev,
              courses:          (pd.courses         as string[]) ?? [],
              offers_nutrition: data.has_nutrition  ?? false,
            }));
          }
        }

        setLoading(false);
      });
  }, [user, isPersonal]);

  // â”€â”€ Auth guard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!user && !loading) navigate('/login', { replace: true });
  }, [user, loading, navigate]);

  // â”€â”€ Validation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function validateStep(s: number): boolean {
    const e: Errors = {};

    if (s === 1) {
      if (!s1.name.trim()) e.name = 'Nome é obrigatório';
    }

    if (s === 2 && isPersonal) {
      if (!s2.cref.trim()) e.cref = 'CREF é obrigatório';
      if (s2.specialties.length === 0) e.specialties = 'Selecione ao menos 1 especialidade';
      if ((s2.modality === 'presencial' || s2.modality === 'ambos') && s2.service_radius < 1)
        e.service_radius = 'Informe o raio de atendimento';
      if (!s2.price_session || s2.price_session <= 0) e.price_session = 'Informe o valor por sessão';
      if (!s2.price_monthly || s2.price_monthly <= 0) e.price_monthly = 'Informe o valor mensal';
    }

    if (s === 3 && isPersonal) {
      if (s3.diplomas.length === 0) e.diplomas = 'Envie ao menos 1 diploma ou certificado';
      if (s3.offers_nutrition && !s3.nutrition_proof)
        e.nutrition_proof = 'Envie o comprovante de formação em nutrição';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // â”€â”€ Save â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleSave() {
    if (!user) return;
    setSaving(true);
    setGlobalError(null);

    try {
      // Upload avatar (best-effort)
      let avatarUrl: string | undefined;
      if (s1.avatarFile) {
        const ext  = s1.avatarFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('avatars')
          .upload(path, s1.avatarFile, { upsert: true });
        if (!upErr) {
          const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
          avatarUrl = publicUrl;
        }
      }

      // Base profile update
      const update: Record<string, unknown> = {
        name:       s1.name.trim(),
        phone:      s1.phone.trim()  || null,
        city:       s1.city.trim()   || null,
        state:      s1.state.trim()  || null,
        bio:        s1.bio.trim()    || null,
        birth_date: s1.birth_date    || null,
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      };

      // Personal-specific fields
      if (isPersonal) {
        // Upload diplomas to 'documents' bucket (best-effort; fall back to names)
        const diplomaUrls: string[] = [];
        for (const d of s3.diplomas) {
          const path = `${user.id}/diplomas/${Date.now()}_${d.name}`;
          const { error } = await supabase.storage
            .from('documents')
            .upload(path, d.file, { upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
            diplomaUrls.push(publicUrl);
          } else {
            diplomaUrls.push(d.name);
          }
        }

        // Upload nutrition proof (best-effort)
        let nutritionProofUrl: string | null = null;
        if (s3.nutrition_proof) {
          const path = `${user.id}/nutrition/${s3.nutrition_proof.name}`;
          const { error } = await supabase.storage
            .from('documents')
            .upload(path, s3.nutrition_proof, { upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
            nutritionProofUrl = publicUrl;
          }
        }

        // Store all professional data in opening_hours (repurposed JSON blob for personal trainers)
        update.opening_hours = {
          _type:              'personal_professional_data',
          cref:               s2.cref.trim(),
          specialties:        s2.specialties,
          modality:           s2.modality,
          service_radius:     s2.service_radius,
          price_session:      s2.price_session,
          price_monthly:      s2.price_monthly,
          courses:            s3.courses,
          nutrition_proof_url: nutritionProofUrl,
        };

        update.has_nutrition = s3.offers_nutrition;
        update.amenities     = s2.specialties;           // mirror specialties into amenities
        if (diplomaUrls.length > 0) update.photos = diplomaUrls;
      }

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(update as any)
        .eq('id', user.id);

      if (updateErr) {
        setGlobalError('Erro ao salvar o perfil. Tente novamente.');
      } else {
        setSavedOk(true);
        setTimeout(() => {
          navigate(isPersonal ? '/personal/dashboard' : '/aluno/dashboard');
        }, 1400);
      }
    } catch {
      setGlobalError('Erro inesperado. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  // â”€â”€ Navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  function handleNext() {
    if (!validateStep(step)) return;
    if (step === totalSteps) {
      handleSave();
      return;
    }
    setStep((s) => s + 1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleBack() {
    setStep((s) => Math.max(1, s - 1));
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleClose() {
    navigate(-1);
  }

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  if (loading) {
    return (
      <div className="min-h-screen bg-[#080B18] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const isLastStep = step === totalSteps;

  return (
    <div className="min-h-screen bg-[#080B18] text-white">

      {/* â”€â”€ Top bar â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="sticky top-0 z-10 bg-[#080B18]/95 backdrop-blur-sm border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#7c5cfc] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black leading-none">M</span>
          </div>
          <span className="text-white font-bold text-sm tracking-tight">movr.</span>
        </div>

        <h1 className="text-sm font-semibold text-white">Completar perfil</h1>

        <button
          onClick={handleClose}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/8 transition-colors"
          title="Fechar"
        >
          <X size={18} />
        </button>
      </div>

      {/* â”€â”€ Content â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="max-w-lg mx-auto px-4 py-8">

        {/* Step indicator */}
        {totalSteps > 1 && <StepIndicator steps={steps} current={step} />}

        {/* Step heading */}
        <div className="mb-7">
          <h2 className="text-xl font-bold text-white">{steps[step - 1].title}</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            {step === 1 && 'Informações básicas do seu perfil'}
            {step === 2 && 'Sua atuação como personal trainer'}
            {step === 3 && 'Diplomas, certificações e formação'}
            {step === 4 && 'Revise seus dados antes de salvar'}
          </p>
        </div>

        {/* Step forms */}
        {step === 1 && (
          <Step1Form data={s1} errors={errors} onChange={(d) => setS1({ ...s1, ...d })} />
        )}
        {step === 2 && isPersonal && (
          <Step2Form data={s2} errors={errors} onChange={(d) => setS2({ ...s2, ...d })} />
        )}
        {step === 3 && isPersonal && (
          <Step3Form data={s3} errors={errors} onChange={(d) => setS3({ ...s3, ...d })} />
        )}
        {step === 4 && isPersonal && (
          <Step4Review s1={s1} s2={s2} s3={s3} />
        )}

        {/* Global error */}
        {globalError && (
          <div className="mt-5 p-3.5 rounded-xl bg-red-400/10 border border-red-400/20 text-sm text-red-400">
            {globalError}
          </div>
        )}

        {/* Success */}
        {savedOk && (
          <div className="mt-5 p-3.5 rounded-xl bg-emerald-400/10 border border-emerald-400/20 text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 size={16} />
            Perfil salvo com sucesso! Redirecionandoâ€¦
          </div>
        )}

        {/* â”€â”€ Navigation buttons â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
        <div className="flex items-center gap-3 mt-9 pt-6 border-t border-white/5">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-slate-300 hover:bg-white/5 transition-colors"
            >
              <ChevronLeft size={16} />
              Anterior
            </button>
          ) : (
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-white/10 text-slate-400 hover:bg-white/5 transition-colors"
            >
              Pular
            </button>
          )}

          <button
            type="button"
            onClick={handleNext}
            disabled={saving || savedOk}
            className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-[#7c5cfc] text-white hover:bg-[#6b4de0] disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isLastStep ? (
              <><Check size={15} /> Salvar perfil</>
            ) : (
              <>Próximo <ChevronRight size={16} /></>
            )}
          </button>
        </div>

        {/* Step counter */}
        {totalSteps > 1 && (
          <p className="text-center text-[11px] text-slate-600 mt-4">
            Passo {step} de {totalSteps}
          </p>
        )}
      </div>
    </div>
  );
}
