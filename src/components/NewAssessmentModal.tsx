import { useState } from 'react';
import { X, CalendarDays, Check, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useCreateAssessment } from '../hooks/useAssessments';
import { toast } from 'sonner';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  studentId: string;
  studentName: string;
  onClose: () => void;
}

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

export default function NewAssessmentModal({ studentId, studentName, onClose }: Props) {
  const { user } = useAuth();
  const createAssessmentMutation = useCreateAssessment();

  const today = new Date();

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Dados principais
  const [weight, setWeight] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [leanMass, setLeanMass] = useState('');

  // Medidas corporais
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [arm, setArm] = useState('');
  const [thigh, setThigh] = useState('');
  const [chest, setChest] = useState('');
  const [calf, setCalf] = useState('');
  const [abdomen, setAbdomen] = useState('');

  // Observacoes
  const [notes, setNotes] = useState('');

  function handleSave() {
    if (!weight && !bodyFat) {
      toast.error('Informe pelo menos o peso ou o % de gordura.');
      return;
    }
    if (!user) return;

    createAssessmentMutation.mutate({
      studentId,
      personalId: user.id,
      date: format(selectedDate, 'yyyy-MM-dd'),
      weight:     weight     ? parseFloat(weight)     : undefined,
      bodyFat:    bodyFat    ? parseFloat(bodyFat)    : undefined,
      muscleMass: muscleMass ? parseFloat(muscleMass) : undefined,
      leanMass:   leanMass   ? parseFloat(leanMass)   : undefined,
      chest:      chest      ? parseFloat(chest)      : undefined,
      waist:      waist      ? parseFloat(waist)      : undefined,
      hip:        hip        ? parseFloat(hip)        : undefined,
      thigh:      thigh      ? parseFloat(thigh)      : undefined,
      arm:        arm        ? parseFloat(arm)        : undefined,
      calf:       calf       ? parseFloat(calf)       : undefined,
      abdomen:    abdomen    ? parseFloat(abdomen)    : undefined,
      notes: notes.trim() || undefined,
    });

    toast.success(`Avaliacao de ${studentName} registrada!`);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-white/[0.07] rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
              <CalendarDays size={20} className="text-violet-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Nova avaliacao</h2>
              <p className="text-xs text-slate-400">Registre os dados da avaliacao do aluno.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Data da avaliacao */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">Data da avaliacao</label>
            <button
              type="button"
              onClick={() => setPickerOpen((p) => !p)}
              className="flex items-center justify-between gap-2 bg-[#0D1025] border border-white/[0.07] rounded-xl px-4 py-2.5 text-sm text-white hover:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500 transition-colors min-w-[180px]"
            >
              <span>{format(selectedDate, 'dd/MM/yyyy')}</span>
              <CalendarDays size={16} className="text-slate-400 shrink-0" />
            </button>
            {pickerOpen && (
              <div className="mt-2 inline-block rounded-2xl border border-white/[0.07] bg-slate-900 overflow-hidden shadow-xl z-10 relative">
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(d) => { if (d) { setSelectedDate(d); setPickerOpen(false); } }}
                  locale={ptBR}
                  defaultMonth={selectedDate}
                  disabled={{ after: today }}
                  classNames={{
                    root: 'p-3',
                    months: 'w-full',
                    month: 'w-full',
                    month_caption: 'flex justify-center items-center relative h-9 mb-2',
                    caption_label: 'text-sm font-semibold text-white capitalize',
                    nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                    button_previous: 'h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors',
                    button_next: 'h-9 w-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors',
                    month_grid: 'w-full border-collapse',
                    weekdays: 'flex',
                    weekday: 'w-9 h-8 flex items-center justify-center text-[0.68rem] font-medium text-slate-500 uppercase',
                    weeks: '',
                    week: 'flex mt-1',
                    day: 'w-9 h-9 flex items-center justify-center',
                    day_button: 'w-9 h-9 rounded-full text-sm text-slate-200 hover:bg-slate-700 transition-colors focus:outline-none cursor-pointer',
                    selected: '[&>button]:bg-violet-600 [&>button]:hover:bg-violet-500 [&>button]:text-white [&>button]:font-semibold',
                    today: '[&>button]:text-violet-300 [&>button]:font-bold',
                    outside: '[&>button]:text-slate-600 [&>button]:opacity-40',
                    disabled: '[&>button]:opacity-25 [&>button]:cursor-not-allowed',
                    hidden: 'invisible',
                  }}
                />
              </div>
            )}
          </div>

          {/* Dados principais */}
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-3">Dados principais</p>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Peso (kg)</label>
                <input type="number" step="0.1" min="0" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="62.0" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Gordura corporal (%)</label>
                <input type="number" step="0.1" min="0" max="100" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="18.5" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Massa muscular (kg)</label>
                <input type="number" step="0.1" min="0" value={muscleMass} onChange={(e) => setMuscleMass(e.target.value)} placeholder="35.0" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Massa magra (kg)</label>
                <input type="number" step="0.1" min="0" value={leanMass} onChange={(e) => setLeanMass(e.target.value)} placeholder="52.0" className={INPUT_CLS} />
              </div>
            </div>
          </div>

          {/* Medidas corporais */}
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-0.5">
              Medidas corporais{' '}
              <span className="text-xs font-normal text-slate-500">(opcional)</span>
            </p>
            <p className="text-xs text-slate-500 mb-3">Todas as medidas em centimetros (cm).</p>
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Cintura (cm)</label>
                <input type="number" step="0.1" min="0" value={waist} onChange={(e) => setWaist(e.target.value)} placeholder="78" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Quadril (cm)</label>
                <input type="number" step="0.1" min="0" value={hip} onChange={(e) => setHip(e.target.value)} placeholder="98" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Braco (cm)</label>
                <input type="number" step="0.1" min="0" value={arm} onChange={(e) => setArm(e.target.value)} placeholder="31" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Coxa (cm)</label>
                <input type="number" step="0.1" min="0" value={thigh} onChange={(e) => setThigh(e.target.value)} placeholder="56" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Peitoral (cm)</label>
                <input type="number" step="0.1" min="0" value={chest} onChange={(e) => setChest(e.target.value)} placeholder="102" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Panturrilha (cm)</label>
                <input type="number" step="0.1" min="0" value={calf} onChange={(e) => setCalf(e.target.value)} placeholder="37" className={INPUT_CLS} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Abdomen (cm)</label>
                <input type="number" step="0.1" min="0" value={abdomen} onChange={(e) => setAbdomen(e.target.value)} placeholder="82" className={INPUT_CLS} />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  className="w-full h-[42px] border border-dashed border-slate-600 rounded-xl flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:border-violet-500 hover:text-violet-400 transition-colors"
                  onClick={() => toast.info('Em breve: medidas personalizadas.')}
                >
                  <Plus size={13} />
                  Adicionar medida
                </button>
              </div>
            </div>
          </div>

          {/* Observacoes */}
          <div>
            <p className="text-sm font-semibold text-slate-200 mb-1">
              Observacoes{' '}
              <span className="text-xs font-normal text-slate-500">(opcional)</span>
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              maxLength={600}
              placeholder="Adicione observacoes sobre essa avaliacao..."
              className="w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none transition-colors"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/[0.07] shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl border border-slate-600 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
          >
            <Check size={15} />
            Salvar avaliacao
          </button>
        </div>
      </div>
    </div>
  );
}
