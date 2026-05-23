import { CreditCard, Check, Zap, Star, Shield } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Plan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight?: boolean;
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    price: 'R$ 0',
    period: '/mÃªs',
    description: 'Para comeÃ§ar e explorar a plataforma',
    cta: 'Plano atual',
    features: [
      'Acesso aos seus treinos',
      'Dieta do seu personal',
      'Chat com personal',
      'HistÃ³rico de treinos',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'R$ 29,90',
    period: '/mÃªs',
    description: 'Para alunos que querem mais recursos',
    highlight: true,
    cta: 'Assinar Pro',
    features: [
      'Tudo do plano gratuito',
      'RelatÃ³rios de progresso avanÃ§ados',
      'NotificaÃ§Ãµes personalizadas',
      'Grupos e comunidade',
      'Agenda e lembretes de treino',
      'Suporte prioritÃ¡rio',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 'R$ 59,90',
    period: '/mÃªs',
    description: 'ExperiÃªncia completa com personal exclusivo',
    cta: 'Assinar Premium',
    features: [
      'Tudo do plano Pro',
      'Personal trainer dedicado',
      'AvaliaÃ§Ãµes fÃ­sicas ilimitadas',
      'Planos de treino personalizados',
      'Consultas nutricionais',
      'Acesso antecipado a novidades',
    ],
  },
];

const PLAN_ICONS: Record<string, React.ReactNode> = {
  free:    <Shield size={18} className="text-slate-400" />,
  pro:     <Zap size={18} className="text-[#7c5cfc]" />,
  premium: <Star size={18} className="text-amber-400" />,
};

export default function AlunoAssinaturaPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Current plan â€” free by default until payment backend is connected
  const currentPlan = 'free';

  function handleSubscribe(planId: string) {
    if (planId === currentPlan) return;

    // TODO: replace with real Stripe checkout call
    // The endpoint below expects a POST to your Supabase Edge Function
    // which creates a Stripe Checkout Session and returns a redirect URL.
    // Requires VITE_STRIPE_PUBLIC_KEY in your .env and the edge function deployed.
    toast.info('Checkout em breve', {
      description: 'IntegraÃ§Ã£o com Stripe serÃ¡ habilitada em breve.',
    });
  }

  return (
    <div className="min-h-screen bg-[#080B18] text-white px-4 pt-5 pb-12 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-xl bg-[#7c5cfc]/10 flex items-center justify-center">
          <CreditCard size={18} className="text-[#7c5cfc]" />
        </div>
        <div>
          <h1 className="text-xl font-bold leading-none">Assinatura</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gerencie seu plano e cobranÃ§as</p>
        </div>
      </div>

      {/* Current plan banner */}
      <div className="mt-5 mb-7 p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#0D1025] flex items-center justify-center">
          {PLAN_ICONS[currentPlan]}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-white">
            Plano atual:{' '}
            <span className="text-[#7c5cfc]">
              {PLANS.find((p) => p.id === currentPlan)?.name}
            </span>
          </p>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.name} Â· {user?.email}
          </p>
        </div>
        <span className="text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-full font-medium">
          Ativo
        </span>
      </div>

      {/* Plans grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-2xl border p-5 transition-all ${
                plan.highlight
                  ? 'border-[#7c5cfc]/60 bg-[#7c5cfc]/5 shadow-lg shadow-[#7c5cfc]/10'
                  : 'border-white/[0.08] bg-white/[0.02]'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-bold bg-[#7c5cfc] text-white px-3 py-0.5 rounded-full">
                  Popular
                </span>
              )}

              <div className="flex items-center gap-2 mb-3">
                {PLAN_ICONS[plan.id]}
                <p className="text-sm font-bold text-white">{plan.name}</p>
              </div>

              <div className="mb-1">
                <span className="text-2xl font-extrabold text-white">{plan.price}</span>
                <span className="text-slate-500 text-xs">{plan.period}</span>
              </div>
              <p className="text-xs text-slate-500 mb-5">{plan.description}</p>

              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-slate-300">
                    <Check size={12} className="text-emerald-400 mt-0.5 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  if (plan.id === 'free') {
                    navigate('/aluno/personais');
                  } else {
                    handleSubscribe(plan.id);
                  }
                }}
                disabled={isCurrent}
                className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isCurrent
                    ? 'bg-white/[0.05] text-slate-600 cursor-default'
                    : plan.highlight
                    ? 'bg-[#7c5cfc] hover:bg-[#9b7fff] text-white'
                    : 'border border-white/20 text-white hover:bg-white/[0.06]'
                }`}
              >
                {isCurrent ? 'Plano atual' : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* FAQ / info */}
      <div className="mt-8 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
        <p className="text-xs text-slate-400 text-center">
          Os planos pagos serÃ£o habilitados em breve. Pagamentos processados com seguranÃ§a via{' '}
          <span className="text-white font-medium">Stripe</span>. Cancele a qualquer momento.
        </p>
      </div>
    </div>
  );
}
