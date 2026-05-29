import { MapPin, Star, Dumbbell, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from './ui';
import type { GymListItem } from '../services/gyms';

// ── GymCard ────────────────────────────────────────────────────────────────────

interface GymCardProps {
  gym: GymListItem;
}

export default function GymCard({ gym }: GymCardProps) {
  const navigate = useNavigate();

  const visibleTags = gym.modalidades.slice(0, 3);
  const extraCount = gym.modalidades.length - visibleTags.length;

  const bairro = gym.endereco.bairro;
  const cidade = gym.endereco.cidade;
  const addressLine = [bairro, cidade].filter(Boolean).join(', ') || 'Endereço não informado';

  const fullStars = Math.floor(gym.rating);
  const hasHalf = gym.rating - fullStars >= 0.5;

  return (
    <article className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col transition-shadow hover:shadow-md">
      {/* Cover / logo */}
      <div className="relative h-36 bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 flex items-center justify-center overflow-hidden">
        {gym.fotos[0] ? (
          <img
            src={gym.fotos[0]}
            alt={gym.nome}
            className="w-full h-full object-cover"
          />
        ) : null}
        {gym.logoUrl && (
          <div className="absolute bottom-3 left-3 w-12 h-12 rounded-xl bg-white dark:bg-slate-800 shadow p-1 flex items-center justify-center">
            <img src={gym.logoUrl} alt="logo" className="w-full h-full object-contain rounded-lg" />
          </div>
        )}
        {!gym.logoUrl && !gym.fotos[0] && (
          <Dumbbell className="w-10 h-10 text-violet-400 dark:text-violet-500" />
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Name + address */}
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 line-clamp-1">
            {gym.nome}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0" />
            {addressLine}
          </p>
        </div>

        {/* Modality tags */}
        {gym.modalidades.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {visibleTags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-full font-medium"
              >
                {tag}
              </span>
            ))}
            {extraCount > 0 && (
              <span className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                +{extraCount} mais
              </span>
            )}
          </div>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3.5 h-3.5 ${
                  s <= fullStars
                    ? 'fill-amber-400 text-amber-400'
                    : s === fullStars + 1 && hasHalf
                    ? 'fill-amber-200 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {gym.rating > 0 ? gym.rating.toFixed(1) : '—'}
          </span>
          {gym.ratingCount > 0 && (
            <span className="text-xs text-slate-400 dark:text-slate-500">
              ({gym.ratingCount})
            </span>
          )}
        </div>

        {/* Spacer + price + CTA */}
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {gym.precoMinimo !== undefined ? (
              <>
                A partir de{' '}
                <span className="font-bold text-violet-600 dark:text-violet-400">
                  R$ {gym.precoMinimo.toFixed(2).replace('.', ',')}/mês
                </span>
              </>
            ) : (
              <span className="text-slate-400 dark:text-slate-500 text-xs">
                Planos não disponíveis
              </span>
            )}
          </p>
          <button
            onClick={() => navigate(`/aluno/academias/${gym.id}`)}
            className="flex items-center gap-1 text-xs font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            Ver planos
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </article>
  );
}

// ── GymCardSkeleton ────────────────────────────────────────────────────────────

export function GymCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden flex flex-col">
      <Skeleton className="h-36 rounded-none" />
      <div className="p-4 flex flex-col gap-3">
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        <div className="flex gap-1.5">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-14 rounded-full" />
        </div>
        <Skeleton className="h-3.5 w-24" />
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-7 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
