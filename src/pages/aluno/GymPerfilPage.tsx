import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  MapPin,
  Phone,
  Globe,
  Instagram,
  Clock,
  Dumbbell,
  CheckCircle2,
  MessageCircle,
} from 'lucide-react';
import { useGymById } from '../../hooks/useGyms';
import { Skeleton } from '../../components/ui';
import type { GymPlan, GymRating, GymSchedule } from '../../services/gyms';

// ── Day labels ────────────────────────────────────────────────────────────────

const DAY_LABELS: Record<keyof GymSchedule, string> = {
  segunda: 'Segunda',
  terca: 'Terça',
  quarta: 'Quarta',
  quinta: 'Quinta',
  sexta: 'Sexta',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

// ── PlanCard ──────────────────────────────────────────────────────────────────

function PlanCard({ plan, highlighted }: { plan: GymPlan; highlighted: boolean }) {
  const navigate = useNavigate();
  return (
    <div
      className={`rounded-2xl p-5 flex flex-col gap-4 border ${
        highlighted
          ? 'bg-violet-600 border-violet-500 text-white'
          : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
      }`}
    >
      <div>
        <h3
          className={`font-bold text-lg ${
            highlighted ? 'text-white' : 'text-slate-800 dark:text-slate-100'
          }`}
        >
          {plan.nome}
        </h3>
        {plan.descricao && (
          <p
            className={`text-sm mt-0.5 ${
              highlighted ? 'text-violet-100' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {plan.descricao}
          </p>
        )}
      </div>

      <div className="flex items-baseline gap-1">
        <span
          className={`text-3xl font-extrabold ${
            highlighted ? 'text-white' : 'text-violet-600 dark:text-violet-400'
          }`}
        >
          R$ {plan.preco.toFixed(2).replace('.', ',')}
        </span>
        <span
          className={`text-sm ${
            highlighted ? 'text-violet-200' : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          /{plan.duracaoDias === 30 ? 'mês' : plan.duracaoDias === 365 ? 'ano' : `${plan.duracaoDias}d`}
        </span>
      </div>

      {plan.beneficios.length > 0 && (
        <ul className="space-y-1.5">
          {plan.beneficios.map((b) => (
            <li key={b} className="flex items-center gap-2 text-sm">
              <CheckCircle2
                className={`w-4 h-4 shrink-0 ${
                  highlighted ? 'text-violet-200' : 'text-violet-500'
                }`}
              />
              <span className={highlighted ? 'text-violet-50' : 'text-slate-600 dark:text-slate-300'}>
                {b}
              </span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => navigate(`/aluno/checkout/${plan.id}`)}
        className={`mt-auto w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
          highlighted
            ? 'bg-white text-violet-700 hover:bg-violet-50'
            : 'bg-violet-600 hover:bg-violet-700 text-white'
        }`}
      >
        Assinar
      </button>
    </div>
  );
}

// ── ReviewCard ────────────────────────────────────────────────────────────────

function ReviewCard({ review }: { review: GymRating }) {
  const initials = review.alunoNome
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  const date = new Date(review.createdAt).toLocaleDateString('pt-BR', {
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
      <div className="flex items-start gap-3">
        {review.alunoAvatarUrl ? (
          <img
            src={review.alunoAvatarUrl}
            alt={review.alunoNome}
            className="w-9 h-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-sm text-slate-800 dark:text-slate-100">
              {review.alunoNome}
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0">{date}</span>
          </div>
          <div className="flex items-center gap-0.5 mt-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star
                key={s}
                className={`w-3 h-3 ${
                  s <= review.rating
                    ? 'fill-amber-400 text-amber-400'
                    : 'text-slate-300 dark:text-slate-600'
                }`}
              />
            ))}
          </div>
          {review.comentario && (
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 line-clamp-4">
              {review.comentario}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page skeleton ─────────────────────────────────────────────────────────────

function GymPerfilSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      <Skeleton className="h-6 w-24" />
      <Skeleton className="h-52 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Skeleton className="h-52 rounded-2xl" />
        <Skeleton className="h-52 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Tab type ──────────────────────────────────────────────────────────────────

type Tab = 'sobre' | 'planos' | 'avaliacoes';

// ── Main page ─────────────────────────────────────────────────────────────────

export default function GymPerfilPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('sobre');
  const [photoIdx, setPhotoIdx] = useState(0);

  const { data: gym, isLoading, isError } = useGymById(id);

  if (isLoading) return <GymPerfilSkeleton />;

  if (isError || !gym) {
    return (
      <div className="max-w-3xl mx-auto p-4 text-center mt-16">
        <p className="text-slate-500 dark:text-slate-400">Academia não encontrada.</p>
        <button
          onClick={() => navigate('/aluno/academias')}
          className="mt-4 text-violet-600 dark:text-violet-400 text-sm font-medium hover:underline"
        >
          Voltar ao marketplace
        </button>
      </div>
    );
  }

  const photos = gym.fotos;
  const hasPhotos = photos.length > 0;

  const avgRating = gym.rating;
  const ratingDist = [5, 4, 3, 2, 1].map((s) => ({
    star: s,
    count: gym.ratings.filter((r) => Math.round(r.rating) === s).length,
  }));

  const lowestPlan = gym.plans.length
    ? gym.plans.reduce((min, p) => (p.preco < min.preco ? p : min))
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate('/aluno/academias')}
        className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors mt-4 mb-5"
      >
        <ChevronLeft className="w-4 h-4" />
        Academias
      </button>

      {/* Photo gallery */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-900/30 dark:to-indigo-900/30 h-52 mb-5 flex items-center justify-center">
        {hasPhotos ? (
          <>
            <img
              src={photos[photoIdx]}
              alt={`foto ${photoIdx + 1}`}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <>
                <button
                  onClick={() => setPhotoIdx((i) => (i - 1 + photos.length) % photos.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setPhotoIdx((i) => (i + 1) % photos.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {photos.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setPhotoIdx(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-colors ${
                        i === photoIdx ? 'bg-white' : 'bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <Dumbbell className="w-12 h-12 text-violet-400 dark:text-violet-500" />
        )}

        {/* Logo overlay */}
        {gym.logoUrl && (
          <div className="absolute bottom-3 left-3 w-14 h-14 rounded-xl bg-white dark:bg-slate-800 shadow-md p-1 flex items-center justify-center">
            <img src={gym.logoUrl} alt="logo" className="w-full h-full object-contain rounded-lg" />
          </div>
        )}
      </div>

      {/* Header info */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">{gym.nome}</h1>

        <div className="flex items-center gap-2 flex-wrap mt-1.5">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {avgRating > 0 ? avgRating.toFixed(1) : '—'}
            </span>
            {gym.ratingCount > 0 && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                ({gym.ratingCount} avaliações)
              </span>
            )}
          </div>

          {(gym.endereco.bairro || gym.endereco.cidade) && (
            <span className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="w-3.5 h-3.5" />
              {[gym.endereco.bairro, gym.endereco.cidade].filter(Boolean).join(', ')}
            </span>
          )}

          {lowestPlan && (
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400">
              A partir de R$ {lowestPlan.preco.toFixed(2).replace('.', ',')}/mês
            </span>
          )}
        </div>

        {/* Contact row */}
        <div className="flex items-center gap-4 mt-3 flex-wrap text-xs text-slate-500 dark:text-slate-400">
          {gym.telefone && (
            <a href={`tel:${gym.telefone}`} className="flex items-center gap-1 hover:text-violet-600 transition-colors">
              <Phone className="w-3.5 h-3.5" />
              {gym.telefone}
            </a>
          )}
          {gym.website && (
            <a href={gym.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-violet-600 transition-colors">
              <Globe className="w-3.5 h-3.5" />
              Website
            </a>
          )}
          {gym.instagram && (
            <a
              href={`https://instagram.com/${gym.instagram.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-violet-600 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5" />
              {gym.instagram}
            </a>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
        {(['sobre', 'planos', 'avaliacoes'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              tab === t
                ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t === 'avaliacoes' ? 'Avaliações' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab: Sobre */}
      {tab === 'sobre' && (
        <div className="space-y-6">
          {gym.descricao && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">
                Sobre
              </h2>
              <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                {gym.descricao}
              </p>
            </div>
          )}

          {/* Modalidades */}
          {gym.modalidades.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">
                Modalidades
              </h2>
              <div className="flex flex-wrap gap-2">
                {gym.modalidades.map((m) => (
                  <span
                    key={m}
                    className="text-sm bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-3 py-1 rounded-full font-medium"
                  >
                    {m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Horários */}
          {Object.keys(gym.horarios).length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-violet-500" />
                Horários de funcionamento
              </h2>
              <div className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden divide-y divide-slate-100 dark:divide-slate-700">
                {(Object.entries(gym.horarios) as [keyof GymSchedule, string][]).map(
                  ([day, hours]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between px-4 py-2.5 bg-white dark:bg-slate-800 text-sm"
                    >
                      <span className="font-medium text-slate-700 dark:text-slate-200">
                        {DAY_LABELS[day] ?? day}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">{hours}</span>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* Address */}
          {(gym.endereco.rua || gym.endereco.bairro) && (
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-violet-500" />
                Endereço
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {[gym.endereco.rua, gym.endereco.numero].filter(Boolean).join(', ')}
                {gym.endereco.bairro && ` — ${gym.endereco.bairro}`}
                {gym.endereco.cidade && `, ${gym.endereco.cidade}`}
                {gym.endereco.estado && ` - ${gym.endereco.estado}`}
                {gym.endereco.cep && `, CEP ${gym.endereco.cep}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab: Planos */}
      {tab === 'planos' && (
        <div>
          {gym.plans.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <Dumbbell className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nenhum plano disponível no momento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {gym.plans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan} highlighted={i === 0} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Avaliações */}
      {tab === 'avaliacoes' && (
        <div className="space-y-5">
          {/* Rating summary */}
          {gym.ratingCount > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-start gap-6">
              <div className="text-center shrink-0">
                <p className="text-5xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">
                  {avgRating.toFixed(1)}
                </p>
                <div className="flex items-center gap-0.5 justify-center mt-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`w-3.5 h-3.5 ${
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {gym.ratingCount} avaliações
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {ratingDist.map(({ star, count }) => {
                  const pct = gym.ratingCount ? Math.round((count / gym.ratingCount) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 w-3">{star}</span>
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 shrink-0" />
                      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 dark:text-slate-500 w-6 text-right">
                        {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {gym.ratings.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Ainda sem avaliações.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {gym.ratings.map((r) => (
                <ReviewCard key={r.id} review={r} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
