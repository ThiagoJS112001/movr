import { useState } from 'react';
import { X, Heart, Activity, Moon, Droplets, Target, Calendar, Clock, Check } from 'lucide-react';
import { useUpsertAnamnese } from '../hooks/useAnamneses';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';
import type { StudentAnamnese, ActivityLevel, PreferredTime } from '../types';

interface Props {
  studentId: string;
  studentName: string;
  existing?: StudentAnamnese | null;
  onClose: () => void;
}

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

const ACTIVITY_LEVELS: { value: ActivityLevel; label: string; desc: string }[] = [
  { value: 'sedentario',  label: 'Sedentário',   desc: 'Não pratica atividade' },
  { value: 'leve',        label: 'Leve',          desc: '1-2x por semana' },
  { value: 'moderado',    label: 'Moderado',      desc: '3-4x por semana' },
  { value: 'ativo',       label: 'Ativo',         desc: '5-6x por semana' },
  { value: 'muito_ativo', label: 'Muito Ativo',   desc: 'Diário ou 2x/dia' },
];

const DAYS_PT = ['segunda','terca','quarta','quinta','sexta','sabado','domingo'] as const;
const DAYS_LABELS: Record<string, string> = {
  segunda:'Seg', terca:'Ter', quarta:'Qua', quinta:'Qui',
  sexta:'Sex', sabado:'Sáb', domingo:'Dom',
};

const PREFERRED_TIMES: { value: PreferredTime; label: string }[] = [
  { value: 'manha', label: 'Manhã' },
  { value: 'tarde', label: 'Tarde' },
  { value: 'noite', label: 'Noite' },
];

export default function AnamneseModal({ studentId, studentName, existing, onClose }: Props) {
  const { user } = useAuth();
  const upsert = useUpsertAnamnese(studentId);

  const [objective, setObjective]             = useState(existing?.objective ?? '');
  const [activityLevel, setActivityLevel]     = useState<ActivityLevel | ''>(existing?.activityLevel ?? '');
  const [hasHealthIssues, setHasHealthIssues] = useState(existing?.hasHealthIssues ?? false);
  const [healthIssues, setHealthIssues]       = useState(existing?.healthIssues ?? '');
  const [medications, setMedications]         = useState(existing?.medications ?? '');
  const [injuries, setInjuries]               = useState(existing?.injuries ?? '');
  const [sleepHours, setSleepHours]           = useState(existing?.sleepHours?.toString() ?? '');
  const [stressLevel, setStressLevel]         = useState<number>(existing?.stressLevel ?? 3);
  const [waterIntake, setWaterIntake]         = useState(existing?.waterIntakeLiters?.toString() ?? '');
  const [previousTraining, setPreviousTraining] = useState(existing?.previousTraining ?? '');
  const [trainingYears, setTrainingYears]     = useState(existing?.trainingYears?.toString() ?? '');
  const [preferredDays, setPreferredDays]     = useState<string[]>(existing?.preferredDays ?? []);
  const [preferredTime, setPreferredTime]     = useState<PreferredTime | ''>(existing?.preferredTime ?? '');
  const [observations, setObservations]       = useState(existing?.observations ?? '');

  function toggleDay(d: string) {
    setPreferredDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  }

  async function handleSave() {
    if (!user) return;
    try {
      await upsert.mutateAsync({
        personalId: user.id,
        studentId,
        objective: objective || undefined,
        activityLevel: activityLevel || undefined,
        hasHealthIssues,
        healthIssues: hasHealthIssues ? (healthIssues || undefined) : undefined,
        medications: medications || undefined,
        injuries: injuries || undefined,
        sleepHours: sleepHours ? Number(sleepHours) : undefined,
        stressLevel,
        waterIntakeLiters: waterIntake ? Number(waterIntake) : undefined,
        previousTraining: previousTraining || undefined,
        trainingYears: trainingYears ? Number(trainingYears) : undefined,
        preferredDays,
        preferredTime: preferredTime || undefined,
        observations: observations || undefined,
      });
      toast.success('Anamnese salva!');
      onClose();
    } catch {
      toast.error('Erro ao salvar anamnese');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full sm:max-w-xl bg-[#0A0D1A] sm:border border-white/[0.08] sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06] shrink-0">
          <div>
            <h2 className="text-base font-semibold text-white">Anamnese</h2>
            <p className="text-xs text-slate-400 mt-0.5">{studentName}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Objective */}
          <section>
            <SectionTitle icon={<Target size={13} />} title="Objetivo Principal" />
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              rows={2}
              placeholder="Ex: Emagrecer 10kg, ganhar massa muscular, melhorar condicionamento…"
              className={`${INPUT_CLS} resize-none`}
            />
          </section>

          {/* Activity level */}
          <section>
            <SectionTitle icon={<Activity size={13} />} title="Nível de Atividade Atual" />
            <div className="grid grid-cols-5 gap-1.5">
              {ACTIVITY_LEVELS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => setActivityLevel(l.value)}
                  className={`p-2 rounded-xl border text-center transition-colors
                    ${activityLevel === l.value
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-white/10 text-slate-400 hover:border-violet-500/40 hover:text-white'
                    }`}
                >
                  <p className="text-xs font-semibold">{l.label}</p>
                  <p className="text-[10px] text-current opacity-70 mt-0.5 leading-tight">{l.desc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Health */}
          <section>
            <SectionTitle icon={<Heart size={13} />} title="Saúde" />
            <button
              onClick={() => setHasHealthIssues(!hasHealthIssues)}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-white/20 transition-colors mb-3"
            >
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors
                ${hasHealthIssues ? 'bg-red-500 border-red-500' : 'border-white/20'}`}>
                {hasHealthIssues && <Check size={11} className="text-white" />}
              </div>
              <span className="text-sm text-slate-300">Possui problemas de saúde conhecidos</span>
            </button>
            {hasHealthIssues && (
              <textarea
                value={healthIssues}
                onChange={(e) => setHealthIssues(e.target.value)}
                rows={2}
                placeholder="Descreva as condições de saúde (hipertensão, diabetes, problemas cardíacos…)"
                className={`${INPUT_CLS} resize-none mb-2`}
              />
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Medicamentos em uso</label>
                <input type="text" value={medications} onChange={(e) => setMedications(e.target.value)} className={INPUT_CLS} placeholder="Nenhum" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Lesões/Limitações físicas</label>
                <input type="text" value={injuries} onChange={(e) => setInjuries(e.target.value)} className={INPUT_CLS} placeholder="Ex: Joelho direito, lombar…" />
              </div>
            </div>
          </section>

          {/* Lifestyle */}
          <section>
            <SectionTitle icon={<Moon size={13} />} title="Estilo de Vida" />
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  <Moon size={10} className="inline mr-1" />Horas de sono
                </label>
                <input type="number" min={0} max={24} step={0.5} value={sleepHours} onChange={(e) => setSleepHours(e.target.value)} className={INPUT_CLS} placeholder="7" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">
                  <Droplets size={10} className="inline mr-1" />Água (litros/dia)
                </label>
                <input type="number" min={0} max={10} step={0.1} value={waterIntake} onChange={(e) => setWaterIntake(e.target.value)} className={INPUT_CLS} placeholder="2.0" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nível de estresse (1-5)</label>
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setStressLevel(n)}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors
                        ${stressLevel === n ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Training history */}
          <section>
            <SectionTitle icon={<Activity size={13} />} title="Histórico de Treino" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Treinamento anterior</label>
                <input type="text" value={previousTraining} onChange={(e) => setPreviousTraining(e.target.value)} className={INPUT_CLS} placeholder="Ex: Academia, Funcional, Nenhum…" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Anos treinando</label>
                <input type="number" min={0} value={trainingYears} onChange={(e) => setTrainingYears(e.target.value)} className={INPUT_CLS} placeholder="0" />
              </div>
            </div>
          </section>

          {/* Preferences */}
          <section>
            <SectionTitle icon={<Calendar size={13} />} title="Preferências de Treino" />
            <label className="block text-xs text-slate-400 mb-2">Dias preferidos</label>
            <div className="flex gap-1.5 mb-4 flex-wrap">
              {DAYS_PT.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors
                    ${preferredDays.includes(d)
                      ? 'bg-violet-600 text-white'
                      : 'bg-white/5 text-slate-400 hover:bg-white/10'
                    }`}
                >
                  {DAYS_LABELS[d]}
                </button>
              ))}
            </div>
            <label className="block text-xs text-slate-400 mb-2">
              <Clock size={10} className="inline mr-1" />Período preferido
            </label>
            <div className="flex gap-2">
              {PREFERRED_TIMES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setPreferredTime(preferredTime === t.value ? '' : t.value)}
                  className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-colors
                    ${preferredTime === t.value
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'border-white/10 text-slate-400 hover:border-violet-500/40'
                    }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </section>

          {/* Observations */}
          <section>
            <SectionTitle icon={<Target size={13} />} title="Observações Gerais" />
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
              placeholder="Qualquer informação adicional relevante…"
              className={`${INPUT_CLS} resize-none`}
            />
          </section>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0 shrink-0 border-t border-white/[0.06] mt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {upsert.isPending ? 'Salvando…' : 'Salvar Anamnese'}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-violet-400">{icon}</span>
      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wide">{title}</h3>
    </div>
  );
}
