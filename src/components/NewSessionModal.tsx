import { useState } from 'react';
import { X, Calendar, Clock, User, FileText, Repeat } from 'lucide-react';
import { useCreateSession, useUpdateSession } from '../hooks/useSessions';
import { toast } from 'sonner';
import type { User as AppUser, TrainingSession } from '../types';

interface Props {
  defaultDate: string;
  students: AppUser[];
  onClose: () => void;
  /** Pass an existing session to enter edit mode */
  editSession?: TrainingSession;
}

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

export default function NewSessionModal({ defaultDate, students, onClose, editSession }: Props) {
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const isEdit = !!editSession;

  const [studentId, setStudentId] = useState(editSession?.studentId ?? '');
  const [title, setTitle] = useState(editSession?.title ?? 'Sessão de Treino');
  const [date, setDate] = useState(editSession?.date ?? defaultDate);
  const [startTime, setStartTime] = useState(editSession?.startTime ?? '07:00');
  const [endTime, setEndTime] = useState(editSession?.endTime ?? '08:00');
  const [notes, setNotes] = useState(editSession?.notes ?? '');
  const [repeatWeeks, setRepeatWeeks] = useState(1);
  const [showRepeat, setShowRepeat] = useState(false);

  const activeStudents = students.filter((s) => !s.isBlocked && s.connectionStatus !== 'pending');

  const isPending = createSession.isPending || updateSession.isPending;

  async function handleSave() {
    if (!isEdit && !studentId) { toast.error('Selecione um aluno'); return; }
    if (!date) { toast.error('Informe a data'); return; }
    if (!startTime || !endTime) { toast.error('Informe os horários'); return; }
    if (startTime >= endTime) { toast.error('Horário final deve ser após o início'); return; }

    try {
      if (isEdit) {
        await updateSession.mutateAsync({
          id: editSession.id,
          params: { title, date, startTime, endTime, notes: notes || null },
        });
        toast.success('Sessão atualizada!');
      } else {
        const weeks = showRepeat && repeatWeeks > 1 ? repeatWeeks : 1;
        for (let w = 0; w < weeks; w++) {
          const d = new Date(date + 'T12:00:00');
          d.setDate(d.getDate() + w * 7);
          const dateStr = d.toISOString().split('T')[0];
          await createSession.mutateAsync({ studentId, title, date: dateStr, startTime, endTime, notes: notes || undefined });
        }
        toast.success(weeks > 1 ? `${weeks} sessões agendadas!` : 'Sessão agendada!');
      }
      onClose();
    } catch {
      toast.error(isEdit ? 'Erro ao atualizar sessão' : 'Erro ao agendar sessão');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#0A0D1A] border border-white/[0.08] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
          <h2 className="text-base font-semibold text-white">{isEdit ? 'Editar Sessão' : 'Nova Sessão'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Student (only when creating) */}
          {!isEdit && (
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
          )}

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

          {/* Recurring (only when creating) */}
          {!isEdit && (
            <div>
              <button
                type="button"
                onClick={() => setShowRepeat((v) => !v)}
                className={`flex items-center gap-2 text-xs font-medium transition-colors ${showRepeat ? 'text-violet-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                <Repeat size={13} />
                Repetir semanalmente
              </button>
              {showRepeat && (
                <div className="mt-2 flex items-center gap-3">
                  <label className="text-xs text-slate-400">Repetir por</label>
                  <input
                    type="number"
                    min={2}
                    max={52}
                    value={repeatWeeks}
                    onChange={(e) => setRepeatWeeks(Math.max(2, Math.min(52, parseInt(e.target.value) || 2)))}
                    className="w-20 bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-violet-500 text-center"
                  />
                  <label className="text-xs text-slate-400">semanas</label>
                </div>
              )}
            </div>
          )}
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
            disabled={isPending}
            className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
          >
            {isPending ? (isEdit ? 'Salvando…' : 'Agendando…') : (isEdit ? 'Salvar' : (showRepeat && repeatWeeks > 1 ? `Criar ${repeatWeeks} sessões` : 'Agendar'))}
          </button>
        </div>
      </div>
    </div>
  );
}
