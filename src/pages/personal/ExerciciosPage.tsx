import { useState, useMemo, useEffect, useRef } from 'react';
import { useExercises, useCreateExercise, useUpdateExercise, useDeleteExercise } from '../../hooks/useExercises';
import {
  Plus, Search, X, Eye, Edit2, Dumbbell, Check, Play,
  ChevronLeft, ChevronRight, ArrowLeft, TrendingUp, Shield,
  Maximize2, CheckCircle2, Info,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Exercise } from '../../types';

// --- Constants ----------------------------------------------------------------
const MUSCLE_GROUPS = [
  'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps',
  'Abdômen', 'Panturrilha', 'Glúteos', 'Cardio',
];

const EQUIPMENT_OPTIONS = ['Barra', 'Máquina', 'Polia', 'Halteres', 'Corporal', 'Cabo', 'Elástico', 'Kettlebell'];
const LEVEL_OPTIONS     = ['iniciante', 'intermediario', 'avancado'];

const TYPE_OPTIONS = [
  { value: 'Força',       label: 'Força',       icon: Dumbbell   },
  { value: 'Hipertrofia', label: 'Hipertrofia', icon: TrendingUp },
  { value: 'Resistência', label: 'Resistência', icon: Shield     },
  { value: 'Mobilidade',  label: 'Mobilidade',  icon: Maximize2  },
] as const;

const LEVEL_LABELS: Record<string, string> = {
  iniciante:     'Iniciante',
  intermediario: 'Intermediário',
  avancado:      'Avançado',
};

const LEVEL_COLORS: Record<string, string> = {
  iniciante:     'bg-emerald-500/10 text-emerald-400',
  intermediario: 'bg-amber-500/10 text-amber-400',
  avancado:      'bg-red-500/10 text-red-400',
};

const MUSCLE_COLORS: Record<string, string> = {
  Peito:       'bg-blue-500/15 text-blue-400',
  Costas:      'bg-violet-500/15 text-violet-400',
  Pernas:      'bg-emerald-500/15 text-emerald-400',
  Ombros:      'bg-amber-500/15 text-amber-400',
  Bíceps:      'bg-cyan-500/15 text-cyan-400',
  Tríceps:     'bg-indigo-500/15 text-indigo-400',
  Abdômen:     'bg-rose-500/15 text-rose-400',
  Panturrilha: 'bg-teal-500/15 text-teal-400',
  Glúteos:     'bg-pink-500/15 text-pink-400',
  Cardio:      'bg-orange-500/15 text-orange-400',
};

const MUSCLES_BY_GROUP: Record<string, Array<{ name: string; defaultPrimary: boolean }>> = {
  Peito: [
    { name: 'Peitoral maior',    defaultPrimary: true  },
    { name: 'Peitoral menor',    defaultPrimary: true  },
    { name: 'Deltoide anterior', defaultPrimary: false },
    { name: 'Tríceps braquial',  defaultPrimary: false },
    { name: 'Serrátil anterior', defaultPrimary: false },
  ],
  Costas: [
    { name: 'Latíssimo do dorso', defaultPrimary: true  },
    { name: 'Trapézio',           defaultPrimary: true  },
    { name: 'Romboides',          defaultPrimary: true  },
    { name: 'Redondo maior',      defaultPrimary: false },
    { name: 'Bíceps braquial',    defaultPrimary: false },
    { name: 'Braquiorradial',     defaultPrimary: false },
  ],
  Pernas: [
    { name: 'Quadríceps',    defaultPrimary: true  },
    { name: 'Isquiotibiais', defaultPrimary: true  },
    { name: 'Glúteo máximo', defaultPrimary: true  },
    { name: 'Adutor',        defaultPrimary: false },
    { name: 'Panturrilha',   defaultPrimary: false },
  ],
  Ombros: [
    { name: 'Deltoide anterior',  defaultPrimary: true  },
    { name: 'Deltoide medial',    defaultPrimary: true  },
    { name: 'Deltoide posterior', defaultPrimary: true  },
    { name: 'Trapézio superior',  defaultPrimary: false },
    { name: 'Tríceps braquial',   defaultPrimary: false },
  ],
  Bíceps: [
    { name: 'Bíceps braquial', defaultPrimary: true  },
    { name: 'Braquial',        defaultPrimary: true  },
    { name: 'Braquiorradial',  defaultPrimary: false },
  ],
  Tríceps: [
    { name: 'Tríceps braquial',  defaultPrimary: true  },
    { name: 'Ancôneo',           defaultPrimary: true  },
    { name: 'Peitoral maior',    defaultPrimary: false },
    { name: 'Deltoide anterior', defaultPrimary: false },
  ],
  Abdômen: [
    { name: 'Reto abdominal',       defaultPrimary: true  },
    { name: 'Oblíquo externo',      defaultPrimary: true  },
    { name: 'Oblíquo interno',      defaultPrimary: false },
    { name: 'Transverso abdominal', defaultPrimary: false },
  ],
  Panturrilha: [
    { name: 'Gastrocnêmio',  defaultPrimary: true  },
    { name: 'Sóleo',         defaultPrimary: true  },
    { name: 'Fibular longo', defaultPrimary: false },
  ],
  Glúteos: [
    { name: 'Glúteo máximo', defaultPrimary: true  },
    { name: 'Glúteo médio',  defaultPrimary: true  },
    { name: 'Glúteo mínimo', defaultPrimary: false },
    { name: 'Isquiotibiais', defaultPrimary: false },
  ],
  Cardio: [
    { name: 'Coração',       defaultPrimary: true  },
    { name: 'Quadríceps',    defaultPrimary: false },
    { name: 'Isquiotibiais', defaultPrimary: false },
    { name: 'Diafragma',     defaultPrimary: false },
  ],
};

// --- Helpers ------------------------------------------------------------------
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}
function getYouTubeThumbnail(url: string): string | null {
  const id = getYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
}

// --- Form state ---------------------------------------------------------------
interface FormState {
  name: string;
  muscleGroup: string;
  equipment: string;
  level: string;
  exerciseType: string;
  description: string;
  videoUrl: string;
  tips: string[];
  suggestedRest: string;
  suggestedSets: string;
  suggestedReps: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
}

const EMPTY_FORM: FormState = {
  name: '', muscleGroup: '', equipment: '', level: '', exerciseType: '',
  description: '', videoUrl: '',
  tips: [],
  suggestedRest: '90',
  suggestedSets: '4',
  suggestedReps: '8 – 12',
  primaryMuscles: [],
  secondaryMuscles: [],
};

function exerciseToForm(ex: Exercise): FormState {
  const list = MUSCLES_BY_GROUP[ex.muscleGroup] ?? [];
  const hasMuscleData = (ex.primaryMuscles?.length ?? 0) + (ex.secondaryMuscles?.length ?? 0) > 0;
  return {
    name: ex.name,
    muscleGroup: ex.muscleGroup,
    equipment: ex.equipment ?? '',
    level: ex.level ?? '',
    exerciseType: ex.exerciseType ?? '',
    description: ex.description ?? '',
    videoUrl: ex.videoUrl ?? '',
    tips: ex.tips ?? [],
    suggestedRest: ex.suggestedRest != null ? String(ex.suggestedRest) : '90',
    suggestedSets: ex.suggestedSets != null ? String(ex.suggestedSets) : '4',
    suggestedReps: ex.suggestedReps ?? '8 – 12',
    primaryMuscles: hasMuscleData
      ? (ex.primaryMuscles ?? [])
      : list.filter((m) => m.defaultPrimary).map((m) => m.name),
    secondaryMuscles: hasMuscleData
      ? (ex.secondaryMuscles ?? [])
      : list.filter((m) => !m.defaultPrimary).map((m) => m.name),
  };
}

// --- ExerciseFormPage ---------------------------------------------------------
interface ExerciseFormPageProps {
  exercise: Exercise | null;
  onBack: () => void;
  onSave: (data: Omit<Exercise, 'id'>) => void;
  isSaving: boolean;
}

function ExerciseFormPage({ exercise, onBack, onSave, isSaving }: ExerciseFormPageProps) {
  const isEditing = exercise !== null;
  const [form, setForm] = useState<FormState>(() =>
    exercise ? exerciseToForm(exercise) : EMPTY_FORM
  );
  const [tipInput, setTipInput] = useState('');
  const [videoInfo, setVideoInfo] = useState<{ title: string } | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const muscles              = MUSCLES_BY_GROUP[form.muscleGroup] ?? [];
  const primarySuggestions   = muscles.filter((m) =>  m.defaultPrimary);
  const secondarySuggestions = muscles.filter((m) => !m.defaultPrimary);

  useEffect(() => {
    if (videoDebounceRef.current) clearTimeout(videoDebounceRef.current);
    const id = getYouTubeId(form.videoUrl);
    if (!id) { setVideoInfo(null); setVideoLoading(false); return; }
    setVideoLoading(true);
    videoDebounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://noembed.com/embed?url=${encodeURIComponent(form.videoUrl)}`);
        const data = await res.json() as { title?: string; error?: string };
        setVideoInfo(data.title && !data.error ? { title: data.title } : null);
      } catch {
        setVideoInfo(null);
      } finally {
        setVideoLoading(false);
      }
    }, 600);
    return () => { if (videoDebounceRef.current) clearTimeout(videoDebounceRef.current); };
  }, [form.videoUrl]);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleGroupChange(group: string) {
    const list = MUSCLES_BY_GROUP[group] ?? [];
    setForm((f) => ({
      ...f,
      muscleGroup: group,
      primaryMuscles:   list.filter((m) =>  m.defaultPrimary).map((m) => m.name),
      secondaryMuscles: list.filter((m) => !m.defaultPrimary).map((m) => m.name),
    }));
  }

  function addTip() {
    const t = tipInput.trim();
    if (!t || form.tips.includes(t)) return;
    setField('tips', [...form.tips, t]);
    setTipInput('');
  }

  function togglePrimary(name: string) {
    setField('primaryMuscles',
      form.primaryMuscles.includes(name)
        ? form.primaryMuscles.filter((m) => m !== name)
        : [...form.primaryMuscles, name]
    );
  }

  function toggleSecondary(name: string) {
    setField('secondaryMuscles',
      form.secondaryMuscles.includes(name)
        ? form.secondaryMuscles.filter((m) => m !== name)
        : [...form.secondaryMuscles, name]
    );
  }

  const isValid    = form.name.trim() !== '' && form.muscleGroup !== '' && form.equipment !== '';
  const youtubeId  = getYouTubeId(form.videoUrl);
  const thumbnail  = youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : null;

  function handleSave() {
    if (!isValid) return;
    onSave({
      name:             form.name.trim(),
      muscleGroup:      form.muscleGroup,
      equipment:        form.equipment        || undefined,
      level:            form.level            || undefined,
      exerciseType:     form.exerciseType     || undefined,
      description:      form.description.trim() || undefined,
      videoUrl:         form.videoUrl.trim()  || undefined,
      tips:             form.tips.length > 0  ? form.tips : undefined,
      suggestedRest:    form.suggestedRest    ? Number(form.suggestedRest)  : undefined,
      suggestedSets:    form.suggestedSets    ? Number(form.suggestedSets)  : undefined,
      suggestedReps:    form.suggestedReps.trim() || undefined,
      primaryMuscles:   form.primaryMuscles.length   > 0 ? form.primaryMuscles   : undefined,
      secondaryMuscles: form.secondaryMuscles.length > 0 ? form.secondaryMuscles : undefined,
    });
  }

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <div className="border-b border-white/[0.06] bg-[#080B18]/95 backdrop-blur-sm sticky top-0 z-10 px-6 py-4">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between gap-4">
          <div>
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors mb-1.5"
            >
              <ArrowLeft size={14} />
              Voltar para exercícios
            </button>
            <h1 className="text-2xl font-bold text-white">
              {isEditing ? 'Editar exercício' : 'Novo exercício'}
            </h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {isEditing
                ? 'Atualize as informações do exercício.'
                : 'Cadastre um novo exercício no seu catálogo.'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={!isValid || isSaving}
            className="flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6b4de6] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors shrink-0"
          >
            <Check size={15} />
            {isSaving ? 'Salvando...' : 'Salvar exercício'}
          </button>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-6 py-6">
        <div className="grid grid-cols-[1fr_380px] gap-6 items-start">

          {/* -- Left: Informações básicas -- */}
          <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-6 flex flex-col gap-5">
            <h2 className="text-base font-semibold text-white">Informações básicas</h2>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Nome do exercício <span className="text-[#7c5cfc]">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                placeholder="Ex: Supino reto com barra"
                className="w-full bg-white/[0.05] border border-white/10 text-slate-100 placeholder:text-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
              />
            </div>

            {/* Muscle group + Equipment */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Grupo muscular <span className="text-[#7c5cfc]">*</span>
                </label>
                <select
                  value={form.muscleGroup}
                  onChange={(e) => handleGroupChange(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
                >
                  <option value="">Selecionar grupo</option>
                  {MUSCLE_GROUPS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  Equipamento <span className="text-[#7c5cfc]">*</span>
                </label>
                <select
                  value={form.equipment}
                  onChange={(e) => setField('equipment', e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/10 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
                >
                  <option value="">Selecionar</option>
                  {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
                </select>
              </div>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Nível de dificuldade</label>
              <select
                value={form.level}
                onChange={(e) => setField('level', e.target.value)}
                className="w-full bg-white/[0.05] border border-white/10 text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
              >
                <option value="">Selecionar nível</option>
                {LEVEL_OPTIONS.map((lv) => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
              </select>
            </div>

            {/* Exercise type */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2.5">Tipo de exercício</label>
              <div className="grid grid-cols-4 gap-2">
                {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => {
                  const active = form.exerciseType === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setField('exerciseType', active ? '' : value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-medium transition-all ${
                        active
                          ? 'bg-[#7c5cfc]/15 border-[#7c5cfc] text-[#a78bfa]'
                          : 'border-white/[0.08] text-slate-400 hover:border-white/20 hover:text-slate-300 hover:bg-white/[0.03]'
                      }`}
                    >
                      <Icon size={18} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">Descrição técnica</label>
              <textarea
                value={form.description}
                onChange={(e) => setField('description', e.target.value.slice(0, 500))}
                placeholder="Descreva a execução correta do exercício..."
                rows={4}
                className="w-full bg-white/[0.05] border border-white/10 text-slate-100 placeholder:text-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition resize-none"
              />
              <p className="text-right text-xs text-slate-600 mt-1">{form.description.length}/500</p>
            </div>

            {/* Tips */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Dicas <span className="text-slate-500 font-normal">(opcional)</span>
              </label>
              <div className="bg-white/[0.05] border border-white/10 rounded-xl p-3 min-h-[72px] flex flex-wrap gap-2 focus-within:border-[#7c5cfc]/50 transition">
                {form.tips.map((tip) => (
                  <span
                    key={tip}
                    className="inline-flex items-center gap-1.5 bg-[#7c5cfc]/15 text-[#a78bfa] text-xs px-2.5 py-1 rounded-full border border-[#7c5cfc]/30"
                  >
                    {tip}
                    <button
                      type="button"
                      onClick={() => setField('tips', form.tips.filter((t) => t !== tip))}
                      className="hover:text-white transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={tipInput}
                  onChange={(e) => setTipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTip(); }
                  }}
                  placeholder={form.tips.length === 0 ? 'Digite uma dica e pressione Enter...' : ''}
                  className="flex-1 min-w-[160px] bg-transparent text-slate-100 placeholder:text-slate-600 text-sm outline-none"
                />
              </div>
              <p className="text-xs text-slate-600 mt-1">Pressione Enter ou vírgula para adicionar</p>
            </div>

            {/* Rest / Sets / Reps */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Descanso sugerido</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.suggestedRest}
                    onChange={(e) => setField('suggestedRest', e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition pr-16"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">segundos</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Séries sugeridas</label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    value={form.suggestedSets}
                    onChange={(e) => setField('suggestedSets', e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/10 text-slate-100 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">séries</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Repetições sugeridas</label>
                <div className="relative">
                  <input
                    type="text"
                    value={form.suggestedReps}
                    onChange={(e) => setField('suggestedReps', e.target.value)}
                    placeholder="Ex: 8 – 12"
                    className="w-full bg-white/[0.05] border border-white/10 text-slate-100 placeholder:text-slate-600 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-500 pointer-events-none">reps</span>
                </div>
              </div>
            </div>
          </div>

          {/* -- Right column -- */}
          <div className="flex flex-col gap-5">

            {/* Media */}
            <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-white mb-0.5">Mídia do exercício</h2>
              <p className="text-xs text-slate-500 mb-4">Adicione um vídeo do YouTube ou faça upload de um vídeo/imagem.</p>

              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                </svg>
                <input
                  type="url"
                  value={form.videoUrl}
                  onChange={(e) => setField('videoUrl', e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className="w-full bg-white/[0.05] border border-white/10 text-slate-100 placeholder:text-slate-600 rounded-xl pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
                />
                {youtubeId && (
                  <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                )}
              </div>

              {thumbnail && youtubeId ? (
                <div>
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-[#080B18] mb-3">
                    <img src={thumbnail} alt="preview" className="w-full h-full object-cover" />
                    <a
                      href={form.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play size={16} className="text-white ml-0.5" fill="white" />
                      </div>
                    </a>
                  </div>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-white leading-tight">Preview do vídeo</p>
                      {videoLoading
                        ? <p className="text-xs text-slate-500">Carregando...</p>
                        : videoInfo && <p className="text-xs text-slate-400 truncate">{videoInfo.title}</p>
                      }
                      <p className="text-xs text-slate-500">YouTube</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setField('videoUrl', ''); setVideoInfo(null); }}
                    className="w-full flex items-center justify-center gap-2 border border-white/10 text-slate-400 hover:text-white hover:border-white/20 rounded-xl py-2 text-xs transition-colors"
                  >
                    <Edit2 size={12} />
                    Alterar vídeo
                  </button>
                </div>
              ) : (
                <div className="aspect-video w-full rounded-xl bg-[#080B18] border border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-slate-600">
                  <Play size={24} className="opacity-30" />
                  <p className="text-xs">Cole um link do YouTube acima</p>
                </div>
              )}
            </div>

            {/* Muscles */}
            {form.muscleGroup && muscles.length > 0 && (
              <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl p-5">
                <h2 className="text-sm font-semibold text-white mb-0.5">Músculos envolvidos</h2>
                <p className="text-xs text-slate-500 mb-4">Selecione os músculos que este exercício trabalha.</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2.5">Primários</p>
                    <div className="flex flex-col gap-2.5">
                      {primarySuggestions.map(({ name }) => {
                        const checked = form.primaryMuscles.includes(name);
                        return (
                          <button key={name} type="button" onClick={() => togglePrimary(name)} className="flex items-center gap-2.5 text-left w-full">
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#7c5cfc] border-[#7c5cfc]' : 'border-white/20'}`}>
                              {checked && <Check size={10} className="text-white" />}
                            </span>
                            <span className={`text-xs transition-colors ${checked ? 'text-slate-200' : 'text-slate-400'}`}>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 mb-2.5">Secundários</p>
                    <div className="flex flex-col gap-2.5">
                      {secondarySuggestions.map(({ name }) => {
                        const checked = form.secondaryMuscles.includes(name);
                        return (
                          <button key={name} type="button" onClick={() => toggleSecondary(name)} className="flex items-center gap-2.5 text-left w-full">
                            <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${checked ? 'bg-[#7c5cfc] border-[#7c5cfc]' : 'border-white/20'}`}>
                              {checked && <Check size={10} className="text-white" />}
                            </span>
                            <span className={`text-xs transition-colors ${checked ? 'text-slate-200' : 'text-slate-400'}`}>{name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom info bar */}
        <div className="mt-6 flex items-center gap-2.5 bg-[#0D1025] border border-white/[0.06] rounded-xl px-4 py-3">
          <Info size={14} className="text-[#7c5cfc] shrink-0" />
          <p className="text-xs text-slate-400">
            Depois de salvar, o exercício ficará disponível para uso nos treinos e planos dos alunos.
          </p>
        </div>
      </div>
    </div>
  );
}

// --- List constants -----------------------------------------------------------
const ITEMS_PER_PAGE = 8;

// --- ExerciciosPage -----------------------------------------------------------
export default function ExerciciosPage() {
  const { data: exercises = [], isLoading } = useExercises();
  const createMutation = useCreateExercise();
  const updateMutation = useUpdateExercise();
  const deleteMutation = useDeleteExercise();

  const [view,     setView]     = useState<'list' | 'form'>('list');
  const [editingEx, setEditingEx] = useState<Exercise | null>(null);

  const [filterGroup,     setFilterGroup]     = useState('');
  const [searchQuery,     setSearchQuery]      = useState('');
  const [filterEquipment, setFilterEquipment] = useState('');
  const [filterLevel,     setFilterLevel]     = useState('');
  const [selectedEx,      setSelectedEx]       = useState<Exercise | null>(null);
  const [page,            setPage]             = useState(1);
  const [deleteConfirm,   setDeleteConfirm]    = useState<Exercise | null>(null);

  const hasFilters = filterGroup !== '' || searchQuery !== '' || filterEquipment !== '' || filterLevel !== '';

  const filtered = useMemo(() => exercises.filter((e) => {
    if (filterGroup     && e.muscleGroup !== filterGroup)     return false;
    if (filterEquipment && e.equipment   !== filterEquipment) return false;
    if (filterLevel     && e.level       !== filterLevel)     return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!e.name.toLowerCase().includes(q) && !e.muscleGroup.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [exercises, filterGroup, searchQuery, filterEquipment, filterLevel]);

  const totalPages  = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paginated   = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  function clearFilters() {
    setFilterGroup(''); setSearchQuery(''); setFilterEquipment(''); setFilterLevel(''); setPage(1);
  }

  function handleSaveExercise(data: Omit<Exercise, 'id'>) {
    if (editingEx) {
      updateMutation.mutate({ id: editingEx.id, data }, {
        onSuccess: () => { toast.success('Exercício atualizado!'); setView('list'); },
        onError:   () => toast.error('Erro ao atualizar exercício.'),
      });
    } else {
      createMutation.mutate(data, {
        onSuccess: () => { toast.success('Exercício criado!'); setView('list'); },
        onError:   () => toast.error('Erro ao criar exercício.'),
      });
    }
  }

  function handleDelete(ex: Exercise) {
    deleteMutation.mutate(ex.id);
    if (selectedEx?.id === ex.id) setSelectedEx(null);
    setDeleteConfirm(null);
    toast.success(`"${ex.name}" removido.`);
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const pageNums = (() => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);
  })();

  if (view === 'form') {
    return (
      <ExerciseFormPage
        exercise={editingEx}
        onBack={() => setView('list')}
        onSave={handleSaveExercise}
        isSaving={isSaving}
      />
    );
  }

  return (
    <div className="p-5 max-w-screen-xl mx-auto flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exercícios</h1>
          <p className="text-sm text-slate-400 mt-0.5">Gerencie seu catálogo de exercícios e mantenha tudo organizado.</p>
        </div>
        <button
          onClick={() => { setEditingEx(null); setView('form'); }}
          className="flex items-center gap-2 bg-[#7c5cfc] hover:bg-[#6b4de6] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          <Plus size={15} />
          Novo exercício
        </button>
      </div>

      {/* Muscle-group filter chips */}
      <div className="flex flex-wrap gap-2">
        {['Todos', ...MUSCLE_GROUPS].map((g) => {
          const active = g === 'Todos' ? filterGroup === '' : filterGroup === g;
          return (
            <button
              key={g}
              onClick={() => { setFilterGroup(g === 'Todos' ? '' : g === filterGroup ? '' : g); setPage(1); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                active ? 'bg-[#7c5cfc] text-white border-[#7c5cfc]' : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-300'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Search + dropdowns */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            placeholder="Buscar exercício por nome ou grupo muscular..."
            className="w-full bg-[#0D1025] border border-white/[0.08] text-slate-200 placeholder:text-slate-600 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
          />
        </div>
        <select
          value={filterEquipment}
          onChange={(e) => { setFilterEquipment(e.target.value); setPage(1); }}
          className="bg-[#0D1025] border border-white/[0.08] text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
        >
          <option value="">Equipamento: Todos</option>
          {EQUIPMENT_OPTIONS.map((eq) => <option key={eq} value={eq}>{eq}</option>)}
        </select>
        <select
          value={filterLevel}
          onChange={(e) => { setFilterLevel(e.target.value); setPage(1); }}
          className="bg-[#0D1025] border border-white/[0.08] text-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#7c5cfc]/50 transition"
        >
          <option value="">Nível: Todos</option>
          {LEVEL_OPTIONS.map((lv) => <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>)}
        </select>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition">
            <X size={14} /> Limpar filtros
          </button>
        )}
      </div>

      {/* Table + optional detail panel */}
      <div className={selectedEx ? 'grid grid-cols-[1fr_340px] gap-4 items-start' : ''}>

        <div className="bg-[#0D1025] rounded-2xl border border-white/[0.06] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left text-[11px] font-semibold text-slate-500 tracking-wide px-4 py-3">EXERCÍCIO</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 tracking-wide px-3 py-3">GRUPO MUSCULAR</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 tracking-wide px-3 py-3">EQUIPAMENTO</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 tracking-wide px-3 py-3">NÍVEL</th>
                <th className="text-left text-[11px] font-semibold text-slate-500 tracking-wide px-3 py-3">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {isLoading ? (
                <tr><td colSpan={5} className="text-center py-16 text-slate-500 text-sm">Carregando...</td></tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Dumbbell size={32} className="text-slate-600 opacity-30" />
                      <p className="text-sm font-medium text-slate-400">Nenhum exercício encontrado</p>
                    </div>
                  </td>
                </tr>
              ) : paginated.map((ex) => {
                const thumb  = ex.videoUrl ? getYouTubeThumbnail(ex.videoUrl) : null;
                const active = selectedEx?.id === ex.id;
                return (
                  <tr
                    key={ex.id}
                    onClick={() => setSelectedEx(active ? null : ex)}
                    className={`cursor-pointer transition-colors hover:bg-white/[0.03] ${active ? 'bg-[#7c5cfc]/[0.06]' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-10 rounded-lg bg-[#080B18] overflow-hidden shrink-0 flex items-center justify-center">
                          {thumb ? <img src={thumb} alt={ex.name} className="w-full h-full object-cover" /> : <Dumbbell size={16} className="text-slate-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white leading-tight">{ex.name}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{ex.muscleGroup}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${MUSCLE_COLORS[ex.muscleGroup] ?? 'bg-slate-700/50 text-slate-400'}`}>
                        {ex.muscleGroup}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-slate-400">{ex.equipment ?? '—'}</td>
                    <td className="px-3 py-3">
                      {ex.level
                        ? <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-medium ${LEVEL_COLORS[ex.level] ?? 'bg-slate-700/50 text-slate-400'}`}>{LEVEL_LABELS[ex.level] ?? ex.level}</span>
                        : <span className="text-sm text-slate-500">—</span>
                      }
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {ex.videoUrl && (
                          <a href={ex.videoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors" title="Ver vídeo">
                            <Eye size={14} />
                          </a>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setEditingEx(ex); setView('form'); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/[0.06] transition-colors" title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm(ex); }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/[0.08] transition-colors" title="Excluir">
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Mostrando {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} a{' '}
              {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} de {filtered.length} exercícios
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft size={12} /> Anterior
              </button>
              {pageNums.map((pg) => (
                <button key={pg} onClick={() => setPage(pg)}
                  className={`w-7 h-7 rounded-lg text-xs font-medium transition-colors ${currentPage === pg ? 'bg-[#7c5cfc] text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'}`}>
                  {pg}
                </button>
              ))}
              {totalPages > 7 && currentPage < totalPages - 3 && <span className="text-slate-500 text-xs px-1">...</span>}
              {totalPages > 7 && currentPage < totalPages - 3 && (
                <button onClick={() => setPage(totalPages)} className="w-7 h-7 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors">{totalPages}</button>
              )}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.06] disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                Próxima <ChevronRight size={12} />
              </button>
            </div>
          </div>
        </div>

        {/* Detail panel */}
        {selectedEx && (
          <div className="bg-[#0D1025] rounded-2xl border border-white/[0.06] overflow-hidden flex flex-col sticky top-4">
            <div className="relative aspect-video w-full bg-[#080B18] overflow-hidden">
              {selectedEx.videoUrl ? (
                <>
                  <img src={getYouTubeThumbnail(selectedEx.videoUrl) ?? ''} alt={selectedEx.name} className="w-full h-full object-cover" />
                  <a href={selectedEx.videoUrl} target="_blank" rel="noopener noreferrer"
                    className="absolute inset-0 flex items-center justify-center bg-black/25 hover:bg-black/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Play size={20} className="text-white ml-0.5" fill="white" />
                    </div>
                  </a>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-600">
                  <Dumbbell size={28} className="opacity-40" />
                  <p className="text-xs">Sem vídeo cadastrado</p>
                </div>
              )}
              <button onClick={() => setSelectedEx(null)} className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/40 text-white hover:bg-black/60 transition-colors">
                <X size={14} />
              </button>
            </div>

            <div className="p-4 flex flex-col gap-4 overflow-y-auto">
              <div>
                <div className="flex items-start gap-2 flex-wrap mb-1">
                  <h2 className="text-base font-bold text-white leading-tight">{selectedEx.name}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium shrink-0 ${MUSCLE_COLORS[selectedEx.muscleGroup] ?? 'bg-slate-700/50 text-slate-400'}`}>
                    {selectedEx.muscleGroup}
                  </span>
                </div>
                {selectedEx.description && <p className="text-xs text-slate-400 leading-relaxed">{selectedEx.description}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                {([
                  ['Equipamento', selectedEx.equipment ?? '—'],
                  ['Nível',       selectedEx.level ? (LEVEL_LABELS[selectedEx.level] ?? selectedEx.level) : '—'],
                  ['Tipo',        selectedEx.exerciseType ?? '—'],
                  ['Descanso',    selectedEx.suggestedRest ? `${selectedEx.suggestedRest}s` : '—'],
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="bg-[#080B18] rounded-lg px-3 py-2">
                    <p className="text-[10px] text-slate-500 mb-0.5">{label}</p>
                    <p className="text-xs font-medium text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              {selectedEx.tips && selectedEx.tips.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Dicas</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEx.tips.map((t) => (
                      <span key={t} className="text-[11px] bg-[#7c5cfc]/10 text-[#a78bfa] px-2 py-0.5 rounded-full border border-[#7c5cfc]/20">{t}</span>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => { setEditingEx(selectedEx); setView('form'); }}
                className="w-full flex items-center justify-center gap-2 border border-[#7c5cfc]/40 text-[#7c5cfc] hover:bg-[#7c5cfc]/10 rounded-xl py-2.5 text-sm font-medium transition-colors">
                <Edit2 size={14} /> Editar exercício
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1025] border border-white/[0.08] rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-white mb-2">Excluir exercício</h2>
            <p className="text-sm text-slate-400 mb-6">
              Tem certeza que deseja excluir <strong className="text-white">{deleteConfirm.name}</strong>? Ele será removido de todos os planos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-white/10 text-slate-300 rounded-xl py-2.5 text-sm hover:bg-white/[0.04] transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600 transition-colors">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}