import { useState, useMemo } from 'react';
import { usePayments, useCreatePayment, useMarkPaymentPaid, useDeletePayment } from '../../hooks/usePayments';
import { useStudents } from '../../hooks/useStudents';
import { toast } from 'sonner';
import {
  DollarSign, Plus, Check, Trash2, AlertTriangle,
  TrendingUp, Clock, XCircle, Filter, X,
} from 'lucide-react';
import type { StudentPayment, PaymentStatus } from '../../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_META: Record<PaymentStatus, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pendente: { label: 'Pendente', color: 'text-amber-400',   bg: 'bg-amber-500/15',   icon: <Clock size={12} /> },
  pago:     { label: 'Pago',     color: 'text-emerald-400', bg: 'bg-emerald-500/15', icon: <Check size={12} /> },
  vencido:  { label: 'Vencido',  color: 'text-red-400',     bg: 'bg-red-500/15',     icon: <AlertTriangle size={12} /> },
  cancelado:{ label: 'Cancelado',color: 'text-slate-400',   bg: 'bg-slate-500/15',   icon: <XCircle size={12} /> },
};

const PAYMENT_METHODS = ['Pix', 'Dinheiro', 'Cartão de Crédito', 'Cartão de Débito', 'Transferência'];

const INPUT_CLS =
  'w-full bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-colors';

// ── Component ─────────────────────────────────────────────────────────────────

export default function PersonalFinanceiroPage() {
  const { data: payments = [], isLoading } = usePayments();
  const { data: students = [] } = useStudents();
  const createPayment = useCreatePayment();
  const markPaid = useMarkPaymentPaid();
  const deletePayment = useDeletePayment();

  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'todos'>('todos');
  const [filterStudent, setFilterStudent] = useState('');

  // Bulk billing state
  const [bulkDesc, setBulkDesc] = useState('Mensalidade');
  const [bulkAmount, setBulkAmount] = useState('');
  const [bulkDueDate, setBulkDueDate] = useState('');
  const [bulkStudents, setBulkStudents] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  async function handleBulkCreate() {
    if (!bulkAmount || !bulkDueDate || bulkStudents.length === 0) return;
    setBulkLoading(true);
    let ok = 0;
    for (const sid of bulkStudents) {
      try {
        await createPayment.mutateAsync({ studentId: sid, description: bulkDesc || 'Mensalidade', amount: parseFloat(bulkAmount), dueDate: bulkDueDate });
        ok++;
      } catch { /* continue */ }
    }
    setBulkLoading(false);
    toast.success(`${ok} cobrança${ok !== 1 ? 's' : ''} criada${ok !== 1 ? 's' : ''}!`);
    setShowBulk(false);
    setBulkStudents([]);
    setBulkAmount('');
    setBulkDueDate('');
  }

  // Form state
  const [fStudentId, setFStudentId]   = useState('');
  const [fDesc, setFDesc]             = useState('Mensalidade');
  const [fAmount, setFAmount]         = useState('');
  const [fDueDate, setFDueDate]       = useState('');
  const [fMethod, setFMethod]         = useState('');
  const [fNotes, setFNotes]           = useState('');

  // Compute overdue (update status display based on today)
  const today = new Date().toISOString().split('T')[0];

  const enriched = useMemo(
    () =>
      payments.map((p) => ({
        ...p,
        status: (p.status === 'pendente' && p.dueDate < today ? 'vencido' : p.status) as PaymentStatus,
        studentName: p.studentName ?? students.find((s) => s.id === p.studentId)?.name ?? '—',
      })),
    [payments, students, today],
  );

  const filtered = useMemo(() => {
    return enriched
      .filter((p) => filterStatus === 'todos' || p.status === filterStatus)
      .filter((p) => !filterStudent || p.studentId === filterStudent)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [enriched, filterStatus, filterStudent]);

  // Summary cards
  const totalPending  = useMemo(() => enriched.filter(p => p.status === 'pendente').reduce((s,p) => s+p.amount,0), [enriched]);
  const totalOverdue  = useMemo(() => enriched.filter(p => p.status === 'vencido').reduce((s,p) => s+p.amount,0), [enriched]);
  const totalPaidMonth= useMemo(() => {
    const m = today.substring(0,7);
    return enriched.filter(p => p.status === 'pago' && p.paidAt?.startsWith(m)).reduce((s,p) => s+p.amount,0);
  }, [enriched, today]);

  function resetForm() {
    setFStudentId(''); setFDesc('Mensalidade'); setFAmount('');
    setFDueDate(''); setFMethod(''); setFNotes('');
  }

  async function handleCreate() {
    if (!fStudentId) { toast.error('Selecione um aluno'); return; }
    if (!fAmount || isNaN(Number(fAmount))) { toast.error('Valor inválido'); return; }
    if (!fDueDate) { toast.error('Informe o vencimento'); return; }
    if (!fDesc.trim()) { toast.error('Informe a descrição'); return; }
    try {
      await createPayment.mutateAsync({
        studentId: fStudentId,
        amount: Number(fAmount),
        description: fDesc,
        dueDate: fDueDate,
        paymentMethod: fMethod || undefined,
        notes: fNotes || undefined,
      });
      toast.success('Cobrança criada!');
      resetForm();
      setShowForm(false);
    } catch {
      toast.error('Erro ao criar cobrança');
    }
  }

  async function handleMarkPaid(id: string) {
    try {
      await markPaid.mutateAsync(id);
      toast.success('Marcado como pago');
    } catch {
      toast.error('Erro ao atualizar pagamento');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Remover esta cobrança?')) return;
    try {
      await deletePayment.mutateAsync(id);
      toast.success('Cobrança removida');
    } catch {
      toast.error('Erro ao remover cobrança');
    }
  }

  function formatCurrency(n: number) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  const activeStudents = students.filter((s) => !s.isBlocked && s.connectionStatus !== 'pending');

  return (
    <div className="p-5 max-w-screen-xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Financeiro</h1>
          <p className="text-sm text-slate-400 mt-0.5">Controle de pagamentos dos alunos</p>
        </div>
        <button
          onClick={() => setShowBulk(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} /> Cobranças em Massa
        </button>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={16} /> Nova Cobrança
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<Clock size={18} className="text-amber-400" />}
          label="A receber"
          value={formatCurrency(totalPending)}
          bg="bg-amber-500/10"
        />
        <SummaryCard
          icon={<AlertTriangle size={18} className="text-red-400" />}
          label="Vencido"
          value={formatCurrency(totalOverdue)}
          bg="bg-red-500/10"
        />
        <SummaryCard
          icon={<TrendingUp size={18} className="text-emerald-400" />}
          label="Recebido este mês"
          value={formatCurrency(totalPaidMonth)}
          bg="bg-emerald-500/10"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter size={14} className="text-slate-500" />
        {(['todos','pendente','vencido','pago','cancelado'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors
              ${filterStatus === s ? 'bg-violet-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
          >
            {s === 'todos' ? 'Todos' : STATUS_META[s].label}
          </button>
        ))}
        <select
          value={filterStudent}
          onChange={(e) => setFilterStudent(e.target.value)}
          className="ml-auto bg-[#0D1025] border border-white/[0.07] rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          <option value="">Todos os alunos</option>
          {activeStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <DollarSign size={36} className="text-slate-600 mb-3" />
          <p className="text-slate-400 text-sm">Nenhuma cobrança encontrada</p>
        </div>
      ) : (
        <div className="bg-[#0D1025] border border-white/[0.06] rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="hidden md:grid grid-cols-[1fr_1fr_100px_100px_100px_88px] gap-3 px-4 py-2.5 border-b border-white/5">
            {['Aluno','Descrição','Vencimento','Valor','Status',''].map((h) => (
              <span key={h} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{h}</span>
            ))}
          </div>
          <div className="divide-y divide-white/[0.04]">
            {filtered.map((p) => {
              const meta = STATUS_META[p.status];
              return (
                <div key={p.id} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_100px_100px_100px_88px] gap-2 md:gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-sm text-white font-medium">{p.studentName}</span>
                  <span className="text-sm text-slate-300">{p.description}</span>
                  <span className={`text-sm ${p.status === 'vencido' ? 'text-red-400 font-medium' : 'text-slate-300'}`}>
                    {new Date(p.dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </span>
                  <span className="text-sm text-white font-medium">{formatCurrency(p.amount)}</span>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium w-fit px-2 py-0.5 rounded-full ${meta.bg} ${meta.color}`}>
                    {meta.icon} {meta.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {p.status !== 'pago' && p.status !== 'cancelado' && (
                      <button
                        onClick={() => handleMarkPaid(p.id)}
                        title="Marcar como pago"
                        className="p-1.5 rounded-lg text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                      >
                        <Check size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(p.id)}
                      title="Remover"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* New payment modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0A0D1A] border border-white/[0.08] rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">Nova Cobrança</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"><X size={18} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Aluno</label>
                <select value={fStudentId} onChange={(e) => setFStudentId(e.target.value)} className={INPUT_CLS}>
                  <option value="">Selecione…</option>
                  {activeStudents.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição</label>
                <input type="text" value={fDesc} onChange={(e) => setFDesc(e.target.value)} className={INPUT_CLS} placeholder="Ex: Mensalidade Junho" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor (R$)</label>
                  <input type="number" value={fAmount} onChange={(e) => setFAmount(e.target.value)} className={INPUT_CLS} placeholder="0,00" min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Vencimento</label>
                  <input type="date" value={fDueDate} onChange={(e) => setFDueDate(e.target.value)} className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Forma de Pagamento</label>
                <select value={fMethod} onChange={(e) => setFMethod(e.target.value)} className={INPUT_CLS}>
                  <option value="">Não especificado</option>
                  {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Observações</label>
                <textarea value={fNotes} onChange={(e) => setFNotes(e.target.value)} rows={2} className={`${INPUT_CLS} resize-none`} placeholder="Opcional…" />
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={handleCreate} disabled={createPayment.isPending} className="flex-1 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                {createPayment.isPending ? 'Criando…' : 'Criar Cobrança'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk billing modal */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0D1025] border border-white/[0.07] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h2 className="text-base font-semibold text-white">Cobranças em Massa</h2>
              <button onClick={() => setShowBulk(false)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 transition-colors"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Descrição</label>
                <input value={bulkDesc} onChange={(e) => setBulkDesc(e.target.value)} className={INPUT_CLS} placeholder="Mensalidade" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Valor (R$)</label>
                  <input type="number" min="0" step="0.01" value={bulkAmount} onChange={(e) => setBulkAmount(e.target.value)} className={INPUT_CLS} placeholder="150,00" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Vencimento</label>
                  <input type="date" value={bulkDueDate} onChange={(e) => setBulkDueDate(e.target.value)} className={INPUT_CLS} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium text-slate-400">Alunos</label>
                  <button
                    onClick={() => setBulkStudents(bulkStudents.length === students.length ? [] : students.map((s) => s.id))}
                    className="text-xs text-violet-400 hover:text-violet-300"
                  >
                    {bulkStudents.length === students.length ? 'Desmarcar todos' : 'Selecionar todos'}
                  </button>
                </div>
                <div className="divide-y divide-white/[0.05] border border-white/[0.07] rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                  {students.map((s) => (
                    <label key={s.id} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.04] transition-colors">
                      <input
                        type="checkbox"
                        checked={bulkStudents.includes(s.id)}
                        onChange={(e) => setBulkStudents(e.target.checked ? [...bulkStudents, s.id] : bulkStudents.filter((id) => id !== s.id))}
                        className="accent-violet-500"
                      />
                      <span className="text-sm text-slate-200">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 p-5 pt-0">
              <button onClick={() => setShowBulk(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors">Cancelar</button>
              <button
                onClick={handleBulkCreate}
                disabled={bulkLoading || !bulkAmount || !bulkDueDate || bulkStudents.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors disabled:opacity-50"
              >
                {bulkLoading ? 'Criando…' : `Criar ${bulkStudents.length} cobrança${bulkStudents.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value, bg }: { icon: React.ReactNode; label: string; value: string; bg: string }) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-2xl bg-[#0D1025] border border-white/[0.06]`}>
      <div className={`p-2.5 rounded-xl ${bg}`}>{icon}</div>
      <div>
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-lg font-bold text-white">{value}</p>
      </div>
    </div>
  );
}
