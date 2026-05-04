import { useState, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  CheckCircle2,
  CreditCard,
  Zap,
  FileText,
  Lock,
  ShieldCheck,
  Copy,
  Printer,
  Tag,
  QrCode,
  Clock,
  Star,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type PayMethod = 'cartao' | 'pix' | 'boleto';

interface Plan {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  perLabel: string;
}

interface ProfileSummary {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
  title: string;
  rating: number;
  specialties: string[];
  modality: 'online' | 'presencial' | 'ambos';
  plans: Plan[];
}

interface NavState {
  planId?: string;
  day?: number | null;
  hour?: string | null;
  monthName?: string;
}

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_PROFILES: Record<string, ProfileSummary> = {
  '1': {
    id: '1',
    name: 'Rafael Costa',
    initials: 'RC',
    avatarColor: 'from-violet-500 to-indigo-600',
    title: 'Personal Trainer · Nutricionista',
    rating: 4.9,
    specialties: ['Musculação', 'Nutrição', 'Emagrecimento', 'Funcional', 'Hipertrofia'],
    modality: 'ambos',
    plans: [
      { id: 'avulso',  name: 'Sessão avulsa',          subtitle: '1 sessão presencial ou online · Sem compromisso',                          price: 120, perLabel: 'sessão' },
      { id: 'mensal3', name: 'Plano mensal · 3×/semana', subtitle: '12 sessões + treinos + acompanhamento nutricional',                        price: 350, perLabel: 'mês'    },
      { id: 'mensal5', name: 'Plano mensal · 5×/semana', subtitle: '20 sessões + treinos + dieta + acesso ilimitado ao chat',                   price: 520, perLabel: 'mês'    },
    ],
  },
  '2': {
    id: '2',
    name: 'Ana Martins',
    initials: 'AM',
    avatarColor: 'from-emerald-500 to-teal-600',
    title: 'Personal Trainer',
    rating: 4.8,
    specialties: ['Emagrecimento', 'Funcional', 'Corrida', 'Pilates'],
    modality: 'presencial',
    plans: [
      { id: 'avulso',  name: 'Sessão avulsa',           subtitle: '1 sessão presencial · Sem compromisso',              price: 90,  perLabel: 'sessão' },
      { id: 'mensal3', name: 'Plano mensal · 3×/semana', subtitle: '12 sessões + plano de treino personalizado',          price: 280, perLabel: 'mês'    },
    ],
  },
};

const VALID_COUPONS: Record<string, number> = {
  MOVR10: 10,
  MOVR20: 20,
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatCardNumber(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
}

function cardDisplayNumber(raw: string): string {
  const clean = raw.replace(/\D/g, '').slice(0, 16).padEnd(16, '•');
  return `${clean.slice(0, 4)}  ${clean.slice(4, 8)}  ${clean.slice(8, 12)}  ${clean.slice(12, 16)}`;
}

function modalityLabel(m: 'online' | 'presencial' | 'ambos'): string {
  if (m === 'ambos') return 'Online + Presencial';
  if (m === 'online') return 'Apenas Online';
  return 'Apenas Presencial';
}

function fmtBRL(n: number): string {
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function fmtBRLShort(n: number): string {
  return n % 1 === 0 ? String(n) : fmtBRL(n);
}

// ── Stepper ────────────────────────────────────────────────────────────────────

const STEPS = ['Escolha do plano', 'Agendamento', 'Pagamento', 'Confirmação'];

function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start px-1">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const done   = n < current;
        const active = n === current;
        return (
          <div key={label} className={`flex items-center ${i < STEPS.length - 1 ? 'flex-1' : ''}`}>
            <div className="flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                  done   ? 'bg-[#22c55e] text-white' :
                  active ? 'bg-[#7c5cfc] text-white' :
                           'bg-white/8 text-slate-600 border border-white/10'
                }`}
              >
                {done ? <CheckCircle2 size={13} /> : n}
              </div>
              <span className={`text-[9px] font-medium text-center leading-tight px-0.5 ${
                done   ? 'text-[#22c55e]' :
                active ? 'text-white'     :
                         'text-slate-600'
              }`}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 mb-5 rounded-full transition-colors ${
                n < current ? 'bg-[#22c55e]' : 'bg-white/8'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function SectionCard({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#131722] border border-white/5 rounded-2xl overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
        <div className="w-6 h-6 rounded-full bg-[#7c5cfc] flex items-center justify-center text-xs font-bold text-white shrink-0">
          {number}
        </div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>
      </div>
      <div className="p-5">
        {children}
      </div>
    </div>
  );
}

// ── Mini info card ─────────────────────────────────────────────────────────────

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#0d0f14] rounded-xl p-3">
      <p className="text-[9px] text-slate-600 uppercase tracking-wide mb-1 leading-tight">{label}</p>
      <p className="text-xs font-medium text-slate-200 leading-snug">{value}</p>
    </div>
  );
}

// ── Card preview ───────────────────────────────────────────────────────────────

function CardPreview({ number, name, expiry }: { number: string; name: string; expiry: string }) {
  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden relative bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-5 flex flex-col justify-between">
      {/* decorative blobs */}
      <div className="absolute w-48 h-48 rounded-full bg-white/10 -right-12 -top-12 pointer-events-none" />
      <div className="absolute w-32 h-32 rounded-full bg-white/8 -right-6 -top-6 pointer-events-none" />

      {/* Top row: chip + network */}
      <div className="flex items-center justify-between relative z-10">
        <div className="w-10 h-7 rounded-md bg-amber-400/80 flex items-center justify-center overflow-hidden">
          <div className="w-7 h-4 rounded-sm border border-amber-200/40 grid grid-cols-2 gap-px p-px">
            <div className="bg-amber-200/20 rounded-sm" />
            <div className="bg-amber-200/20 rounded-sm" />
            <div className="bg-amber-200/20 rounded-sm" />
            <div className="bg-amber-200/20 rounded-sm" />
          </div>
        </div>
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-red-400/80" />
          <div className="w-6 h-6 rounded-full bg-amber-400/80 -ml-2.5 mix-blend-overlay" />
        </div>
      </div>

      {/* Card number */}
      <p className="font-mono text-white tracking-[0.18em] text-sm relative z-10 select-none">
        {cardDisplayNumber(number)}
      </p>

      {/* Bottom row */}
      <div className="flex items-end justify-between relative z-10">
        <div>
          <p className="text-white/40 text-[8px] uppercase tracking-widest mb-0.5">Nome</p>
          <p className="text-white font-medium text-xs tracking-wide uppercase truncate max-w-[160px]">
            {name || 'SEU NOME'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-white/40 text-[8px] uppercase tracking-widest mb-0.5">Validade</p>
          <p className="text-white font-medium text-xs">{expiry || 'MM/AA'}</p>
        </div>
      </div>
    </div>
  );
}

// ── Pix panel ─────────────────────────────────────────────────────────────────

function PixPanel({ price }: { price: number }) {
  const [copied, setCopied] = useState(false);
  const pixKey = 'pagamentos@movr.app.br';

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* QR code */}
      <div className="flex justify-center">
        <div className="w-44 h-44 bg-white rounded-2xl flex items-center justify-center">
          <QrCode size={120} className="text-[#0d0f14]" />
        </div>
      </div>

      <p className="text-center text-xs text-slate-500">
        Aponte a câmera do seu app bancário para o QR Code
      </p>

      {/* Pix key */}
      <div className="bg-[#0d0f14] border border-white/8 rounded-xl p-4">
        <p className="text-xs text-slate-500 mb-1">Chave Pix</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm text-white font-mono">{pixKey}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#7c5cfc]/15 text-[#7c5cfc] text-xs font-medium flex items-center gap-1.5 hover:bg-[#7c5cfc]/25 transition-colors"
          >
            {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-500/5 border border-amber-500/15 rounded-xl p-3">
        <Clock size={13} className="text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-400 leading-relaxed">
          QR Code válido por{' '}
          <strong className="text-amber-400">30 minutos</strong>. Após o pagamento, confirmação em até 1 minuto.
        </p>
      </div>

      <p className="text-center text-sm font-bold text-white">R$ {fmtBRL(price)}</p>
    </div>
  );
}

// ── Boleto panel ──────────────────────────────────────────────────────────────

const BOLETO_LINE = '10499.99999 99999.999999 99999.999999 1 99990000035000';

// Fixed bar pattern for deterministic barcode look
const BAR_PATTERN = [2,1,3,1,2,2,1,3,1,2,1,3,2,1,3,1,1,2,3,1,2,1,3,1,2,3,1,2,1,3,2,1,1,3,2,1,3,1,2,1,3,2,1,1,2,3];

function BoletoPanel() {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4">
      {/* Barcode visual */}
      <div className="bg-white rounded-xl p-4 flex items-end justify-center h-24 overflow-hidden gap-px">
        {BAR_PATTERN.map((w, i) => (
          <div
            key={i}
            style={{ width: `${w * 2}px`, height: i % 11 === 0 ? '75%' : '90%' }}
            className={i % 2 === 0 ? 'bg-black rounded-sm' : 'bg-transparent'}
          />
        ))}
      </div>

      {/* Boleto number */}
      <div className="bg-[#0d0f14] border border-white/8 rounded-xl p-4">
        <p className="text-xs text-slate-500 mb-1">Código de barras</p>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-slate-300 font-mono truncate">{BOLETO_LINE}</p>
          <button
            onClick={handleCopy}
            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#7c5cfc]/15 text-[#7c5cfc] text-xs font-medium flex items-center gap-1.5 hover:bg-[#7c5cfc]/25 transition-colors"
          >
            {copied ? <CheckCircle2 size={11} /> : <Copy size={11} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Vence em <strong className="text-slate-300">3 dias úteis</strong>
        </p>
        <button className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
          <Printer size={13} />
          Imprimir boleto
        </button>
      </div>

      <p className="text-xs text-slate-600 text-center leading-relaxed">
        O pagamento pode levar até 3 dias úteis para ser confirmado.
      </p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as NavState;

  const profile = MOCK_PROFILES[id ?? ''] ?? MOCK_PROFILES['1'];

  const defaultPlan =
    profile.plans.find((p) => p.id === state.planId) ??
    profile.plans.find((p) => p.id === 'mensal3') ??
    profile.plans[0];

  const [selectedPlan, setSelectedPlan] = useState<Plan>(defaultPlan);
  const [showPlanPicker, setShowPlanPicker] = useState(false);
  const [payMethod, setPayMethod] = useState<PayMethod>('cartao');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName]     = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv]       = useState('');
  const [installments, setInstallments] = useState('1');

  // Coupon
  const [couponInput, setCouponInput]           = useState('');
  const [appliedDiscount, setAppliedDiscount]   = useState(0);
  const [appliedCode, setAppliedCode]           = useState('');
  const [couponError, setCouponError]           = useState('');

  // Flow
  const [pageStep, setPageStep] = useState<'payment' | 'processing' | 'success'>('payment');

  // Derived
  const day       = state.day ?? null;
  const hour      = state.hour ?? null;
  const monthName = state.monthName ?? 'Maio';

  const basePrice      = selectedPlan.price;
  const discountAmount = Math.round(basePrice * appliedDiscount / 100);
  const total          = basePrice - discountAmount;

  const installmentOptions = useMemo(() => {
    const opts = [{ v: '1', label: `1× de R$ ${fmtBRL(total)} (sem juros)` }];
    if (total >= 200) opts.push({ v: '2', label: `2× de R$ ${fmtBRL(total / 2)} (sem juros)` });
    if (total >= 300) opts.push({ v: '3', label: `3× de R$ ${fmtBRL(total / 3)} (sem juros)` });
    return opts;
  }, [total]);

  function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    const pct  = VALID_COUPONS[code];
    if (pct !== undefined) {
      setAppliedDiscount(pct);
      setAppliedCode(code);
      setCouponError('');
    } else {
      setAppliedDiscount(0);
      setAppliedCode('');
      setCouponError('Cupom inválido ou expirado.');
    }
  }

  function handleRemoveCoupon() {
    setAppliedDiscount(0);
    setAppliedCode('');
    setCouponInput('');
    setCouponError('');
  }

  function handleConfirm() {
    setPageStep('processing');
    setTimeout(() => setPageStep('success'), 1800);
  }

  // ── Success view ───────────────────────────────────────────────────────────

  if (pageStep === 'success') {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full bg-[#22c55e]/15 flex items-center justify-center">
            <CheckCircle2 size={40} className="text-[#22c55e]" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-white">Pagamento confirmado!</h1>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {profile.name} agora acompanha seu progresso.
              <br />
              Seus treinos foram desbloqueados.
            </p>
          </div>

          <div className="bg-[#131722] border border-white/5 rounded-2xl p-4 text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {profile.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-slate-500">{profile.title}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">{selectedPlan.name}</p>
                {day && (
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    1ª sessão: {day} de {monthName}{hour ? ` · ${hour}` : ''}
                  </p>
                )}
              </div>
              <p className="text-sm font-bold text-[#22c55e]">R$ {fmtBRL(total)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => navigate('/aluno/treino')}
              className="w-full py-4 rounded-xl text-sm font-bold bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white transition-colors"
            >
              Ver Meus Treinos
            </button>
            <button
              onClick={() => navigate('/aluno/dashboard')}
              className="w-full py-3 rounded-xl text-sm font-medium text-slate-500 hover:text-white transition-colors"
            >
              Voltar para o início
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Processing view ────────────────────────────────────────────────────────

  if (pageStep === 'processing') {
    return (
      <div className="min-h-screen bg-[#0d0f14] text-white flex flex-col items-center justify-center gap-5">
        <div className="w-14 h-14 border-2 border-[#7c5cfc] border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Processando pagamento…</p>
      </div>
    );
  }

  // ── Payment view ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d0f14] text-white">
      <div className="max-w-lg mx-auto px-4 pt-5 pb-10 space-y-4">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 bg-[#131722] border border-white/8 rounded-xl px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <ChevronLeft size={15} />
            Voltar
          </button>
          <span className="text-sm text-slate-500">{profile.name} / Checkout</span>
        </div>

        {/* Stepper */}
        <Stepper current={3} />

        {/* ── Section 1: Contract summary ─────────────────────────────────── */}
        <SectionCard number={1} title="Resumo da contratação">
          {/* Personal header */}
          <div className="flex items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${profile.avatarColor} flex items-center justify-center text-white font-bold shrink-0`}>
                {profile.initials}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{profile.name}</p>
                <p className="text-xs text-slate-500">{profile.title}</p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {profile.specialties.slice(0, 2).map((s) => (
                    <span key={s} className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-[#7c5cfc]/10 border border-[#7c5cfc]/20 text-[#7c5cfc]">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Star size={13} fill="#f59e0b" className="text-amber-400" />
              <span className="text-sm font-bold text-white">{profile.rating}</span>
            </div>
          </div>

          {/* Plan box */}
          <div className="bg-[#0d0f14] border border-white/8 rounded-xl p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-white">{selectedPlan.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{selectedPlan.subtitle}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-[#7c5cfc]">R$ {selectedPlan.price}</p>
                <p className="text-[10px] text-slate-500">/{selectedPlan.perLabel}</p>
              </div>
            </div>
            <button
              onClick={() => setShowPlanPicker((v) => !v)}
              className="mt-3 text-xs font-medium text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            >
              Trocar plano
            </button>

            {/* Plan picker */}
            {showPlanPicker && (
              <div className="mt-3 space-y-2 pt-3 border-t border-white/5">
                {profile.plans.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => { setSelectedPlan(plan); setShowPlanPicker(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl border transition-all ${
                      selectedPlan.id === plan.id
                        ? 'border-[#7c5cfc] bg-[#7c5cfc]/8'
                        : 'border-white/8 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-white">{plan.name}</span>
                      <span className="text-xs font-bold text-[#7c5cfc] shrink-0">R$ {plan.price}/{plan.perLabel}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Mini info cards */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <MiniCard
              label="1ª sessão agendada"
              value={day ? `${day} de ${monthName}, 2026` : 'A definir'}
            />
            <MiniCard
              label="Horário"
              value={hour ? `${hour} · ${profile.modality === 'online' ? 'Online' : 'Presencial'}` : 'A definir'}
            />
            <MiniCard
              label="Modalidade"
              value={modalityLabel(profile.modality)}
            />
          </div>
        </SectionCard>

        {/* ── Section 2: Payment method ────────────────────────────────────── */}
        <SectionCard number={2} title="Forma de pagamento">
          {/* Payment tabs */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {(
              [
                { key: 'cartao', label: 'Cartão',  Icon: CreditCard, iconClass: 'text-blue-400' },
                { key: 'pix',    label: 'Pix',     Icon: Zap,        iconClass: 'text-[#22c55e]' },
                { key: 'boleto', label: 'Boleto',  Icon: FileText,   iconClass: 'text-slate-400' },
              ] as { key: PayMethod; label: string; Icon: React.FC<{ size?: number; className?: string }>; iconClass: string }[]
            ).map(({ key, label, Icon, iconClass }) => (
              <button
                key={key}
                onClick={() => setPayMethod(key)}
                className={`flex flex-col items-center gap-1.5 py-3.5 rounded-xl border transition-all ${
                  payMethod === key
                    ? 'border-[#7c5cfc] bg-[#7c5cfc]/8'
                    : 'border-white/8 hover:border-white/20'
                }`}
              >
                <Icon size={20} className={payMethod === key ? iconClass : 'text-slate-500'} />
                <span className={`text-xs font-medium ${payMethod === key ? 'text-white' : 'text-slate-500'}`}>
                  {label}
                </span>
              </button>
            ))}
          </div>

          {/* Cartão form */}
          {payMethod === 'cartao' && (
            <div className="space-y-4">
              <CardPreview number={cardNumber} name={cardName} expiry={cardExpiry} />

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Número do cartão</label>
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="0000 0000 0000 0000"
                    maxLength={19}
                    inputMode="numeric"
                    className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#7c5cfc]/40 transition-colors font-mono tracking-widest"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Nome no cartão</label>
                  <input
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value.toUpperCase())}
                    placeholder="Como está no cartão"
                    className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#7c5cfc]/40 transition-colors uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">Validade</label>
                    <input
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/AA"
                      maxLength={5}
                      inputMode="numeric"
                      className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#7c5cfc]/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 mb-1.5 block">CVV</label>
                    <input
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      placeholder="• • •"
                      maxLength={4}
                      inputMode="numeric"
                      type="password"
                      className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-[#7c5cfc]/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 mb-1.5 block">Parcelamento</label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(e.target.value)}
                    className="w-full bg-[#0d0f14] border border-white/8 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#7c5cfc]/40 transition-colors appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23718096' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center' }}
                  >
                    {installmentOptions.map((o) => (
                      <option key={o.v} value={o.v}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Pix */}
          {payMethod === 'pix' && <PixPanel price={total} />}

          {/* Boleto */}
          {payMethod === 'boleto' && <BoletoPanel />}
        </SectionCard>

        {/* ── Order summary ────────────────────────────────────────────────── */}
        <div className="bg-[#131722] border border-white/5 rounded-2xl p-5 space-y-4">
          <h3 className="font-semibold text-white">Resumo do pedido</h3>

          {/* Line items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">{selectedPlan.name}</span>
              <span className="text-white">R$ {fmtBRL(basePrice)}</span>
            </div>
            {appliedDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#22c55e]">Cupom {appliedCode} ({appliedDiscount}% off)</span>
                <span className="text-[#22c55e]">− R$ {fmtBRL(discountAmount)}</span>
              </div>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Taxa de serviço Movr</span>
              <span className="text-white">R$ 0,00</span>
            </div>
          </div>

          {/* Total */}
          <div className="pt-3 border-t border-white/5 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold text-white">Total hoje</p>
              {selectedPlan.perLabel === 'mês' && (
                <p className="text-[10px] text-slate-600 mt-0.5">Renovação automática em 30 dias</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#7c5cfc]">R$ {fmtBRLShort(total)}</p>
            </div>
          </div>

          {/* Coupon */}
          <div>
            {!appliedCode ? (
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  <input
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      setCouponError('');
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCoupon(); }}
                    placeholder="Cupom de desconto"
                    className="w-full bg-[#0d0f14] border border-white/8 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-[#7c5cfc]/40 transition-colors"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  disabled={!couponInput.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#0d0f14] border border-white/8 hover:border-[#7c5cfc]/40 text-slate-300 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Aplicar
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-[#22c55e]/8 border border-[#22c55e]/20 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-[#22c55e]" />
                  <span className="text-sm font-medium text-[#22c55e]">
                    {appliedCode} — {appliedDiscount}% de desconto
                  </span>
                </div>
                <button
                  onClick={handleRemoveCoupon}
                  className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  Remover
                </button>
              </div>
            )}
            {couponError && (
              <p className="text-xs text-red-400 mt-1.5">{couponError}</p>
            )}
          </div>

          {/* 7-day guarantee */}
          <div className="flex items-start gap-2.5 bg-[#22c55e]/5 border border-[#22c55e]/15 rounded-xl p-3">
            <ShieldCheck size={15} className="text-[#22c55e] shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-[#22c55e]">Garantia de 7 dias.</strong>{' '}
              Se não ficar satisfeito com o primeiro atendimento, devolvemos 100% do valor pago.
            </p>
          </div>

          {/* Confirm button */}
          <button
            onClick={handleConfirm}
            className="w-full py-4 rounded-xl text-sm font-bold bg-[#7c5cfc] hover:bg-[#6d4ef0] text-white transition-colors flex items-center justify-center gap-2"
          >
            <CreditCard size={16} />
            Confirmar pagamento
          </button>

          {/* Security */}
          <p className="text-center text-[11px] text-slate-600 flex items-center justify-center gap-1.5">
            <Lock size={10} />
            Pagamento 100% seguro · SSL · PCI DSS
          </p>
        </div>
      </div>
    </div>
  );
}
