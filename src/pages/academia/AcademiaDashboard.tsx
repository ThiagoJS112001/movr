import { Building2, Star, Users, Send, TrendingUp, UserPlus, RefreshCw, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAcademiaStats, useGymRatings } from '../../hooks/useAcademia';
import { useGymGroups, useGymGroupMessages } from '../../hooks/useGymGroups';
import { Skeleton } from '../../components/ui';

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bg,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  bg: string;
  loading?: boolean;
}) {
  return (
    <div className={`rounded-2xl border p-4 ${bg}`}>
      <Icon size={20} className={`${color} mb-2`} />
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <p className="text-2xl font-bold dark:text-white">{value}</p>
      )}
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

export default function AcademiaDashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading: statsLoading } = useAcademiaStats();
  const { data: ratings = [] } = useGymRatings();
  const { data: groups = [] } = useGymGroups();
  const firstGroupId = groups[0]?.id ?? null;
  const { data: recentOffers = [] } = useGymGroupMessages(firstGroupId);

  const avgRating =
    ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
      : 0;

  const statsCards = [
    {
      label: 'Membros ativos',
      value: stats?.activeMembers ?? 'n/a',
      icon: Users,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/30',
    },
    {
      label: 'Receita do mes',
      value:
        stats !== undefined
          ? stats.monthlyRevenue.toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            })
          : 'n/a',
      icon: DollarSign,
      color: 'text-violet-400',
      bg: 'bg-violet-500/10 border-violet-500/30',
    },
    {
      label: 'Novos (30 dias)',
      value: stats?.newMembersLast30Days ?? 'n/a',
      icon: UserPlus,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/30',
    },
    {
      label: 'Taxa de renovacao',
      value: stats !== undefined ? `${stats.renewalRate}%` : 'n/a',
      icon: RefreshCw,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10 border-yellow-500/30',
    },
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
            {user?.name ?? 'Minha Academia'}
          </h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsCards.map(({ label, value, icon, color, bg }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            icon={icon}
            color={color}
            bg={bg}
            loading={statsLoading}
          />
        ))}
      </div>

      {/* Ratings */}
      {ratings.length > 0 && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Avaliacao dos alunos
          </h2>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold dark:text-white">{avgRating.toFixed(1)}</span>
            <div>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(avgRating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-slate-300 dark:text-slate-600'
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {ratings.length} {ratings.length === 1 ? 'avaliacao' : 'avaliacoes'}
              </p>
            </div>
          </div>
          {ratings.filter((r) => r.comment).length > 0 && (
            <div className="mt-4 space-y-3">
              {ratings
                .filter((r) => r.comment)
                .slice(0, 3)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/[0.06]"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={12}
                            className={
                              s <= r.rating
                                ? 'text-yellow-400 fill-yellow-400'
                                : 'text-slate-300 dark:text-slate-600'
                            }
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {r.userName}
                      </span>
                    </div>
                    <p className="text-sm dark:text-slate-200">{r.comment}</p>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Groups summary */}
      {groups.length > 0 && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5 mb-6">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Meus grupos
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {groups.slice(0, 6).map((g) => (
              <div
                key={g.id}
                className="p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40 rounded-xl"
              >
                <p className="text-sm font-semibold dark:text-white truncate">{g.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {g.memberCount} {g.memberCount === 1 ? 'membro' : 'membros'}
                </p>
              </div>
            ))}
          </div>
          {groups.length > 6 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-3">
              + {groups.length - 6} grupos
            </p>
          )}
        </div>
      )}

      {/* Recent offers */}
      {recentOffers.length > 0 && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">
            Ultimas ofertas enviadas
          </h2>
          <div className="space-y-3">
            {recentOffers.slice(0, 5).map((msg) => (
              <div
                key={msg.id}
                className="flex items-start gap-3 p-3 bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-700/40 rounded-xl"
              >
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

      {/* Empty state */}
      {groups.length === 0 && recentOffers.length === 0 && ratings.length === 0 && (
        <div className="bg-white dark:bg-[#0D1025] rounded-2xl border border-slate-100 dark:border-white/[0.07] shadow-sm p-8 text-center">
          <TrendingUp size={32} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-semibold dark:text-white mb-1">Comece a usar o MOVR!</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Crie grupos em <strong>Grupos &amp; Ofertas</strong>, adicione membros e comece a enviar promocoes.
          </p>
        </div>
      )}
    </div>
  );
}