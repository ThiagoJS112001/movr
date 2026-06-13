import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Star,
  MapPin,
  BadgeCheck,
  Wifi,
  Dumbbell,
  Users,
  Clock,
  MessageCircle,
} from 'lucide-react';
import { useTrainerById } from '../../hooks/useTrainers';
import { Skeleton } from '../../components/ui';
import type { TrainerDetail, TrainerRating, TrainerAvailabilitySlot } from '../../services/trainers';

// -- Constants -----------------------------------------------------------------

type TabKey = 'sobre' | 'agenda' | 'avaliacoes';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'sobre', label: 'Sobre' },
  { key: 'agenda', label: 'Agenda' },
  { key: 'avaliacoes', label: 'Avaliações' },
];

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const MODALITY_ICON: Record<string, React.ReactNode> = {
  online: <Wifi size={14} />,
  presencial: <Dumbbell size={14} />,
  ambos: <Users size={14} />,
};

const MODALITY_LABEL: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  ambos: 'Online & Presencial',
};

// -- Helpers -------------------------------------------------------------------

function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const hue = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={`flex items-center justify-center font-bold text-white ${className ?? ''}`}
      style={{
        background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${(hue + 40) % 360},70%,40%))`,
      }}
    >
      {initials}
    </div>
  );
}

function StarRow({ count, size = 13 }: { count: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < count ? 'text-amber-400 fill-amber-400' : 'text-slate-300 dark:text-slate-600 fill-current'}
        />
      ))}
    </div>
  );
}

// -- Skeleton ------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 pb-12 pt-4 space-y-6 animate-pulse">
      <Skeleton className="h-6 w-24" />
      <div className="flex gap-5">
        <Skeleton className="w-24 h-24 rounded-full shrink-0" />
        <div className="flex-1 space-y-3 pt-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    </div>
  );
}

// -- Tabs ----------------------------------------------------------------------

function TabBar({
  active,
  onChange,
  ratingCount,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
  ratingCount: number;
}) {
  return (
    <div className="flex border-b border-slate-200 dark:border-slate-700 mb-6">
      {TABS.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
            active === t.key
              ? 'border-violet-600 text-violet-600 dark:text-violet-400 dark:border-violet-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
        >
          {t.label}
          {t.key === 'avaliacoes' && ratingCount > 0 && (
            <span className="ml-1.5 text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-full">
              {ratingCount}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// -- About tab -----------------------------------------------------------------

function AboutTab({ trainer }: { trainer: TrainerDetail }) {
  return (
    <div className="space-y-6">
      {trainer.bio && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
            Sobre
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
            {trainer.bio}
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {trainer.yearsExperience > 0 && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Experiência</p>
            <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {trainer.yearsExperience}{' '}
              <span className="text-sm font-normal text-slate-500">
                {trainer.yearsExperience === 1 ? 'ano' : 'anos'}
              </span>
            </p>
          </div>
        )}
        {trainer.pricePerSession != null && (
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800/40">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Sessão a partir de</p>
            <p className="text-lg font-bold text-violet-700 dark:text-violet-300">
              R$ {trainer.pricePerSession.toFixed(0)}
            </p>
          </div>
        )}
      </div>

      {trainer.specialties.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
            Especialidades
          </h3>
          <div className="flex flex-wrap gap-2">
            {trainer.specialties.map((s) => (
              <span
                key={s}
                className="text-sm px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-3">
          Detalhes
        </h3>
        <div className="space-y-2.5">
          {(trainer.city || trainer.state) && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <MapPin size={16} className="text-slate-400 shrink-0" />
              {[trainer.city, trainer.state].filter(Boolean).join(', ')}
            </div>
          )}
          <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            {MODALITY_ICON[trainer.modality]}
            <span className="text-slate-400" aria-hidden>·</span>
            {MODALITY_LABEL[trainer.modality]}
          </div>
          {trainer.cref && (
            <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              {trainer.crefVerified ? (
                <BadgeCheck size={16} className="text-violet-500 shrink-0" />
              ) : (
                <BadgeCheck size={16} className="text-slate-400 shrink-0" />
              )}
              {trainer.cref}
              {trainer.crefVerified && (
                <span className="text-xs text-violet-600 dark:text-violet-400 font-medium">
                  Verificado
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Agenda tab ----------------------------------------------------------------

function AgendaTab({ slots }: { slots: TrainerAvailabilitySlot[] }) {
  // Group slots by day_of_week
  const byDay: Record<number, TrainerAvailabilitySlot[]> = {};
  for (const slot of slots) {
    if (!byDay[slot.dayOfWeek]) byDay[slot.dayOfWeek] = [];
    byDay[slot.dayOfWeek].push(slot);
  }

  const activeDays = [1, 2, 3, 4, 5, 6, 0].filter((d) => byDay[d] && byDay[d].length > 0);

  if (activeDays.length === 0) {
    return (
      <div className="text-center py-16">
        <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Nenhum horário cadastrado ainda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Horários de atendimento recorrentes por dia da semana.
      </p>
      {activeDays.map((dow) => (
        <div
          key={dow}
          className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        >
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {DAY_NAMES[dow]}
            </span>
          </div>
          <div className="p-4 flex flex-wrap gap-2">
            {byDay[dow].sort((a, b) => a.startTime.localeCompare(b.startTime)).map((slot) => (
              <span
                key={slot.id}
                className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40"
              >
                <Clock size={11} />
                {slot.startTime.slice(0, 5)} – {slot.endTime.slice(0, 5)}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// -- Reviews tab ---------------------------------------------------------------

function RatingBar({ star, count, total }: { star: number; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
      <span className="w-4 text-right">{star}</span>
      <Star size={10} className="text-amber-400 fill-amber-400 shrink-0" />
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-amber-400"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-6 text-right">{count}</span>
    </div>
  );
}

function ReviewCard({ review }: { review: TrainerRating }) {
  const initials = review.alunoNome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
  const hue = Array.from(review.alunoNome).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 space-y-3">
      <div className="flex items-start gap-3">
        {review.alunoAvatarUrl ? (
          <img
            src={review.alunoAvatarUrl}
            alt={review.alunoNome}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
            style={{
              background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${(hue + 40) % 360},70%,40%))`,
            }}
          >
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            {review.alunoNome}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <StarRow count={review.rating} size={11} />
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(review.createdAt).toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>
      {review.comentario && (
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          {review.comentario}
        </p>
      )}
    </div>
  );
}

function AvaliacoesTab({ trainer }: { trainer: TrainerDetail }) {
  const { ratings, rating, ratingCount } = trainer;

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    distribution[r.rating] = (distribution[r.rating] ?? 0) + 1;
  }

  if (ratingCount === 0) {
    return (
      <div className="text-center py-16">
        <Star className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma avaliação ainda.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex gap-6 p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
        <div className="text-center shrink-0">
          <p className="text-5xl font-bold text-slate-800 dark:text-slate-100">
            {rating.toFixed(1)}
          </p>
          <StarRow count={Math.round(rating)} size={14} />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ratingCount} avaliações</p>
        </div>
        <div className="flex-1 space-y-1.5">
          {[5, 4, 3, 2, 1].map((star) => (
            <RatingBar
              key={star}
              star={star}
              count={distribution[star] ?? 0}
              total={ratingCount}
            />
          ))}
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-3">
        {ratings.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </div>
  );
}

// -- Page ----------------------------------------------------------------------

export default function PersonalPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('sobre');

  const { data: trainer, isLoading, error } = useTrainerById(id);

  if (isLoading) return <ProfileSkeleton />;

  if (error || !trainer) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 dark:text-slate-400">
          {error ? 'Erro ao carregar o perfil.' : 'Personal não encontrado.'}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-violet-600 dark:text-violet-400 text-sm hover:underline"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 mt-4 mb-5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
      >
        <ArrowLeft size={16} />
        Voltar
      </button>

      {/* Hero */}
      <div className="flex gap-5 mb-6">
        {trainer.avatarUrl ? (
          <img
            src={trainer.avatarUrl}
            alt={trainer.name}
            className="w-24 h-24 rounded-2xl object-cover shrink-0"
          />
        ) : (
          <InitialsAvatar name={trainer.name} className="w-24 h-24 rounded-2xl text-2xl shrink-0" />
        )}

        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">{trainer.name}</h1>

          {trainer.cref && (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              {trainer.cref}
              {trainer.crefVerified && (
                <BadgeCheck size={14} className="text-violet-500 shrink-0" />
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-2">
            {(trainer.city || trainer.state) && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={12} />
                {[trainer.city, trainer.state].filter(Boolean).join(', ')}
              </span>
            )}
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              {MODALITY_ICON[trainer.modality]}
              {MODALITY_LABEL[trainer.modality]}
            </span>
          </div>

          {trainer.ratingCount > 0 && (
            <div className="flex items-center gap-1.5 mt-2">
              <Star size={13} className="text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {trainer.rating.toFixed(1)}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ({trainer.ratingCount} avaliações)
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3 mb-7">
        <button
          onClick={() => navigate(`/aluno/chat?to=${trainer.personalId}`)}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        >
          <MessageCircle size={16} />
          Mensagem
        </button>
        <button
          onClick={() => setTab('agenda')}
          className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold transition-colors"
        >
          Agendar sessão
        </button>
      </div>

      {/* Tabs */}
      <TabBar active={tab} onChange={setTab} ratingCount={trainer.ratingCount} />

      {/* Tab content */}
      {tab === 'sobre' && <AboutTab trainer={trainer} />}
      {tab === 'agenda' && <AgendaTab slots={trainer.availability} />}
      {tab === 'avaliacoes' && <AvaliacoesTab trainer={trainer} />}
    </div>
  );
}
