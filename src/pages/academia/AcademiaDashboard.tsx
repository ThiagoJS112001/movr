import { Building2, Star, Users, Send, TrendingUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function AcademiaDashboard() {
  const { user } = useAuth();

  // Academia features (gym ratings, groups, messages) not yet migrated to Supabase
  const gym = undefined as { name?: string; city?: string; state?: string } | undefined;
  const avgRating = 0;
  const myRatings: { id: string }[] = [];
  const myOffers: { id: string; content: string; createdAt: string }[] = [];
  const studentGroups: unknown[] = [];

  const stats = [
    { label: 'Avaliação média', value: avgRating > 0 ? avgRating.toFixed(1) : '—', icon: Star, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    { label: 'Avaliações recebidas', value: myRatings.length, icon: TrendingUp, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
    { label: 'Grupos no app', value: studentGroups.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    { label: 'Ofertas enviadas', value: myOffers.length, icon: Send, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <div className="bg-violet-600/20 border border-violet-500/30 p-2 rounded-xl">
            <Building2 size={22} className="text-violet-400" />
          </div>
          <h1 className="text-3xl font-bold dark:text-white">
            {gym?.name ?? user?.name ?? 'Minha Academia'}
          </h1>
        </div>
        {gym?.city && (
          <p className="text-slate-500 dark:text-slate-400 ml-1">
            {gym.city}{gym.state ? `, ${gym.state}` : ''}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl border p-4 ${bg}`}>
            <Icon size={20} className={`${color} mb-2`} />
            <p className="text-2xl font-bold dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Star rating display */}
      {avgRating > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Avaliação dos alunos
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold dark:text-white">{avgRating.toFixed(1)}</span>
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={star <= Math.round(avgRating) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300 dark:text-slate-600'}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {myRatings.length} {myRatings.length === 1 ? 'avaliação' : 'avaliações'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent offers */}
      {myOffers.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Últimas ofertas enviadas
          </h2>
          <div className="space-y-3">
            {myOffers.slice(-5).reverse().map((msg) => (
              <div key={msg.id} className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40 rounded-xl">
                <Send size={14} className="text-violet-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm dark:text-white">{msg.content}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {new Date(msg.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state when no offers */}
      {myOffers.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700/60 shadow-sm p-8 text-center">
          <Send size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold dark:text-white mb-1">Nenhuma oferta enviada ainda</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Acesse <strong>Grupos & Ofertas</strong> para enviar promoções aos grupos de alunos.
          </p>
        </div>
      )}
    </div>
  );
}
