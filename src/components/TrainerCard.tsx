import { useNavigate } from 'react-router-dom';
import { Star, MapPin, BadgeCheck, Wifi, Users, Dumbbell } from 'lucide-react';
import { Skeleton } from './ui';
import type { TrainerListItem } from '../services/trainers';

// ── Helpers ────────────────────────────────────────────────────────────────────

const MODALITY_ICON: Record<string, React.ReactNode> = {
  online: <Wifi size={12} />,
  presencial: <Dumbbell size={12} />,
  ambos: <Users size={12} />,
};

const MODALITY_LABEL: Record<string, string> = {
  online: 'Online',
  presencial: 'Presencial',
  ambos: 'Online & Presencial',
};

function InitialsAvatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');

  // Deterministic color from name
  const hue = Array.from(name).reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;

  return (
    <div
      className={`flex items-center justify-center font-semibold text-white ${className ?? ''}`}
      style={{ background: `linear-gradient(135deg, hsl(${hue},65%,50%), hsl(${(hue + 40) % 360},70%,40%))` }}
    >
      {initials}
    </div>
  );
}

// ── TrainerCard ────────────────────────────────────────────────────────────────

interface TrainerCardProps {
  trainer: TrainerListItem;
}

export default function TrainerCard({ trainer }: TrainerCardProps) {
  const navigate = useNavigate();

  const {
    id,
    name,
    avatarUrl,
    cref,
    crefVerified,
    specialties,
    yearsExperience,
    modality,
    city,
    state,
    pricePerSession,
    rating,
    ratingCount,
    availableToday,
  } = trainer;

  const visibleSpecialties = specialties.slice(0, 3);
  const extraSpecialties = specialties.length - visibleSpecialties.length;

  return (
    <article className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Header: avatar + name + badges */}
      <div className="flex gap-4 p-4">
        {/* Avatar */}
        <div className="relative shrink-0">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <InitialsAvatar name={name} className="w-16 h-16 rounded-full text-lg" />
          )}
          {availableToday && (
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" title="Disponível hoje" />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">{name}</h3>
              {cref && (
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                  <span>{cref}</span>
                  {crefVerified && (
                    <BadgeCheck size={13} className="text-violet-500 shrink-0" />
                  )}
                </p>
              )}
            </div>
            {availableToday && (
              <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700">
                Disponível hoje
              </span>
            )}
          </div>

          {/* Location & exp */}
          <div className="flex flex-wrap gap-2 mt-1.5">
            {(city || state) && (
              <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <MapPin size={12} />
                {[city, state].filter(Boolean).join(', ')}
              </span>
            )}
            {yearsExperience > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {yearsExperience} {yearsExperience === 1 ? 'ano' : 'anos'} de exp.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 flex flex-col gap-3 flex-1">
        {/* Specialties */}
        {specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleSpecialties.map((s) => (
              <span
                key={s}
                className="text-[11px] px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700/50"
              >
                {s}
              </span>
            ))}
            {extraSpecialties > 0 && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                +{extraSpecialties} mais
              </span>
            )}
          </div>
        )}

        {/* Rating + modality */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Star size={13} className="text-amber-400 fill-amber-400" />
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {ratingCount > 0 ? rating.toFixed(1) : '—'}
            </span>
            {ratingCount > 0 && (
              <span className="text-xs text-slate-500 dark:text-slate-400">({ratingCount})</span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            {MODALITY_ICON[modality]}
            {MODALITY_LABEL[modality]}
          </span>
        </div>

        {/* Price */}
        {pricePerSession != null && (
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
            R$ {pricePerSession.toFixed(0)}
            <span className="font-normal text-slate-500 dark:text-slate-400"> / sessão</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-1">
          <button
            onClick={() => navigate(`/aluno/personais/${id}`)}
            className="flex-1 text-sm font-medium py-2 rounded-xl border border-violet-500 text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors"
          >
            Ver perfil
          </button>
          <button
            onClick={() => navigate(`/aluno/personais/${id}`)}
            className="flex-1 text-sm font-semibold py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors"
          >
            Agendar
          </button>
        </div>
      </div>
    </article>
  );
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

export function TrainerCardSkeleton() {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 dark:border-slate-700/60 bg-white dark:bg-slate-800 overflow-hidden">
      <div className="flex gap-4 p-4">
        <Skeleton className="w-16 h-16 rounded-full shrink-0" />
        <div className="flex-1 space-y-2 pt-1">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="px-4 pb-4 space-y-3">
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-16" />
        <div className="flex gap-2 pt-1">
          <Skeleton className="flex-1 h-9 rounded-xl" />
          <Skeleton className="flex-1 h-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
