import { useState } from 'react';
import { X, Calendar, Clock, User, FileText } from 'lucide-react';
import { useCreateSession } from '../hooks/useSessions';
import { toast } from 'sonner';
import type { User as AppUser } from '../types';

interface Props {
  defaultDate: string;
  students: AppUser[];
  onClose: () => void;
}

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

export default function NewSessionModal({ defaultDate, students, onClose }: Props) {
  const createSession = useCreateSession();

  const [studentId, setStudentId] = useState('');
  const [title, setTitle] = useState('Sessão de Treino');
  const [date, setDate] = useState(defaultDate);
  const [startTime, setStartTime] = useState('07:00');
  const [endTime, setEndTime] = useState('08:00');
  const [notes, setNotes] = useState('');

  const activeStudents = students.filter((s) => !s.isBlocked && s.connectionStatus !== 'pending');

  async function handleSave() {
    if (!studentId) { toast.error('Selecione um aluno'); return; }
    if (!date) { toast.error('Informe a data'); return; }
    if (!startTime || !endTime) { toast.error('Informe os horários'); return; }
    if (startTime >= endTime) { toast.error('Horário final deve ser após o início'); return; }

    try {
      await createSession.mutateAsync({ studentId, title, date, startTime, endTime, notes: notes || undefined });
      toast.success('Sessão agendada!');
      onClose();
    } catch {
      toast.error('Erro ao agendar sessão');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0A0D1A] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">Nova Sessão</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Student */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <User size={12} className="inline mr-1" />Aluno
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Selecione um aluno…</option>
              {activeStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <FileText size={12} className="inline mr-1" />Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Sessão de Musculação"
              className={INPUT_CLS}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              <Calendar size={12} className="inline mr-1" />Data
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={INPUT_CLS}
            />
          </div>

          {/* Times */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Clock size={12} className="inline mr-1" />Início
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Clock size={12} className="inline mr-1" />Fim
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Observações</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Observações opcionais…"
              className={`${INPUT_CLS} resize-none`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-5 pt-0">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={createSession.isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {createSession.isPending ? 'Agendando…' : 'Agendar'}
          </button>
        </div>
      </div>
    </div>
  );
}
